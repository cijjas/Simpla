"""Collection of reformulation prompts for different use cases."""

# Available reformulation prompts
REFORMULATION_PROMPTS = {
    "default": """
Reformula la siguiente consulta del usuario para que use lenguaje jurídico y técnico argentino, pero sin extender su significado ni agregar explicaciones.
La salida debe ser una sola oración concisa, similar a una búsqueda textual que podría usarse para localizar una norma en una base de datos legal.

Objetivos:
- Sustituye términos coloquiales por vocabulario jurídico o administrativo.
- Agrega sinónimos relevantes del ámbito legal argentino (por ejemplo: "ley", "decreto", "normativa", "reglamentación", "disposición").
- No incluyas listas, análisis ni referencias a leyes específicas a menos que el usuario las mencione.
- Devuelve solo la oración reformulada, sin comentarios ni explicaciones.
- **Si la consulta del usuario es puramente social, conversacional o irrelevante para temas públicos, cívicos o normativos de la Argentina (por ejemplo, saludos, chistes, opiniones personales, clima, deportes), responde exactamente con: NON-LEGAL**
- **Si la consulta se relaciona aunque sea indirectamente con instituciones, símbolos nacionales, políticas públicas, derechos, deberes o cualquier tema que pudiera estar regulado por normas argentinas, trátala como LEGAL y reformúlala.**

Ejemplo:
- Usuario: "qué dice la ley sobre el maltrato animal?"
- Reformulación: "normativa argentina vigente sobre la protección y el maltrato de los animales domésticos y silvestres."
- Usuario: "contame sobre la bandera argentina"
- Reformulación: "normativa argentina sobre los símbolos nacionales y la Bandera Nacional Argentina."
- Usuario: "hola, cómo estás?"
- Respuesta: NON-LEGAL

Ahora reformula esta consulta del usuario:
<user_question>{user_question}</user_question>
    """,
    
    "strict": """
Eres un clasificador estricto para un asistente legal argentino. Analiza la consulta del usuario y:

1. Si la consulta NO está directamente relacionada con leyes, decretos, códigos, jurisprudencia, procedimientos legales, derechos constitucionales, o normativas argentinas específicas, responde exactamente con: NON-LEGAL

2. Si la consulta SÍ está relacionada con temas legales argentinos, reformúlala usando terminología jurídica precisa.

Criterios ESTRICTOS para NON-LEGAL:
- Saludos, conversación social
- Cultura, historia, deportes (a menos que se pregunte por leyes específicas)
- Opiniones personales
- Temas generales sin contexto legal específico

Criterios para LEGAL:
- Consultas sobre leyes, códigos, decretos específicos
- Procedimientos judiciales o administrativos
- Derechos y obligaciones legales
- Normativas regulatorias

Ejemplos:
- "¿Cómo estás?" → NON-LEGAL
- "¿Qué es la bandera argentina?" → NON-LEGAL
- "¿Qué dice la ley sobre la bandera argentina?" → "normativa argentina sobre uso y respeto de símbolos patrios"
- "¿Cuáles son mis derechos laborales?" → "normativa laboral argentina sobre derechos del trabajador"

Consulta del usuario:
<user_question>{user_question}</user_question>
    """,
    
    "permissive": """
Reformula la consulta del usuario para búsqueda en base de datos legal argentina. Sé inclusivo con temas que podrían tener relevancia normativa.

Reformulación:
- Usa vocabulario jurídico argentino cuando sea posible
- Incluye sinónimos legales relevantes
- Mantén el significado original
- Solo responde NON-LEGAL para consultas claramente sociales/conversacionales

Responde NON-LEGAL únicamente para:
- Saludos y conversación casual
- Chistes o humor
- Temas puramente personales sin relevancia pública

Para todo lo demás, reformula usando términos legales apropiados.

Ejemplos:
- "Hola, ¿cómo andás?" → NON-LEGAL
- "¿Qué sabes de la bandera?" → "símbolos patrios y normativa sobre la Bandera Nacional Argentina"
- "¿Puedo trabajar los domingos?" → "normativa laboral argentina sobre jornada de trabajo y descanso dominical"

Consulta del usuario:
<user_question>{user_question}</user_question>
    """,
    
    "constitutional": """
Reformula la consulta enfocándote en aspectos constitucionales y de derecho público argentino.

Prioriza la reformulación hacia:
- Derechos constitucionales
- Garantías fundamentales
- Organización del Estado
- Procedimientos administrativos
- Normativas de derecho público

Solo responde NON-LEGAL para consultas puramente sociales sin conexión con el ámbito público o constitucional.

Ejemplos:
- "¿Tengo derecho a la educación?" → "derecho constitucional a la educación y normativa educativa argentina"
- "¿Cómo funciona el gobierno?" → "organización constitucional del Estado argentino y división de poderes"
- "Hola" → NON-LEGAL

Consulta del usuario:
<user_question>{user_question}</user_question>
    """,
    
    "civil_commercial": """
Reformula la consulta enfocándote en derecho civil y comercial argentino.

Prioriza la reformulación hacia:
- Contratos y obligaciones
- Derecho de familia
- Derechos reales
- Sociedades comerciales
- Responsabilidad civil

Solo responde NON-LEGAL para consultas sin relevancia civil o comercial.

Ejemplos:
- "¿Cómo hago un contrato?" → "normativa argentina sobre formación y validez de contratos civiles"
- "¿Puedo divorciarme?" → "normativa argentina sobre divorcio y derecho de familia"
- "Buen día" → NON-LEGAL

Consulta del usuario:
<user_question>{user_question}</user_question>
    """
}


def get_reformulation_prompt(prompt_type: str = "default") -> str:
    """
    Get a reformulation prompt by type.
    
    Args:
        prompt_type: The type of prompt to retrieve. Available options:
                    - "default": Balanced approach with clear legal/non-legal distinction
                    - "strict": Very strict classification, minimal false positives
                    - "permissive": More inclusive, treats most topics as potentially legal
                    - "constitutional": Focus on constitutional and public law
                    - "civil_commercial": Focus on civil and commercial law
    
    Returns:
        The formatted prompt string
        
    Raises:
        ValueError: If prompt_type is not found
    """
    if prompt_type not in REFORMULATION_PROMPTS:
        available_types = ", ".join(REFORMULATION_PROMPTS.keys())
        raise ValueError(f"Unknown prompt type '{prompt_type}'. Available types: {available_types}")
    
    return REFORMULATION_PROMPTS[prompt_type]


def list_available_prompts() -> list:
    """
    Get a list of all available prompt types.
    
    Returns:
        List of available prompt type names
    """
    return list(REFORMULATION_PROMPTS.keys())


def add_custom_prompt(name: str, prompt_template: str) -> None:
    """
    Add a custom reformulation prompt.
    
    Args:
        name: Unique name for the prompt
        prompt_template: The prompt template string (should include {user_question} placeholder)
    """
    REFORMULATION_PROMPTS[name] = prompt_template


# Prompt descriptions for easy reference
PROMPT_DESCRIPTIONS = {
    "default": "Balanced approach with clear legal/non-legal distinction",
    "strict": "Very strict classification, minimal false positives",
    "permissive": "More inclusive, treats most topics as potentially legal",
    "constitutional": "Focus on constitutional and public law topics",
    "civil_commercial": "Focus on civil and commercial law topics"
}
