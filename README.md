# SafetyIQ: Intelligent Construction Site Safety Monitoring Incidental System

Engineered an end-to-end full-stack AI system combining real-time computer vision and NLP-driven incident intelligence, built on a FastAPI + React + PostgreSQL architecture with Docker Compose orchestration for production deployment. Fine-tuned YOLO11m ona44,002-image multi-class PPE dataset applying class-imbalance correction via targeted over sampling and augmentation (mosaic, HSV, affine transforms), achieving mAP@0.5 of 0.82+ at epoch 50 on Colab T4. Designed a domain-specific RAG pipeline using sentence-transformers for embedding generation, ChromaDB for vector
retrieval, and T5-base for grounded incident report synthesis, reducing hallucinations in structured safety log queries. Architected a 5-table relational schema with SQLAlchemy ORM and Alembic migrations on PostgreSQL, with every YOLO detection auto-logged and violation records auto-flagged by confidence threshold and PPE class. Built a real-time inference pipeline via FastAPI WebSocket streaming OpenCV camera frames through YOLO11s, returning annotated frames with risk-level overlays (Critical / High / Medium) at sub-20ms per-frame latency. Developed a React + Vite dashboard consuming REST and WebSocket APIs, featuring a live annotated camera feed, zone-level violation, query interface, and auto-generated safety reports evaluated via ROUGE-1/2/L and BERTScore.

## Tech Stack used

- Backend: FastAPI
- Frontend: React + Vite
- Database: PostgreSQL
- Machine Learning: YOLO11m
- NLP: T5 + RAG Pipeline


## Author

Haffi Irfan
