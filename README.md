<div align="center">

# SafetyIQ

### An End to End Computer Vision and Retrieval Augmented System for Construction Site Safety Intelligence

*Fine tuned real time PPE compliance detection, paired with a grounded incident reporting pipeline, deployed as a full stack, containerized system.*

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![YOLO](https://img.shields.io/badge/YOLOv11m-Ultralytics-00FFFF?style=flat-square)](https://github.com/ultralytics/ultralytics)

</div>

---

## Overview

Most public PPE detection projects stop at a bounding box drawn in a notebook. SafetyIQ was built to go further, taking a raw, imperfect dataset through correction, training, evaluation, and into a running, containerized system that logs violations, stores them in a relational database, and answers natural language questions about them using retrieval grounded generation.

The project was built independently, end to end, including the parts that are usually left out of a portfolio project: fixing a badly imbalanced dataset before training, measuring real inference latency instead of assuming it, and reporting numbers exactly as they came out of evaluation, including the ones that are not flattering.

---

## The Dataset, Honestly

The source dataset used for training is a nine class PPE dataset (Hardhat, NO Hardhat, Safety Vest, NO Safety Vest, Mask, NO Mask, Gloves, NO Gloves, Person), pulled from a public Kaggle collection. It is worth being direct about what this dataset actually is, because that context changes how the results below should be read.

The dataset was heavily imbalanced. Common classes such as Hardhat had far more labeled examples than safety critical minority classes such as NO Gloves or NO Mask. Trained without correction, a model on this data would predictably learn to recognize the common classes well and effectively ignore the rare ones, since the loss function has little incentive to fix errors on classes it rarely sees. That is not a hypothetical risk, it is the default, well documented outcome of training on imbalanced object detection data. A model trained naively on this dataset would look fine on paper because the majority classes would pull the average up, while quietly failing on the classes that matter most for actual safety.

Separately, this dataset is also narrower and harder than the more commonly cited PPE benchmark used in similar projects, which includes classes like vehicle, machinery, and safety cone. Those are large, visually distinct objects that are comparatively easy for any detector to learn, and their presence in a class list tends to raise the averaged accuracy score without saying much about how well the model handles PPE itself. This project's dataset excludes those easier classes and instead keeps the class list restricted to PPE items, including gloves, which are small, low contrast against skin, and frequently occluded by tools or hand position, making them one of the more difficult categories in this space.

Put plainly, this dataset was not set up to produce a high accuracy number by default. Getting a usable result out of it required deliberate correction work before training even began, not just longer training or a bigger model.

---

## What Was Done About It

- **Class imbalance correction.** Majority class only images were capped through targeted undersampling, while minority class images were oversampled through augmentation rather than simple duplication.
- **Non degenerate augmentation.** Every oversampled copy went through horizontal flips, brightness and contrast jitter, HSV shifts, affine transforms, and added noise, using Albumentations, so that no duplicated example was pixel identical to its source.
- **Instance level balancing, not image level.** Object detection images are frequently multi label, one image can contain several classes at once. Balancing decisions were made based on which rare classes were present in each image, avoiding the common mistake of duplicating whole images and accidentally reinflating the majority class in the process.
- **Training regime.** YOLOv11m, 50 epochs, mixed precision, trained on a Tesla T4 GPU, with mosaic augmentation closed toward the end of training so the model's final weights are tuned on realistic, unstitched images.

---

## Results, As Measured

| Metric | Value | What it means |
|---|---|---|
| mAP at 0.5 IoU | **0.738** | Best checkpoint, epoch 39 of 50 |
| mAP at 0.5 to 0.95 IoU | **0.489** | The stricter, averaged version of the same metric |
| Precision | **0.661** | Roughly one in three flagged detections is a false alarm |
| Recall | **0.850** | The model misses only about 15 percent of real violations |
| Detection latency, CPU | **about 817 ms per frame**, median | Intel i5 10210U, no GPU in the demo environment |
| AI Query latency, CPU | **about 34 seconds per response**, average of 5 trials | Qwen2.5 1.5B Instruct, no GPU in the demo environment |

These numbers are reported exactly as measured, with no rounding in a favorable direction and no exclusion of a weaker run.

### Reading the precision and recall gap correctly

Recall sits noticeably higher than precision. That is not an accident and not something to apologize for, it reflects the class balancing choice made during training, which pushed the model to prioritize catching rare, safety critical classes even at the cost of some false alarms elsewhere. For a safety system, a false alarm costs a supervisor a few seconds of review. A missed violation costs nothing on paper and something real on site. Optimizing recall over precision, deliberately, is the correct trade for this problem, and the 0.850 recall number is the strongest evidence that the class balancing work paid off rather than the surface level accuracy figure alone.

### Reading the mAP number correctly

An mAP of 0.738 will look modest next to some published PPE detection projects that report numbers in the low to mid 0.80s. The dataset difference described above is the reason, not a training shortfall. A benchmark that includes vehicles and machinery alongside PPE classes is answering an easier question on average. This project's number reflects performance on a stricter, PPE only class list that still includes one of the genuinely hardest categories in this domain, gloves. Given that starting point, 0.738 represents real, working detection on a dataset that was not built to hand out an easy score, achieved specifically because the imbalance was corrected before training rather than left as is.

---

## RAG Pipeline, Incident Intelligence

Rather than pointing a general purpose language model at a log file and asking it to summarize, SafetyIQ constrains report generation to retrieved, verified records.

- **Embedding generation** through sentence transformers, indexing structured violation records, zone, class, confidence, timestamp, and camera, into vector space.
- **Retrieval** through ChromaDB, surfacing only the specific incident records relevant to a given question.
- **Generation** through Qwen2.5 1.5B Instruct, conditioned on the retrieved records so the model is answering from what was actually logged, not from memory. In testing, when asked about a zone or class with no matching records, the system correctly reports that no data exists rather than inventing a plausible sounding answer.

This lets a supervisor ask something like "which zone had the most violations" and get an answer built from real, logged detections rather than a guess.

### The honest cost of this pipeline

Average response time is about 34 seconds on the CPU only hardware used for this demo, generating text one token at a time from a 1.5 billion parameter model with no GPU acceleration. This is a known, explainable cost, not a mystery. On GPU hardware this typically drops to a few seconds. The architecture does not need to change to take advantage of a GPU, the deployment environment does.

---

## Data Layer

- A six table normalized relational schema, cameras, detections, violations, incident reports, users, and workers, implemented with SQLAlchemy ORM.
- Alembic migrations, so schema changes are tracked, reproducible history rather than manual edits to a live database.
- Every detection is logged automatically, and violations are flagged automatically by confidence threshold and PPE class.
- Deduplication is checked against the database itself, not an in memory set, so it survives service restarts instead of resetting every time the process reloads.
- Per worker violation history and a zone level violation heatmap endpoint, in addition to per camera views.

---

## Real Time Inference Pipeline

- FastAPI and WebSocket streaming, one persistent connection per camera, ingesting live OpenCV frames.
- YOLOv11m runs directly in that streaming path, classifying detections into Critical, High, Medium, and Low risk levels by PPE class.
- If a camera's connection is reopened, the previous connection for that camera is closed on the server side rather than left to fail silently, avoiding stale connections after a page reload or reconnect.
- At roughly 817 ms per frame, this is closer to one frame per second than true video frame rate, which is a genuine limitation on CPU hardware, but sufficient for the actual requirement here, catching a violation within a couple of seconds rather than 30 times a second.

---

## Dashboard

Built with React and Vite, consuming both REST and WebSocket APIs.

- Live camera view with per camera status and live detection counts.
- Zone level violation and compliance rate aggregation.
- A natural language query page backed directly by the RAG pipeline.
- Separate Violations and Reports views with their own endpoints.
- Token based authentication, with registration, login, and password hashing through bcrypt.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Computer vision | YOLOv11m, Ultralytics, OpenCV, Albumentations |
| Backend | FastAPI, WebSocket, Python 3.11, Uvicorn |
| NLP and retrieval | sentence transformers, ChromaDB, Qwen2.5 1.5B Instruct |
| Database | PostgreSQL 16, SQLAlchemy ORM, Alembic |
| Authentication | JWT, bcrypt |
| Frontend | React, Vite |
| Infrastructure | Docker, Docker Compose |

---

## Evaluation Status

Verified and measured, separately from work that is still in progress, on purpose.

- Detection metrics, mAP, precision, recall, measured directly through YOLO validation against the held out split from training.
- Inference latency, both detection and query response, measured directly through repeated timed trials against the running system, not estimated.
- Report quality scoring through ROUGE and BERTScore, methodology is defined, hand written reference answers scored against real system outputs, currently limited by a small number of accumulated violation records in the demo environment and being expanded as the system continues running.

---

## Getting Started

```bash
git clone https://github.com/haffiirfan/SafetyIQ-Intelligent-Construction-Site-Safety-Monitoring-Incidental-System.git
cd SafetyIQ-Intelligent-Construction-Site-Safety-Monitoring-Incidental-System

cp backend/.env.example backend/.env

docker compose up -d --build

docker compose exec backend alembic upgrade head
```

The dashboard runs at `http://localhost:5173`, with the FastAPI service at `http://localhost:8000`.

Model weights and demo footage are not committed to this repository due to size. See `docker-compose.yml` for the expected local paths they are mounted from.

---

## Known Limitations

- CPU only in the current demo environment, both detection and query latency would improve meaningfully on a GPU.
- Demo cameras loop local video files rather than connecting to live RTSP feeds, the architecture supports real cameras but this has not yet been tested against physical hardware.
- ROUGE and BERTScore evaluation is in progress, limited right now by how few violations the demo environment has accumulated, not by an unresolved method.
- This is a solo built prototype, it has not undergone load testing or a formal security review.

---

## Project Context

SafetyIQ was built independently, across dataset correction, model training and evaluation, database design, retrieval grounded language generation, real time streaming infrastructure, authentication, and full containerized deployment. The numbers in this README are reported the way they came out of testing, not adjusted to look better, because a project meant to demonstrate engineering judgment should be able to survive someone actually running it.
