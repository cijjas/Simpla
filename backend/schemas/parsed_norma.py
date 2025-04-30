from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ParsedNorma(BaseModel):
    meta: Dict[str, Any]
    preambulo: Dict[str, Optional[str]]
    cuerpo: Any                  # could be refined
    firmas: List[str]
    nota: Optional[str]
    anexos: List[Dict[str, str]]
    pie: Optional[Dict[str, str]]
    resto: Optional[str]