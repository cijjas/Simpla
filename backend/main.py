from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Análisis Normativo", 
              description="API para información jurídica")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "API de Análisis Normativo - Ministerio de Desregulación"}

from routers import stats
app.include_router(stats.router)

from routers import parse
app.include_router(parse.router)