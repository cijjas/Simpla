from fastapi import APIRouter, HTTPException
from schemas.raw_norma import RawNorma
from schemas.parsed_norma import ParsedNorma
from services.parser_service import parse_norma_service

router = APIRouter(prefix="/api", tags=["parser"])

@router.post("/parse", response_model=ParsedNorma)
def parse_norma(record: RawNorma) -> ParsedNorma:
    try:
        return parse_norma_service(record)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))