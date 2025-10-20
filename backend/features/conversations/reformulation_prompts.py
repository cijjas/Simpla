"""Collection of reformulation prompts for different use cases."""

# Available reformulation prompts
REFORMULATION_PROMPTS = {
    "initial": """
IMPORTANTE: Debes clasificar la PRIMERA pregunta del usuario en 3 categorías: NON-LEGAL, VAGA (necesita clarificación), o CLARA (puede reformularse).

**REGLA CRÍTICA - SÉ PERMISIVO:**
Una pregunta es VAGA **SOLO** si es genuinamente imposible determinar qué buscar en la base de datos legal. Cuando hay DUDA, considera la pregunta CLARA.

**PREGUNTAS VAGAS (retornar CLARIFICATION:)**
SOLO estas preguntas extremadamente genéricas son VAGAS:
- "contratos" (palabra suelta sin contexto) → VAGA
- "artículo 5" (sin especificar norma) → VAGA
- "leyes" (demasiado genérico) → VAGA
- "derecho" (sin área especificada) → VAGA

**PREGUNTAS CLARAS (reformular directamente - SIN pedir clarificación):**
- "háblame de alimentos" → CLARA (asume Código Alimentario)
- "necesito info sobre refugiados" → CLARA (tema suficientemente específico)
- "que dice el codigo alimentario argentino" → CLARA (menciona código específico)
- "impuestos sobre combustibles" → CLARA (tema + ámbito específico)
- "puedo izar banderas extranjeras en feriados" → CLARA (pregunta concreta)
- "contratos laborales" → CLARA (tipo especificado)
- "derecho laboral" → CLARA (área específica)
- Cualquier pregunta que mencione una ley, código o tema específico → CLARA

Para preguntas VAGAS, responde:
CLARIFICATION: [pregunta concisa ofreciendo 2-3 opciones principales]

Para preguntas CLARAS, reformula usando lenguaje jurídico argentino.

**EJEMPLOS:**

Input: "hola, cómo estás?"
Output: NON-LEGAL

Input: "contratos"
Output: CLARIFICATION: ¿Te refieres a contratos laborales, civiles, comerciales o algún otro tipo?

Input: "háblame de alimentos"
Output: normativa sobre producción, elaboración y circulación de alimentos - Código Alimentario Argentino

Input: "necesito info sobre refugiados"
Output: régimen legal de reconocimiento y protección de refugiados en Argentina

Input: "que dice el codigo alimentario argentino"
Output: normativa argentina sobre alimentos de consumo humano - Código Alimentario Argentino Ley 18.284

Input: "impuestos sobre combustibles"
Output: régimen tributario aplicable a la comercialización de combustibles en Argentina

Input: "puedo izar banderas extranjeras en feriados"
Output: regulación sobre el izamiento de banderas extranjeras en días feriados y festivos nacionales

Input: "contratos laborales"
Output: régimen de contratos de trabajo y relaciones laborales en la normativa argentina

Ahora clasifica y responde para:
<user_question>{user_question}</user_question>

Respuesta (NON-LEGAL, CLARIFICATION: [...], o reformulación):
    """,

    "followup": """
IMPORTANTE: El usuario está respondiendo a una CLARIFICATION previa. Debes COMBINAR el contexto anterior con su respuesta.

**CONTEXTO DE CONVERSACIÓN:**
{context}

**REGLA PRINCIPAL - SIEMPRE COMBINA:**
1. Identifica la pregunta original del usuario en el contexto
2. Identifica la CLARIFICATION que se le hizo
3. Combina la pregunta original + la respuesta actual del usuario
4. Si la combinación es CLARA → reformula
5. Si la respuesta es muy vaga ("no sé", "cualquiera", respuestas sin sentido) → REFORMULATE_REQUEST

**NUNCA pidas una segunda CLARIFICATION. Solo tienes 2 opciones:**
- Reformular combinando toda la información
- REFORMULATE_REQUEST si la respuesta es inútil

**EJEMPLOS DE COMBINACIÓN:**

Context:
user: háblame de contratos
assistant: CLARIFICATION: ¿Te refieres a contratos laborales, civiles, comerciales...?
Input: "civiles"
Output: régimen de contratos civiles en la normativa argentina
(Combinación: contratos + civiles = contratos civiles)

Context:
user: hablame de alimentos
assistant: CLARIFICATION: ¿Te refieres a producción, normativa sanitaria...?
Input: "produccion"
Output: normativa sobre producción de alimentos - Código Alimentario Argentino
(Combinación: alimentos + producción = producción de alimentos)

Context:
user: necesito info sobre refugiados
assistant: CLARIFICATION: ¿Sobre el proceso de solicitud, derechos, legislación...?
Input: "legislación"
Output: marco legal de refugiados en Argentina - Ley 26.165 y modificatorias
(Combinación: refugiados + legislación = legislación sobre refugiados)

Context:
user: háblame de contratos
assistant: CLARIFICATION: ¿Te refieres a contratos laborales, civiles...?
Input: "no sé"
Output: REFORMULATE_REQUEST
(Respuesta inútil, pedir reformulación completa)

Context:
user: háblame de contratos
assistant: CLARIFICATION: ¿Te refieres a contratos laborales, civiles...?
Input: "cualquiera"
Output: REFORMULATE_REQUEST
(Respuesta demasiado vaga, pedir reformulación)

Ahora combina el contexto con la respuesta del usuario:
<user_question>{user_question}</user_question>

Respuesta (reformulación combinada o REFORMULATE_REQUEST):
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


def get_reformulation_prompt(prompt_type: str = "initial") -> str:
    """
    Get a reformulation prompt by type.

    Args:
        prompt_type: The type of prompt to retrieve. Available options:
                    - "initial": For first questions without context (permissive, fewer clarifications)
                    - "followup": For responses to clarifications (combines context + response)
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
    "initial": "For first questions without context (permissive, fewer clarifications)",
    "followup": "For responses to clarifications (combines context + response)",
    "strict": "Very strict classification, minimal false positives",
    "permissive": "More inclusive, treats most topics as potentially legal",
    "constitutional": "Focus on constitutional and public law topics",
    "civil_commercial": "Focus on civil and commercial law topics"
}
