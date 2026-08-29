<div align="center">

# SafetyIQ

### A Production-Oriented Computer Vision  System for Construction Site Safety Intelligence

*Fine-tuned real-time PPE compliance detection, coupled with a grounded incident-reporting pipeline, deployed as a full-stack, containerized system.*

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![YOLO](https://img.shields.io/badge/YOLOv11m-Ultralytics-00FFFF?style=flat-square)](https://github.com/ultralytics/ultralytics)

</div>

---

## Abstract

Automated PPE-detection demonstrations are common nowadays; automated PPE-detection **systems** are not. Most published prototypes end at the bounding box, a model that draws boxes around hardhats in a Jupyter notebook, with no path from detection to decision. **SafetyIQ** is built to close that gap. The system fine-tunes **YOLOv11m** on a curated, class-imbalance-corrected, 44,002-image, 9-class PPE dataset, and pairs it with a **retrieval-augmented generation (RAG) pipeline** `sentence-transformers → ChromaDB → T5-base`, that synthesizes grounded, hallucination-resistant incident reports from structured detection logs, rather than free-associating from an LLM's parametric memory. Both are wrapped in a normalized relational schema, a FastAPI/WebSocket real-time inference service, a React dashboard, and a Docker Compose deployment, so the result is a coherent engineering artifact rather than a stitched-together demo.

The project was undertaken as an independent prototype model with the explicit goal of demonstrating **end-to-end AI systems engineering**: dataset curation and correction, model fine-tuning, retrieval-grounded NLP, relational data modeling, and production packaging, evaluated quantitatively at every stage rather than assessed by inspection.

---

## Why This Exists

Two observations motivated this project:

1. **Detection without downstream structure has limited operational value.** A bounding box that isn't logged, aggregated, queried, or reasoned over doesn't change site behavior. Safety-critical systems need a path from *pixel* to *decision*.
2. **Most RAG implementations under-specify grounding.** Bolting a general-purpose LLM onto a log file and prompting it to "summarize incidents" invites hallucination on exactly the kind of structured, high-stakes data where hallucination is least acceptable. SafetyIQ instead treats report generation as a **constrained synthesis problem** over retrieved, verified records,  evaluated with ROUGE and BERTScore, not read-through approval.

---

## System Architecture

```
┌───────────────────┐      WebSocket         ┌─────────────────────┐
│   Camera Feed     │ ────────────────────▶  │  FastAPI Inference  │
│   (OpenCV)        │                        │  Service (YOLOv11m) │
└───────────────────┘                        └──────────┬──────────┘
                                                        │ annotated frames +
                                                        │ structured detections
                                                        ▼
                                          ┌───────────────────────────┐
                                          │   PostgreSQL              │
                                          │   (SQLAlchemy + Alembic)  │
                                          │   5-table relational      │
                                          │   schema                  │
                                          └──────────┬────────────────┘
                                                     │
                            ┌────────────────────────┼──────────────────────────┐
                            ▼                                                   ▼
                ┌─────────────────────────┐                        ┌───────────────────────┐
                │  RAG Pipeline           │                        │  React + Vite         │
                │  sentence-transformers  │                        │  Dashboard            │
                │  → ChromaDB → T5-base   │                        │  REST + WebSocket     │
                └─────────────────────────┘                        └───────────────────────┘
```

All services are orchestrated via **Docker Compose** for reproducible, one-command deployment, no manually-managed local environment, no "works on my machine."

---

## Computer Vision Pipeline

The detection backbone is **YOLOv11m**, fine-tuned on a curated **44,002-image, 9-class PPE dataset** (Hardhat, NO-Hardhat, Safety Vest, NO-Safety Vest, Mask, NO-Mask, Gloves, NO-Gloves, Person).

**Engineering pipeline, not just "trained a model":**

- **Class-imbalance correction.** The raw dataset exhibited a **29.3× imbalance** between majority and minority classes, severe enough to bias any model toward ignoring rare-but-safety-critical classes (e.g., NO-Gloves). Correction combined targeted undersampling of majority-class-only images with capped, augmentation-diversified oversampling of minority classes, never blind duplication.
- **Non-degenerate augmentation.** Mosaic, copy-paste, and affine/HSV transforms were applied per-instance during oversampling, so duplicated minority-class samples were never pixel-identical to their source. Every synthetic "extra" copy contributes a genuinely new gradient signal instead of just increasing loss-weight on a memorized image.
- **Image-level vs. instance-level balancing.** Object detection is inherently multi-label, one image can contain several co-occurring classes. Balancing was done at the instance/box level, avoiding the common failure mode of naively duplicating whole images and re-inflating the majority class in the process.
- **Training regime.** 50 epochs on a Tesla T4, mosaic augmentation closed for the final epochs (per Ultralytics' `close_mosaic` schedule) so the model's final weights are fine-tuned on clean, real-world-representative images rather than synthetic stitched composites, matching production inference conditions.
- **Evaluation integrity.** Validation and test splits preserved the original, unbalanced class distribution throughout. Metrics below reflect real-world detection difficulty, not an artificially rebalanced evaluation set.

---

## NLP / RAG Incident Intelligence

Rather than treating "AI reporting" as an LLM wrapper around a database, SafetyIQ implements a **grounded retrieval pipeline** purpose-built for structured safety data:

- **Embedding generation** via `sentence-transformers`, indexing structured violation records (zone, class, confidence, timestamp, camera) into dense vector space.
- **Vector retrieval** via **ChromaDB**, surfacing the specific incident records relevant to a natural-language query.
- **Grounded synthesis** via **T5-base**, constrained to condition generation on retrieved records r,educing the model's ability to fabricate incidents that were never logged.
- **Evaluation against ground truth**, using **ROUGE-1/2/L** and **BERTScore** rather than subjective read-throughs, so report quality is a reported number, not an impression.

This allows a site supervisor to ask a question like *"What zones had the most hardhat violations this week?"* and receive an answer synthesized from real, logged detections, not a plausible-sounding guess.

---

## Data Layer

- **5-table normalized relational schema** (cameras/zones, detections, violations, incident reports, users/roles), implemented with **SQLAlchemy ORM**.
- **Alembic migrations** for versioned, reproducible schema evolution, schema changes are tracked artifacts, not manual ALTER statements.
- Every YOLO detection is **auto-logged**; violations are **auto-flagged** by confidence threshold and PPE class, removing manual triage as a bottleneck between detection and record.

---

## Real-Time Inference Pipeline

- **FastAPI + WebSocket** streaming architecture ingests live OpenCV camera frames.
- **YOLOv11m** runs inference directly in the real-time path, returning annotated frames with **Critical / High / Medium** risk-level overlays.
- **Sub-20ms per-frame latency**, keeping the pipeline viable for genuine real-time monitoring rather than batch-delayed review.

---

## Dashboard

Built with **React + Vite**, consuming both REST and WebSocket APIs:

- Live annotated camera feed with overlaid violation bounding boxes and risk levels.
- Zone-level violation aggregation and trend visualization.
- Natural-language query interface, backed directly by the RAG pipeline.
- Auto-generated, exportable safety reports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Computer Vision** | YOLOv11 (Ultralytics), OpenCV, Albumentations |
| **Backend** | FastAPI, WebSocket, Python 3.12 |
| **NLP / RAG** | sentence-transformers, ChromaDB, T5-base |
| **Database** | PostgreSQL, SQLAlchemy ORM, Alembic |
| **Frontend** | React, Vite |
| **Infrastructure** | Docker, Docker Compose |
| **Evaluation** | ROUGE-1/2/L, BERTScore, mAP@0.5 |

---

## Results

| Metric | Value |
|---|---|
| Dataset size | 44,002 images, 9 PPE classes |
| Pre-correction class imbalance | 29.3× |
| mAP@0.5 (YOLOv11m, epoch 50) | **[74]** |
| Real-time inference latency | **< 20 ms/frame** |
| Report evaluation | ROUGE-1/2/L, BERTScore *(see `/docs/evaluation`)* |

> Reported detection metrics are computed on an unbalanced, held-out validation/test split, the same distribution the model will face in deployment — rather than a rebalanced evaluation set, which would inflate apparent performance on rare classes.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/<your-username>/safetyiq.git
cd safetyiq

# Launch the full stack
docker compose up --build
```

The dashboard will be available at `http://localhost:<port>`, with the inference API and WebSocket stream running as separately orchestrated services.

> Full setup instructions, environment variables, and model weight download links are documented in [`/docs`](./docs).

---

## Project Context

SafetyIQ was developed as an independent **Final Year Project**, engineered end-to-end: raw dataset curation and class-imbalance correction, model fine-tuning and evaluation, relational schema design, retrieval-grounded NLP, real-time inference infrastructure, and a deployable full-stack interface b,uilt to demonstrate **production-oriented AI systems engineering**, not a single-notebook proof of concept.
