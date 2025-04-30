from parsers.infoleg_parser import parse_norma as _parse_norma
# from parsers.infoleg_law_parser import parse_norma as _parse_norma
from schemas.raw_norma import RawNorma
from schemas.parsed_norma import ParsedNorma

def parse_norma_service(raw: RawNorma) -> ParsedNorma:
    parsed = _parse_norma(raw.dict())
    return ParsedNorma(**parsed)