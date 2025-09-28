"""Contact models for request validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class ContactRequest(BaseModel):
    """Contact form request model."""
    
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the contact")
    email: EmailStr = Field(..., description="Email address of the contact")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number (optional)")
    message: str = Field(..., min_length=10, max_length=2000, description="Contact message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Dr. Juan Pérez",
                "email": "juan@estudio.com",
                "phone": "+54 11 1234-5678",
                "message": "Me interesa conocer más sobre Simpla para mi estudio jurídico. ¿Podrían contactarme para una demostración?"
            }
        }


class ContactResponse(BaseModel):
    """Contact form response model."""
    
    success: bool = Field(..., description="Whether the contact form was submitted successfully")
    message: str = Field(..., description="Response message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Mensaje enviado correctamente. Te responderemos pronto."
            }
        }
