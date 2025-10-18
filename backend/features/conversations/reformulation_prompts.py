"""Collection of reformulation prompts for different use cases."""

# Available reformulation prompts
REFORMULATION_PROMPTS = {
    "default": """
IMPORTANTE: Debes clasificar la pregunta del usuario en 3 categorías: NON-LEGAL, VAGA (necesita clarificación), o CLARA (puede reformularse).

**REGLA CRÍTICA PARA DETECTAR PREGUNTAS VAGAS:**
Si la pregunta menciona un tema legal GENÉRICO sin especificar el tipo específico, subtipo o contexto → ES VAGA.

**PREGUNTAS VAGAS (retornar CLARIFICATION:)**

Estas preguntas SON VAGAS porque no especifican el tipo/contexto:
- "háblame de contratos" → VAGA (falta tipo: ¿laborales? ¿civiles? ¿comerciales?)
- "contratos" → VAGA
- "información sobre contratos" → VAGA
- "¿qué dice el artículo 5?" → VAGA (falta norma)
- "requisitos para registro" → VAGA (falta tipo de registro)
- "licencias" → VAGA (falta tipo)
- "derecho laboral" → VAGA (demasiado general)

Para preguntas VAGAS, responde:
CLARIFICATION: [una pregunta concisa ofreciendo opciones específicas]

**PREGUNTAS CLARAS (reformular)**

Estas preguntas SON CLARAS porque especifican tipo/contexto:
- "contratos laborales" → CLARA (especifica tipo)
- "contratos de locación urbana" → CLARA
- "Ley 20.744 artículo 245" → CLARA (referencia completa)
- "despido sin justa causa" → CLARA (concepto específico)
- "plazo de prescripción en acciones laborales" → CLARA

Para preguntas CLARAS, reformula usando lenguaje jurídico argentino.

**EJEMPLOS EXACTOS:**

Input: "hola, cómo estás?"
Output: NON-LEGAL

Input: "háblame de contratos"
Output: CLARIFICATION: ¿Te refieres a contratos laborales, civiles, comerciales, de locación o algún otro tipo específico?

Input: "¿qué dice el artículo 5?"
Output: CLARIFICATION: ¿De qué ley o norma necesitas información sobre el artículo 5?

Input: "contratos laborales"
Output: régimen de contratos de trabajo y relaciones laborales en la normativa argentina

Input: "despido sin justa causa según la LCT"
Output: causales y procedimientos de despido sin justa causa según la Ley de Contrato de Trabajo

Input: "Ley 20.744 artículo 245"
Output: contenido y alcance del artículo 245 de la Ley de Contrato de Trabajo 20.744

Ahora clasifica y responde para:
<user_question>{user_question}</user_question>

Respuesta (NON-LEGAL, CLARIFICATION: [...], o reformulación):
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
