<div align="center">

# SafetyIQ

### An End-to-End Computer Vision and Retrieval-Augmented System for Construction Site Safety Intelligence

*Fine-tuned real-time PPE compliance detection, coupled with a grounded incident-reporting pipeline, deployed as a full-stack, containerized system.*

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![YOLO](https://img.shields.io/badge/YOLOv11m-Ultralytics-00FFFF?style=flat-square)](https://github.com/ultralytics/ultralytics)

</div>

---

## Abstract

Automated PPE-detection demonstrations are common; automated PPE-detection **systems** are not. Most published prototypes end at the bounding box a model that draws boxes around hardhats in a notebook, with no path from detection to decision. **SafetyIQ** closes that gap. The system fine-tunes **YOLOv11m** on a curated, class-imbalance-corrected PPE dataset, and pairs it with a **retrieval-augmented generation (RAG) pipeline** (`sentence-transformers → ChromaDB → Qwen2.5-1.5B-Instruct`) that synthesizes grounded incident summaries from structured detection logs, rather than free-associating from an LLM's parametric memory. Both are wrapped in a normalized relational schema, a FastAPI/WebSocket real-time inference service, a React dashboard, and a fully containerized Docker Compose deployment.

The project was undertaken as an independent, solo-built prototype with the explicit goal of demonstrating **end-to-end AI systems engineering**: dataset curation and class-imbalance correction, model fine-tuning, retrieval-grounded NLP, relational data modeling, real-time infrastructure, and containerized deployment, evaluated quantitatively, with results reported honestly, including the trade-offs and current limitations of a solo-developed, CPU-deployed system.

---

## Why This Exists

Two observations motivated this project:

1. **Detection without downstream structure has limited operational value.** A bounding box that isn't logged, aggregated, queried, or reasoned over doesn't change site behavior. Safety-critical systems need a path from *pixel* to *decision*.
2. **Most RAG implementations under-specify grounding.** Bolting a general-purpose LLM onto a log file and prompting it to "summarize incidents" invites hallucination on exactly the kind of structured, high-stakes data where hallucination is least acceptable. SafetyIQ instead treats report generation as a **constrained synthesis problem** over retrieved, verified database records.

---

## System Architecture

```
┌───────────────────┐      WebSocket         ┌─────────────────────┐
│   Camera Feed     │ ────────────────────▶ │  FastAPI Inference  │
│   (OpenCV)        │                        │  Service (YOLOv11m) │
└───────────────────┘                        └──────────┬──────────┘
                                                        │ structured
                                                        │ detections
                                                        ▼
                                          ┌───────────────────────────┐
                                          │   PostgreSQL              │
                                          │   (SQLAlchemy + Alembic)  │
                                          │   6-table relational      │
                                          │   schema                  │
                                          └─────────────┬─────────────┘
                                                        │
                            ┌───────────────────────────┼──────────────────────┐
                            ▼                                                  ▼
                ┌─────────────────────────┐                         ┌───────────────────────┐
                │  RAG Pipeline           │                         │  React + Vite         │
                │  sentence-transformers  │                         │  Dashboard            │
                │  → ChromaDB → Qwen2.5   │                         │  REST + WebSocket     │
                └─────────────────────────┘                         └───────────────────────┘
```

All services (PostgreSQL, backend, frontend) are orchestrated via **Docker Compose** for reproducible, one-command deployment, no manually-managed local environment, no "works on my machine."

---

## Computer Vision Pipeline

The detection backbone is **YOLOv11m**, fine-tuned on a curated **9-class PPE dataset** (Hardhat, NO-Hardhat, Safety Vest, NO-Safety Vest, Mask, NO-Mask, Gloves, NO-Gloves, Person), sourced from a public Kaggle PPE dataset and substantially re-engineered for this project.

**Engineering pipeline, not just "trained a model":**

- **Class-imbalance correction.** The raw dataset exhibited severe imbalance between majority classes (e.g., Hardhat) and minority, safety-critical classes (e.g., NO-Gloves, NO-Mask). Correction combined **capped undersampling** of majority-class-only images (capped at 15,000) with **augmentation-diversified oversampling** (2–3×) of minority classes, never blind duplication.
- **Non-degenerate augmentation.** Horizontal flips, brightness/contrast/HSV jitter, affine transforms, and Gaussian noise (via Albumentations) were applied per-instance during oversampling, so duplicated minority-class samples were never pixel-identical to their source.
- **Image-level filtering, instance-level balancing.** Object detection is inherently multi-label, one image can contain several co-occurring classes. Balancing decisions were made per-image based on which rare classes were present, avoiding the common failure mode of naively duplicating whole images and re-inflating the majority class.
- **Training regime.** 50 epochs, YOLO11m, mixed-precision (AMP), trained on a Tesla T4 GPU (Google Colab), with mosaic, HSV, and flip augmentation during training.

### Results (Verified)

| Metric | Value | Notes |
|---|---|---|
| mAP@0.5 | **0.738** (73.8%) | Best checkpoint, epoch 39/50 |
| mAP@0.5:0.95 | **0.489** (48.9%) | Stricter IoU-averaged metric |
| Precision | **0.661** (66.1%) | ~1 in 3 flagged detections is a false positive |
| Recall | **0.850** (85.0%) | Model misses only ~15% of real violations |
| Inference latency (CPU) | **~817 ms/frame** (median) | Intel i5-10210U, no GPU — see *Deployment Trade-offs* below |

> **On the precision/recall trade-off:** SafetyIQ's recall (85%) substantially exceeds its precision (66%), a deliberate consequence of the class-balancing strategy, which biased the model toward not missing rare violation classes. For a safety-critical system, this is the correct trade-off: a false alarm costs a supervisor a few seconds of review; a missed hardhat violation carries real physical risk. This asymmetry was a design choice, not an artifact.

> **On dataset difficulty:** the source dataset's raw class imbalance meant several PPE classes had an order of magnitude fewer labeled instances than the majority class prior to correction. The reported mAP reflects genuine detection difficulty on a still-imperfectly-balanced 9-class problem, not an inflated number computed on an artificially rebalanced evaluation set.

---

## RAG Pipeline — Incident Intelligence

Rather than treating "AI reporting" as an LLM wrapper around a database, SafetyIQ implements a **grounded retrieval pipeline** purpose-built for structured safety data:

- **Embedding generation** via `sentence-transformers`, indexing structured violation records (zone, class, confidence, timestamp, camera) into dense vector space.
- **Vector retrieval** via **ChromaDB**, surfacing the specific incident records relevant to a natural-language query.
- **Grounded synthesis** via **Qwen2.5-1.5B-Instruct**, constrained to condition its answer on retrieved records, reducing the model's ability to fabricate incidents that were never logged. In testing, when asked about a zone or violation with no matching database records, the system correctly reports the absence of data rather than inventing a plausible-sounding answer.

This lets a site supervisor ask a question like *"Which zone had the most violations?"* and receive an answer synthesized from real, logged detections.

### Deployment Trade-offs (Reported Honestly)

| Metric | Value | Context |
|---|---|---|
| AI Query response latency | **~34 s** (avg, CPU) | Range: 30–42 s across 5 trials |

This latency reflects **CPU-only autoregressive generation** from a 1.5B-parameter language model with no GPU acceleration in the current deployment target. This is an identified, understood bottleneck rather than an unexplained limitation: on GPU hardware, this class of model typically generates in 1–3 seconds. The architecture is GPU-ready; the current demo environment is not GPU-equipped.

---

## Data Layer

- **6-table normalized relational schema** — `cameras`, `detections`, `violations`, `incident_reports`, `users`, `workers` — implemented with **SQLAlchemy ORM**.
- **Alembic migrations** for versioned, reproducible schema evolution — schema changes are tracked artifacts, not manual `ALTER` statements.
- Every YOLO detection is **auto-logged**; violations are **auto-flagged** by confidence threshold and PPE class, with **database-backed deduplication** (not in-memory) so repeated detections of the same violation survive service restarts without re-triggering alerts.
- **Worker-level violation tracking** violations can be queried per-worker, not just per-camera/zone.
- **Violation heatmap endpoint** for spatial/zone-level aggregation.

---

## Real-Time Inference Pipeline

- **FastAPI + WebSocket** streaming architecture ingests live OpenCV camera frames, one persistent connection per camera.
- **YOLOv11m** runs inference directly in the streaming path, returning detections with **Critical / High / Medium / Low** risk-level classification per PPE class.
- **Connection supersession handling** if a camera's stream is re-opened, the previous WebSocket connection is force-closed server-side rather than left to silently fail, preventing zombie connections under reconnect/reload scenarios.
- **CPU-based inference at ~817ms/frame (~1.2 fps)** sufficient for a safety-monitoring use case (violations need to be caught within seconds, not milliseconds) though not real-time in the video-processing sense; GPU deployment would substantially close this gap.

---

## Dashboard

Built with **React + Vite**, consuming both REST and WebSocket APIs:

- Live camera feed view with per-frame detection counts and live/offline status per camera.
- Zone-level violation and compliance-rate aggregation.
- Natural-language query interface (AI Query), backed directly by the RAG pipeline.
- Dedicated **Violations** and **Reports** views, backed by their own API endpoints.
- Token-based (JWT) authentication with registration and login.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Computer Vision** | YOLOv11m (Ultralytics), OpenCV, Albumentations |
| **Backend** | FastAPI, WebSocket, Python 3.11, Uvicorn |
| **NLP / RAG** | sentence-transformers, ChromaDB, Qwen2.5-1.5B-Instruct (Transformers) |
| **Database** | PostgreSQL 16, SQLAlchemy ORM, Alembic |
| **Auth** | JWT (python-jose), bcrypt password hashing |
| **Frontend** | React, Vite |
| **Infrastructure** | Docker, Docker Compose |
| **Evaluation** | mAP@0.5 / mAP@0.5:0.95, precision/recall, latency benchmarking, BERTScore *(in progress | see below)* |

---

## Evaluation Status

This project distinguishes between **verified, measured results** and **planned, in-progress evaluation** deliberately, rather than presenting both as equally complete:

-  **Detection metrics (mAP, precision, recall)** measured directly via `yolo val` against the held-out validation split from training.
-  **Inference latency (detection + AI Query)** measured directly via repeated timed trials on the actual running system.
-  **RAG output quality (ROUGE / BERTScore)** methodology defined (hand-written reference answers scored against real system outputs via BERTScore/ROUGE-L), evaluation currently limited by a small number of accumulated violation records in the demo environment. Being expanded as the system continues logging live detections.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/haffiirfan/SafetyIQ-Intelligent-Construction-Site-Safety-Monitoring-Incidental-System.git
cd SafetyIQ-Intelligent-Construction-Site-Safety-Monitoring-Incidental-System

# Configure environment variables
cp backend/.env.example backend/.env
# edit backend/.env with your own values (HF_TOKEN optional but recommended)

# Launch the full stack
docker compose up -d --build

# Run database migrations
docker compose exec backend alembic upgrade head
```

The dashboard is available at `http://localhost:5173`, with the FastAPI inference/REST/WebSocket service running at `http://localhost:8000`.

> Model weights (`best.pt`) and demo video footage are not committed to this repository due to size see `docker-compose.yml` for the expected local paths these are mounted from (`ml_training/models/`, `temp_video/`).

---

## Known Limitations

Stated directly, rather than omitted:

- **CPU-only deployment** in the current demo environment both YOLO inference (~817ms/frame) and RAG generation (~34s/query) would see substantial latency improvements on GPU hardware.
- **Demo cameras use looped local video files**, not live RTSP feeds from physical cameras the architecture supports real camera integration, but this has not yet been tested against live hardware.
- **RAG evaluation (ROUGE/BERTScore) is in progress**, currently constrained by limited accumulated violation data in the demo environment rather than a methodological gap.
- **Solo-developed, prototype-stage project** not yet load-tested, and authentication/authorization has not undergone formal security review.

---

## Project Context

SafetyIQ was developed independently, end-to-end: raw dataset curation and class-imbalance correction, model fine-tuning and evaluation, relational schema design, retrieval-grounded NLP, real-time WebSocket inference infrastructure, JWT authentication, and a fully containerized full-stack deployment built to demonstrate applied AI systems engineering, with results reported as measured, not as aspired to.
