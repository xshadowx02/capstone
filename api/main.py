import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from rag import rag_service
from routers import statements, budget, rankings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Local Ledger API...")
    try:
        await rag_service.initialize()
        logger.info("RAG service initialized.")
    except Exception as e:
        logger.error(f"RAG init failed: {e}")
    yield
    logger.info("Shutting down Local Ledger API.")


app = FastAPI(
    title="Local Ledger API",
    description="Discover your spending habits using a local LLM",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(statements.router)
app.include_router(budget.router)
app.include_router(rankings.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Local Ledge"}


static_dir = "/app/static"
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=f"{static_dir}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        index = os.path.join(static_dir, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return {"error": "UI not built"}
else:
    @app.get("/")
    async def root():
        return {"message": "Local Ledge API", "docs": "/docs"}
