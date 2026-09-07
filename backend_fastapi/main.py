import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from routers import advisor, analysis, analyze, auth, demo, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_settings()
    yield


app = FastAPI(
    title='LoanShield AI',
    version='1.0.0',
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(',')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health.router)
app.include_router(demo.router)
app.include_router(analyze.router)
app.include_router(analysis.router)
app.include_router(advisor.router)
app.include_router(auth.router)


@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={'success': False, 'error': str(exc)},
    )


if settings.environment == 'production':
    dist_path = os.path.join(os.path.dirname(__file__), '..', 'dist')
    if os.path.isdir(dist_path):
        app.mount('/', StaticFiles(directory=dist_path, html=True), name='spa')
