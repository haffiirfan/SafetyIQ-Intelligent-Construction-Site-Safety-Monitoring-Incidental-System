<div align="center">

## SafetyIQ
### Intelligent Construction Site Safety Monitoring & Incident System

*Real-time PPE compliance detection meets NLP-driven incident reporting, a full-stack AI platform built for production.*

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![YOLO](https://img.shields.io/badge/YOLOv11-Ultralytics-00FFFF?style=flat-square)](https://github.com/ultralytics/ultralytics)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#license)

</div>

---

##  Overview

**SafetyIQ** is an end-to-end AI system that turns raw construction-site camera feeds into structured, actionable safety intelligence. It fuses a fine-tuned **YOLOv11** computer vision pipeline with a **retrieval-augmented NLP layer**, wrapped in a production-grade full-stack architecture so violations aren't just detected, they're logged, contextualized, queried, and reported on, automatically.

Built to answer one question that most PPE-detection demos ignore: *what happens to the detection after the bounding box is drawn?*

| Capability | What it does |
|---|---|
|  **Real-time detection** | Streams live camera frames via WebSocket, runs YOLOv11 inference, returns annotated frames with risk-level overlays at **sub-20ms/frame** |
|  **Incident intelligence** | Domain-specific RAG pipeline synthesizes grounded, hallucination-resistant safety reports from structured violation data |
|  **Structured logging** | Every detection is auto-logged to a normalized relational schema; violations are auto-flagged by confidence threshold and PPE class |
|  **Live dashboard** | React + Vite interface with real-time annotated feed, zone-level violation tracking, natural-language query interface, and auto-generated reports |
|  **Production packaging** | Dockerized microservice architecture, no "notebook to nowhere," this is built to deploy |

---

##  System Architecture

```
┌───────────────────┐      WebSocket        ┌─────────────────────┐              
│   Camera Feed     |──────────────────▶    |  FastAPI Inference |
│   (OpenCV)        |                       │   Service (YOLOv11) | 
└───────────────────┘                       └─────────┬───────────┘
                                                      │ annotated frames +
                                                      │ structured detections
                                                      ▼
                                           ┌──────────────────────────┐
                                           │   PostgreSQL             |
                                           │   (SQLAlchemy + Alembic) |
                                           │   5-table relational     |
                                           │   schema                 |
                                           └──────────┬───────────────┘
                                                      │
                              ┌───────────────────────┼───────────────────────┐
                              ▼                                               ▼
                  ┌────────────────────────┐                      ┌──────────────────────┐
                  │  RAG Pipeline          |                      │  React + Vite        |  
                  │  sentence-transformers |                      │  Dashboard           |   
                  │  → ChromaDB → T5-base  |                      │  REST + WebSocket    |   
                  └────────────────────────┘                      └──────────────────────┘
```

All services are orchestrated via **Docker Compose** for one-command deployment.

---

##  Computer Vision Pipeline

The detection backbone is a **YOLOv11m** model fine-tuned on a curated **44,002-image multi-class PPE dataset** spanning 9 target classes (Hardhat, NO-Hardhat, Safety Vest, NO-Safety Vest, Mask, NO-Mask, Gloves, NO-Gloves, Person).

**Key engineering decisions, not just "trained a model":**

- **Class-imbalance correction**: raw class distribution had a **29.3× imbalance** between the majority and minority class. Applied a two-pronged correction strategy, targeted undersampling of over-represented majority-class-only images, combined with capped, augmentation-diversified oversampling (not blind duplication) of minority classes, bringing the effective imbalance down to a trainable range without inducing memorization/overfitting on rare classes.
- **Augmentation strategy**: mosaic, copy-paste, and affine/HSV transforms applied per-instance during oversampling so duplicated samples are never pixel-identical to their source, every "extra" copy contributes genuinely new gradient signal.
- **Image-level vs. instance-level balancing**: correctly handled the multi-label nature of object detection (one image → multiple co-occurring class boxes), avoiding the common mistake of naively duplicating whole images and inflating majority classes further.
- **Result**: **mAP@0.5 of 0.82+** at epoch 50 on a Tesla T4, with honest, unbalanced validation/test splits preserved throughout to ensure reported metrics reflect real-world performance, not an artificially rebalanced evaluation set.

---

##  NLP / RAG Incident Intelligence

Rather than bolting an LLM onto detection logs, SafetyIQ implements a **grounded retrieval pipeline** purpose-built for structured safety data:

- **Embedding generation** via `sentence-transformers`
- **Vector retrieval** via **ChromaDB**
- **Grounded synthesis** via **T5-base**, constrained to retrieved violation records, minimizing hallucination on structured safety-log queries
- **Evaluation**: report quality validated against **ROUGE-1/2/L** and **BERTScore**, rather than relying on subjective read-throughs

This lets a site supervisor ask natural-language questions ("What zones had the most hardhat violations this week?") and get a **factually grounded** answer synthesized from real logged incidents — not a generic LLM guess.

---

##  Data Layer

- **5-table normalized relational schema** (cameras/zones, detections, violations, incident reports, users/roles) implemented with **SQLAlchemy ORM**
- **Alembic migrations** for versioned, reproducible schema evolution
- Every YOLO detection is **auto-logged**, and violations are **auto-flagged** based on confidence threshold + PPE class, no manual triage bottleneck

---

##  Real-Time Inference Pipeline

- **FastAPI + WebSocket** streaming architecture ingests live OpenCV camera frames
- YOLOv11**m** runs inference in the real-time path for latency, returning annotated frames with **Critical / High / Medium** risk-level overlays
- **Sub-20ms per-frame latency**, keeping the pipeline viable for genuine real-time monitoring rather than batch-delayed review

---

##  Dashboard

Built with **React + Vite**, consuming both REST and WebSocket APIs:

- Live annotated camera feed with overlaid violation bounding boxes and risk levels
- Zone-level violation aggregation and trends
- Natural-language query interface (backed by the RAG pipeline)
- Auto-generated, exportable safety reports

---

##  Tech Stack

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

##  Results

| Metric | Value |
|---|---|
| Dataset size | 44,002 images, 9 PPE classes |
| Pre-correction class imbalance | 29.3× |
| mAP@0.5 (YOLOv11m, epoch 50) | **0.82+** |
| Real-time inference latency | **< 20 ms/frame** |
| Report evaluation | ROUGE-1/2/L, BERTScore |

---

##  Getting Started

```bash
# Clone the repository
git clone https://github.com/<your-username>/safetyiq.git
cd safetyiq

# Launch the full stack
docker compose up --build
```

The dashboard will be available at `http://localhost:<port>`, with the inference API and WebSocket stream running as separate orchestrated services.

> Full setup instructions, environment variables, and model weights download are documented in [`/docs`](./docs).

---

##  Context

SafetyIQ was developed as a **Final Year Project**, engineered end-to-end, from raw dataset curation and class-imbalance correction through model fine-tuning, backend architecture, RAG-based intelligence, and a deployable full-stack interface, to demonstrate production-oriented AI engineering rather than a single-notebook proof of concept.

---
