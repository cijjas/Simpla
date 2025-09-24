"""Configuration management for the Simpla backend."""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    # API Keys
    PINECONE_API_KEY: Optional[str] = os.getenv('PINECONE_API_KEY')
    PINECONE_INDEX_NAME: Optional[str] = os.getenv('PINECONE_INDEX_NAME')
    PINECONE_HOST: Optional[str] = os.getenv('PINECONE_HOST')
    GEMINI_API_KEY: Optional[str] = os.getenv('GEMINI_API_KEY')
    HF_API_KEY: Optional[str] = os.getenv('HF_API_KEY')
    
    # Database
    DATABASE_URL: Optional[str] = os.getenv('DATABASE_URL')
    
    # Email
    RESEND_API_KEY: Optional[str] = os.getenv('RESEND_API_KEY')
    FRONTEND_SITE_URL: str = os.getenv('FRONTEND_SITE_URL', 'http://localhost:3000')
    BACKEND_URL: str = os.getenv('BACKEND_URL', 'http://localhost:8000')
    
    # Feedback
    FEEDBACK_EMAILS: Optional[str] = os.getenv('FEEDBACK_EMAILS')
    EMAIL_FROM: Optional[str] = os.getenv('EMAIL_FROM')
    
    # RAG Configuration
    K_RETRIEVE: int = int(os.getenv('K_RETRIEVE', '5'))
    
    # Prompt Template
    PROMPT_TEMPLATE: str = """
Eres un/a **abogado/a constitucionalista argentino/a**.  
Tu tarea es **contestar en UNA sola frase** y **exclusivamente** con la
información que aparece dentro de las etiquetas <context></context>.

Reglas de oro (cúmplelas al pie de la letra):

1. Si la respuesta está en el contexto, da la solución **exactamente** como
   figura allí, sin agregar ni quitar nada relevante.
2. Al final de la frase, escribe entre paréntesis el/los número(s) de
   artículo(s) que sustenten la respuesta -por ejemplo: **(art. 14)**.
   - Si el fragmento de contexto trae algo como "Artículo 14 bis", ponlo igual: **(art. 14bis)**.
3. Si la información **no** aparece en el contexto, contesta **exactamente**:
   > No tengo información sobre esto.
4. No inventes datos, no cites fuentes externas, no explicas tu razonamiento.
5. Responde en español neutro y evita tecnicismos innecesarios.
6. Si no sabes la respuesta, responde 'no tengo información sobre esto'.

<context>
{context}
</context>

Pregunta: {question}
Respuesta:
""".strip()
    
    @classmethod
    def validate_required_keys(cls) -> list[str]:
        """Validate that all required API keys are present."""
        missing_keys = []
        
        if not cls.PINECONE_API_KEY:
            missing_keys.append('PINECONE_API_KEY')
        if not cls.PINECONE_INDEX_NAME:
            missing_keys.append('PINECONE_INDEX_NAME')
        if not cls.PINECONE_HOST:
            missing_keys.append('PINECONE_HOST')
        if not cls.GEMINI_API_KEY:
            missing_keys.append('GEMINI_API_KEY')
        if not cls.HF_API_KEY:
            missing_keys.append('HF_API_KEY')
        if not cls.DATABASE_URL:
            missing_keys.append('DATABASE_URL')
            
        return missing_keys


# Global settings instance
settings = Settings()
