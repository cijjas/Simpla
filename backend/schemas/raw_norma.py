from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class RawNorma(BaseModel):
    """Exactly what InfoLeg returns (simplified)."""
    id: int
    tipoNorma: str
    claseNorma: Optional[str] = None
    textoNorma: Optional[str] = None  
    # …add the rest of the fields you care about …

    class Config:
        extra = "allow"        # ignore unknown keys so the whole JSON works