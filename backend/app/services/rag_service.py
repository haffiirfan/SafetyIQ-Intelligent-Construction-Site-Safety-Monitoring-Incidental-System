"""
app/services/rag_service.py

Retrieval-augmented generation over logged safety violations.

Pipeline:
  1. Every violation is turned into a short natural-language description
     and embedded with sentence-transformers.
  2. Embeddings are stored in a local, persistent ChromaDB collection.
  3. At query time, the question is embedded and the top-k most similar
     violation records are retrieved.
  4. Qwen2.5-1.5B-Instruct generates an answer CONSTRAINED to those
     retrieved records only — it is given the retrieved text as context
     and instructed to answer only from it. This is what keeps the
     system "grounded" rather than a free-form LLM guess.

Model history / decisions:
  - README originally specified T5-base. First working version used
    flan-t5-base (instruction-tuned, unlike plain T5-base) as a fast,
    lightweight MVP model.
  - Upgraded here to Qwen2.5-1.5B-Instruct: a proper decoder-only
    instruction-tuned chat model. Produces noticeably more fluent,
    natural, detailed answers than flan-t5-base, while still being
    realistic to run on CPU (a few seconds per answer, not minutes).
  - IMPORTANT LIMITATION: this system has no per-employee identity
    tracking (no face recognition / badge scanning / worker ID
    anywhere in the detection pipeline). The model can only speak
    from what is actually retrieved from ChromaDB — it will never
    name a specific employee, because that data does not exist.
    Asking it to would force hallucination, which defeats the
    purpose of grounding. Per-employee attribution would require a
    separate feature (worker identification at each camera zone,
    a new `employee_id` column on Detection/Violation, and including
    that in the indexed text) — not something a bigger model alone
    can provide.
"""

import os
import json
import chromadb
import torch
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_store")
GEN_MODEL_NAME = "Qwen/Qwen2.5-1.5B-Instruct"


class RAGService:
    def __init__(self):
        self.embedder = None
        self.gen_tokenizer = None
        self.gen_model = None
        self.collection = None
        self._loaded = False

    def preload(self):
        """Explicitly load models — call this once at server startup,
        NOT lazily during a live request. Loading a large model
        synchronously inside a live WebSocket loop would freeze the
        entire server until it's ready."""
        self._lazy_load()

    def _lazy_load(self):
        if self._loaded:
            return

        print(f"Loading RAG models (sentence-transformers + {GEN_MODEL_NAME})...")
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

        self.gen_tokenizer = AutoTokenizer.from_pretrained(GEN_MODEL_NAME)
        self.gen_model = AutoModelForCausalLM.from_pretrained(
            GEN_MODEL_NAME,
            torch_dtype=torch.float32,
        )

        client = chromadb.PersistentClient(path=CHROMA_PATH)
        self.collection = client.get_or_create_collection(
            name="violations",
            metadata={"hnsw:space": "cosine"},
        )

        self._loaded = True
        print("RAG models loaded.")

    def _violation_to_text(self, violation) -> str:
        """Turn a Violation row into a short natural-language sentence
        for embedding — this is what gets semantically matched against
        the user's question."""
        ts = violation.created_at.strftime("%Y-%m-%d %H:%M:%S") if violation.created_at else "unknown time"
        status = "resolved" if violation.resolved else "unresolved"
        return (
            f"{violation.risk_type} violation detected in {violation.zone} "
            f"at {ts}, severity {violation.severity}, currently {status}."
        )

    def index_violation(self, violation):
        """Add or update a single violation in the vector index.
        Call this right after a violation is created so the index
        stays live without needing a separate batch job."""
        self._lazy_load()
        text = self._violation_to_text(violation)
        embedding = self.embedder.encode(text).tolist()

        self.collection.upsert(
            ids=[f"violation_{violation.id}"],
            embeddings=[embedding],
            documents=[text],
            metadatas=[{
                "violation_id": violation.id,
                "zone": violation.zone,
                "severity": violation.severity,
                "risk_type": violation.risk_type,
                "resolved": violation.resolved,
            }],
        )

    def index_violations_bulk(self, violations):
        """Backfill many violations at once — used by the one-time
        backfill script for records that predate the RAG integration."""
        self._lazy_load()
        if not violations:
            return 0

        texts = [self._violation_to_text(v) for v in violations]
        embeddings = self.embedder.encode(texts).tolist()

        self.collection.upsert(
            ids=[f"violation_{v.id}" for v in violations],
            embeddings=embeddings,
            documents=texts,
            metadatas=[{
                "violation_id": v.id,
                "zone": v.zone,
                "severity": v.severity,
                "risk_type": v.risk_type,
                "resolved": v.resolved,
            } for v in violations],
        )
        return len(violations)

    def generate_report(self, violations: list) -> str:
        """Generate a structured incident report from a given set of
        violations. Counts, zone breakdown, and date range are computed
        directly in Python (100% accurate) — the LLM is only asked to
        write two short narrative sentences framing those facts, since
        small models are unreliable at counting things themselves.
        Returns a JSON string (stored as-is in IncidentReport.summary_text)."""
        self._lazy_load()

        if not violations:
            return json.dumps({
                "total": 0,
                "resolved": 0,
                "unresolved": 0,
                "zones": {},
                "date_range": None,
                "summary": "No violations match the current filters, so there is nothing to report.",
                "recommendation": "",
            })

        total = len(violations)
        resolved = sum(1 for v in violations if v.resolved)
        unresolved = total - resolved

        zones = {}
        for v in violations:
            zones[v.zone] = zones.get(v.zone, 0) + 1

        dates = [v.created_at for v in violations if v.created_at]
        if dates:
            start = min(dates).strftime("%d %b %Y")
            end = max(dates).strftime("%d %b %Y")
            date_range = start if start == end else f"{start} – {end}"
        else:
            date_range = None

        facts = (
            f"Total violations: {total}\n"
            f"Resolved: {resolved}\n"
            f"Unresolved: {unresolved}\n"
            f"By zone: {', '.join(f'{z} ({c})' for z, c in zones.items())}\n"
            f"Date range: {date_range or 'unknown'}"
        )

        system_prompt = (
            "You are the safety assistant for SafetyIQ, a construction site safety "
            "monitoring system. You will be given verified statistics about a set of "
            "logged violations. Write exactly two short sections, in plain sentences "
            "with NO markdown formatting (no asterisks, no headers, no bullet points, "
            "no dashes):\n"
            "SUMMARY: one or two sentences describing the overall pattern.\n"
            "RECOMMENDATION: one sentence suggesting a practical next step.\n"
            "Do not repeat the raw numbers verbatim in prose — describe the pattern "
            "in natural language instead. Never invent details beyond the statistics "
            "given, and never refer to a specific employee or worker by name."
        )
        user_prompt = f"Verified statistics:\n{facts}\n\nWrite the SUMMARY and RECOMMENDATION sections."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        text = self.gen_tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self.gen_tokenizer(text, return_tensors="pt")

        outputs = self.gen_model.generate(
            **inputs,
            max_new_tokens=180,
            min_new_tokens=25,
            do_sample=True,
            temperature=0.4,
            top_p=0.9,
            repetition_penalty=1.15,
        )
        generated = outputs[0][inputs["input_ids"].shape[-1]:]
        raw = self.gen_tokenizer.decode(generated, skip_special_tokens=True).strip()

        # Parse the two labeled sections out of the model's plain-text reply
        summary, recommendation = raw, ""
        if "RECOMMENDATION:" in raw:
            parts = raw.split("RECOMMENDATION:", 1)
            summary = parts[0].replace("SUMMARY:", "").strip()
            recommendation = parts[1].strip()
        elif "SUMMARY:" in raw:
            summary = raw.replace("SUMMARY:", "").strip()

        return json.dumps({
            "total": total,
            "resolved": resolved,
            "unresolved": unresolved,
            "zones": zones,
            "date_range": date_range,
            "summary": summary,
            "recommendation": recommendation,
        })

    def query(self, question: str, top_k: int = 5) -> dict:
        """Retrieve relevant violations and generate a grounded answer."""
        self._lazy_load()

        question_embedding = self.embedder.encode(question).tolist()
        results = self.collection.query(
            query_embeddings=[question_embedding],
            n_results=top_k,
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        if not documents:
            return {
                "answer": "There are no logged violations matching this question yet.",
                "sources": [],
            }

        context = "\n".join(f"- {d}" for d in documents)

        system_prompt = (
            "You are the safety assistant for SafetyIQ, a construction site safety "
            "monitoring system. You answer questions about logged PPE violations "
            "for a site safety manager. Always answer in clear, complete, natural "
            "sentences — the way you would speak to a colleague, not a one-word "
            "answer. Base your answer ONLY on the violation records provided as "
            "context. Do not invent details that are not in the context — in "
            "particular, never name or refer to a specific employee or worker, "
            "since this system does not track individual worker identity, only "
            "zones, timestamps, and violation types. If the context doesn't "
            "contain enough information to answer, say so plainly."
        )

        user_prompt = (
            f"Logged violation records:\n{context}\n\n"
            f"Question: {question}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        text = self.gen_tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self.gen_tokenizer(text, return_tensors="pt")

        outputs = self.gen_model.generate(
            **inputs,
            max_new_tokens=150,
            min_new_tokens=15,
            do_sample=True,
            temperature=0.4,
            top_p=0.9,
            repetition_penalty=1.15,
        )

        generated = outputs[0][inputs["input_ids"].shape[-1]:]
        answer = self.gen_tokenizer.decode(generated, skip_special_tokens=True).strip()

        return {
            "answer": answer,
            "sources": metadatas,
        }


rag_service = RAGService()