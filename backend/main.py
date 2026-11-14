from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.routers import analysis, chat, farm, logs, meta, posts


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Strata API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (meta, farm, analysis, logs, posts, chat):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Hello from FastAPI 👋"}
