from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import router as api_router
from app.websocket.stream import camera_stream
from app.services.rag_service import rag_service

app = FastAPI(title="SafetyIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def load_rag_models():
    print("Preloading RAG models — this may take a while on first run...")
    rag_service.preload()
    print("RAG models ready.")


@app.websocket("/ws/camera/{camera_id}")
async def websocket_camera(websocket: WebSocket, camera_id: int):
    await camera_stream(websocket, camera_id)

@app.get("/")
def health_check():
    return {"status": "SafetyIQ API is running"}