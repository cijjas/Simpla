# 🧪 Guía de Testing - Funcionalidad de Repregunta

Esta guía te ayudará a testear la nueva funcionalidad de repregunta implementada en el sistema.

## 📋 Pre-requisitos

Antes de testear, asegúrate de tener:

1. **Servicios externos corriendo**:
   - Base de datos PostgreSQL
   - Servicio de embeddings (puerto 8001)
   - Microservicio vectorial (gRPC puerto 50052)
   - Microservicio relacional (gRPC puerto 50051)

2. **Variables de entorno configuradas** (`.env`):
   - `GEMINI_API_KEY` - Tu API key de Google Gemini
   - `AI_PROVIDER=gemini` (o el proveedor que uses)
   - Configuración de base de datos

3. **Dependencias instaladas**:
   ```bash
   cd backend
   pipenv install  # o pip install -r requirements.txt
   ```

## 🚀 Opción 1: Testing Manual con el Servidor Completo

### Paso 1: Iniciar el Backend

```bash
cd backend
python3 main.py
```

El servidor debería iniciar en `http://localhost:8000`

### Paso 2: Verificar que el servidor está corriendo

```bash
curl http://localhost:8000/api/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "service": "simpla-backend",
  "version": "1.0.0"
}
```

### Paso 3: Autenticarse (obtener token)

Primero necesitas crear un usuario o usar uno existente:

```bash
# Registrar nuevo usuario
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "full_name": "Test User"
  }'
```

Luego hacer login:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

Guarda el `access_token` de la respuesta.

### Paso 4: Testear la Repregunta

**Caso 1: Pregunta Vaga (debería generar repregunta)**

```bash
TOKEN="tu_access_token_aqui"

curl -X POST http://localhost:8000/api/conversations/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "háblame de contratos",
    "chat_type": "normativa_nacional",
    "tone": "default"
  }'
```

**Resultado esperado**: Debería retornar una repregunta tipo:
> "¿Te refieres a contratos laborales, civiles, comerciales, de locación o algún otro tipo específico de contrato?"

**Observa los logs** para ver:
- ✅ "Analyzing question completeness..."
- ✅ "Question needs clarification: ..."
- ❌ NO debería aparecer "Fetching legal context" (no llama a vector DB)

---

**Caso 2: Pregunta sin Contexto (debería generar repregunta)**

```bash
curl -X POST http://localhost:8000/api/conversations/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "¿qué dice el artículo 5?",
    "chat_type": "normativa_nacional",
    "tone": "default"
  }'
```

**Resultado esperado**:
> "¿De qué ley o norma necesitas información sobre el artículo 5?"

---

**Caso 3: Pregunta Específica (NO debería generar repregunta)**

```bash
curl -X POST http://localhost:8000/api/conversations/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "¿cuáles son las causales de despido con justa causa según la LCT?",
    "chat_type": "normativa_nacional",
    "tone": "default"
  }'
```

**Resultado esperado**:
- Respuesta directa con información legal
- En los logs debería aparecer "Fetching legal context" (SÍ llama a vector DB)

---

**Caso 4: Respuesta a Repregunta (contextualización)**

Primero haz una pregunta vaga, guarda el `session_id` de la respuesta, luego:

```bash
SESSION_ID="session_id_de_la_respuesta_anterior"

curl -X POST http://localhost:8000/api/conversations/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "laborales",
    "session_id": "'$SESSION_ID'",
    "chat_type": "normativa_nacional",
    "tone": "default"
  }'
```

**Resultado esperado**:
- Respuesta sobre contratos laborales
- En logs: "Skipping analysis - this is a response to a clarification question"
- En logs: "Contextualized question: háblame de contratos laborales"

---

## 🧪 Opción 2: Testing con Script Python

Crea un archivo `test_repregunta.py`:

```python
#!/usr/bin/env python3
"""Script para testear la funcionalidad de repregunta."""

import asyncio
import sys
sys.path.insert(0, '/Users/inakibengolea/tesis/simpla-main/backend')

from features.conversations.question_analysis import analyze_question_completeness

async def test_question(question: str):
    """Test a single question."""
    print(f"\n{'='*60}")
    print(f"Testing: {question}")
    print('='*60)

    result = await analyze_question_completeness(question)

    print(f"✅ Sufficient: {result.is_sufficient}")
    if not result.is_sufficient:
        print(f"❓ Clarification needed: {result.clarification_needed}")
    print(f"📝 Analysis: {result.analysis}")

async def main():
    """Run all tests."""
    test_cases = [
        "háblame de contratos",
        "¿qué dice el artículo 5?",
        "necesito información sobre licencias",
        "¿cuáles son las causales de despido con justa causa según la LCT?",
        "¿qué dice el Código Civil sobre prescripción de acciones?",
        "requisitos para registro",
    ]

    for question in test_cases:
        await test_question(question)
        await asyncio.sleep(1)  # Para no saturar la API

if __name__ == "__main__":
    asyncio.run(main())
```

Ejecutar:

```bash
cd /Users/inakibengolea/tesis/simpla-main/backend
python3 test_repregunta.py
```

---

## 🧪 Opción 3: Testing Unitario (sin servidor)

Crea un archivo `test_analysis_only.py`:

```python
#!/usr/bin/env python3
"""Test solo el análisis de completitud sin todo el pipeline."""

import asyncio
import sys
import os

# Configurar path
sys.path.insert(0, '/Users/inakibengolea/tesis/simpla-main/backend')

# Asegurarse de que las variables de entorno estén configuradas
os.environ.setdefault('GEMINI_API_KEY', 'tu_api_key_aqui')
os.environ.setdefault('AI_PROVIDER', 'gemini')

from features.conversations.question_analysis import (
    analyze_question_completeness,
    should_skip_analysis,
    get_contextualized_question
)

async def test_completeness_analysis():
    """Test análisis de completitud."""
    print("\n🧪 Test 1: Pregunta vaga")
    result = await analyze_question_completeness("háblame de contratos")
    assert not result.is_sufficient, "Debería detectar que necesita clarificación"
    assert result.clarification_needed is not None
    print(f"✅ Detectó necesidad de clarificación: {result.clarification_needed[:50]}...")

    print("\n🧪 Test 2: Pregunta específica")
    result = await analyze_question_completeness(
        "¿cuáles son las causales de despido con justa causa según la LCT?"
    )
    assert result.is_sufficient, "Debería detectar que es suficiente"
    assert result.clarification_needed is None
    print("✅ Detectó que es suficiente")

def test_skip_analysis():
    """Test lógica de skip."""
    print("\n🧪 Test 3: Skip analysis cuando hay clarificación previa")

    # Caso 1: Sin metadata previa
    should_skip = should_skip_analysis("test", None)
    assert not should_skip
    print("✅ No skip cuando no hay metadata")

    # Caso 2: Con needs_clarification = True
    should_skip = should_skip_analysis("test", {"needs_clarification": True})
    assert should_skip
    print("✅ Skip cuando mensaje anterior necesitaba clarificación")

    # Caso 3: Con clarification_count >= 1
    should_skip = should_skip_analysis("test", {"clarification_count": 1})
    assert should_skip
    print("✅ Skip cuando se alcanzó el límite de repreguntas")

def test_contextualization():
    """Test contextualización."""
    print("\n🧪 Test 4: Contextualización de preguntas")

    class MockMessage:
        def __init__(self, role, content):
            self.role = role
            self.content = content

    previous_messages = [
        MockMessage("user", "háblame de contratos"),
        MockMessage("assistant", "¿qué tipo de contratos?"),
    ]

    contextualized = get_contextualized_question(
        "laborales",
        previous_messages
    )

    assert "háblame de contratos" in contextualized
    assert "laborales" in contextualized
    print(f"✅ Pregunta contextualizada: {contextualized}")

async def main():
    """Run all tests."""
    print("="*60)
    print("🧪 Testing Repregunta Functionality")
    print("="*60)

    await test_completeness_analysis()
    test_skip_analysis()
    test_contextualization()

    print("\n" + "="*60)
    print("✅ Todos los tests pasaron!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
```

Ejecutar:

```bash
cd /Users/inakibengolea/tesis/simpla-main/backend
python3 test_analysis_only.py
```

---

## 📊 Verificación de Logs

Durante el testing, busca estos mensajes en los logs:

### ✅ Cuando detecta necesidad de clarificación:
```
INFO - Analyzing question completeness...
INFO - Question needs clarification: La pregunta es muy vaga...
INFO - Skipping vector DB - returning clarification
```

### ✅ Cuando es respuesta a repregunta:
```
INFO - Skipping analysis - this is a response to a clarification question
INFO - Contextualized question: háblame de contratos laborales
INFO - Fetching legal context...
```

### ✅ Cuando pregunta es suficiente:
```
INFO - Analyzing question completeness...
INFO - Question analysis complete - Sufficient: True
INFO - Fetching legal context...
```

---

## 🐛 Troubleshooting

### Error: "GEMINI_API_KEY not found"
- Verifica que tienes el `.env` configurado en `/backend/.env`
- Verifica que el archivo contiene `GEMINI_API_KEY=tu_clave_aqui`

### Error: "Connection refused to localhost:50052"
- El microservicio vectorial no está corriendo
- Inicia el servicio vectorial antes de testear

### Error: "Invalid JSON response from LLM"
- El LLM puede devolver texto adicional fuera del JSON
- Revisa los logs para ver la respuesta raw
- El código debería manejar esto automáticamente (limpieza de markdown)

### No se activa la repregunta
- Verifica los logs para ver el análisis del LLM
- Puede que el prompt necesite ajustes para tu modelo específico
- Intenta con preguntas más vagas ("contratos", "artículo 5")

---

## 📝 Casos de Prueba Recomendados

| Pregunta | Esperado | Verificar |
|----------|----------|-----------|
| "háblame de contratos" | Repregunta | ❌ No llama vector DB |
| "¿qué dice el artículo 5?" | Repregunta | ❌ No llama vector DB |
| "requisitos para registro" | Repregunta | ❌ No llama vector DB |
| "LCT artículo 245" | Respuesta directa | ✅ Llama vector DB |
| "despido sin justa causa LCT" | Respuesta directa | ✅ Llama vector DB |
| Respuesta: "laborales" (después de repregunta) | Respuesta directa | ✅ Usa contexto |

---

## 🎯 Próximos Pasos

Después de verificar que funciona:

1. **Ajustar el prompt** si es necesario (en `clarification_prompts.py`)
2. **Modificar límite de repreguntas** si quieres más de 1 (en `should_skip_analysis`)
3. **Agregar métricas** para medir ahorro de cómputo
4. **Testear con usuarios reales** para ver calidad de repreguntas

---

## 💡 Tips

- Usa `tail -f` en los logs para ver el flujo en tiempo real
- Prueba con diferentes `chat_type` (normativa_nacional, constituciones, norma_chat)
- Prueba con diferentes `tone` (formal, academico, conciso)
- Mide el tiempo de respuesta - las repreguntas deberían ser más rápidas (no hay vector DB)
