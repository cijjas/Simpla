# Normas Feature

This feature handles legal norms (normas) and their hierarchical structure, including divisions and articles. It provides a comprehensive API for document exploration with efficient bulk operations and detailed document retrieval.

## Overview

The normas feature provides functionality to:
- **Search and filter normas** with multiple criteria (jurisdiction, type, status, dates, text search)
- **List normas efficiently** for bulk operations (returns summaries without full structure)
- **Retrieve complete normas** with full hierarchical structure (divisions and articles)
- **Get filter options** dynamically from the database
- **Retrieve statistics** about normas in the database

## Key Design Decisions

### Two-Tier Retrieval Strategy

1. **Summary/List Endpoints** - Optimized for bulk operations:
   - Returns only main fields without recursive construction
   - Perfect for browsing 40+ normas at once
   - Includes: metadata, dates, titles, status
   - Excludes: divisions, articles, full text content

2. **Detail Endpoint** - Full document structure:
   - Reconstructs complete hierarchical structure
   - Includes all divisions and articles
   - Use when you need the complete document

## Database Tables

The feature works with three Supabase tables:

1. **norma_structured** - Main table containing norma metadata and content
2. **norma_divisions** - Divisions within normas (hierarchical structure)
3. **norma_articles** - Articles within divisions (hierarchical structure)

## Architecture

```
┌─────────────────┐
│ normas_routes   │  FastAPI endpoints
└────────┬────────┘
         │
┌────────▼────────────┐
│ normas_reconstructor│  Business logic layer
└────────┬────────────┘
         │
┌────────▼────────┐
│ Database (PostgreSQL)│
└─────────────────┘
```

## Files

- **`normas_models.py`** - Pydantic models for data validation (internal models)
- **`normas_schemas.py`** - Request/response schemas for API endpoints
- **`normas_reconstructor.py`** - Core logic for reconstructing normas from database
- **`normas_routes.py`** - FastAPI routes for the API endpoints
- **`test_normas.py`** - Comprehensive test suite

## API Endpoints

### 1. List Normas (Summary)

**`GET /api/normas/`**

List normas with optional filters. Returns summaries without full structure - optimized for bulk operations.

**Query Parameters:**
- `search_term` (optional): Search in titles, summaries, and observations
- `jurisdiccion` (optional): Filter by jurisdiction
- `tipo_norma` (optional): Filter by norma type
- `clase_norma` (optional): Filter by norma class
- `estado` (optional): Filter by status
- `sancion_desde` (optional): Filter normas sanctioned from this date (YYYY-MM-DD)
- `sancion_hasta` (optional): Filter normas sanctioned until this date (YYYY-MM-DD)
- `publicacion_desde` (optional): Filter normas published from this date (YYYY-MM-DD)
- `publicacion_hasta` (optional): Filter normas published until this date (YYYY-MM-DD)
- `limit` (default: 50, max: 100): Number of results per page
- `offset` (default: 0): Number of results to skip for pagination

**Response:**
```json
{
  "normas": [
    {
      "id": 1,
      "infoleg_id": 123,
      "jurisdiccion": "Nacional",
      "clase_norma": "Ley",
      "tipo_norma": "General",
      "sancion": "2020-01-15",
      "publicacion": "2020-01-20",
      "titulo_sumario": "Ley de ...",
      "titulo_resumido": "Ley 27000",
      "observaciones": "...",
      "nro_boletin": "12345",
      "pag_boletin": "1",
      "estado": "Vigente",
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ],
  "total_count": 150,
  "has_more": true,
  "limit": 50,
  "offset": 0
}
```

**Example Requests:**
```bash
# Get first 50 normas
GET /api/normas/?limit=50&offset=0

# Search for specific text
GET /api/normas/?search_term=educacion&limit=20

# Filter by jurisdiction and type
GET /api/normas/?jurisdiccion=Nacional&tipo_norma=Ley

# Filter by date range
GET /api/normas/?sancion_desde=2020-01-01&sancion_hasta=2023-12-31

# Combined filters
GET /api/normas/?jurisdiccion=Nacional&tipo_norma=Ley&estado=Vigente&limit=100
```

---

### 2. Get Norma Detail (Full Structure)

**`GET /api/normas/{norma_id}/`**

Get a complete norma with its full hierarchical structure (divisions and articles).

**Path Parameters:**
- `norma_id` (required): Internal ID of the norma

**Response:**
```json
{
  "id": 1,
  "infoleg_id": 123,
  "jurisdiccion": "Nacional",
  "clase_norma": "Ley",
  "tipo_norma": "General",
  "sancion": "2020-01-15",
  "publicacion": "2020-01-20",
  "titulo_sumario": "Ley de ...",
  "titulo_resumido": "Ley 27000",
  "texto_norma": "Full text...",
  "texto_norma_actualizado": "Updated text...",
  "estado": "Vigente",
  "divisions": [
    {
      "id": 1,
      "name": "Capítulo I",
      "ordinal": "1",
      "title": "Disposiciones Generales",
      "body": "...",
      "order_index": 1,
      "created_at": "2024-01-01T00:00:00",
      "articles": [
        {
          "id": 1,
          "ordinal": "1",
          "body": "Artículo 1: ...",
          "order_index": 1,
          "created_at": "2024-01-01T00:00:00",
          "child_articles": []
        }
      ],
      "child_divisions": []
    }
  ],
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

---

### 3. Get Norma Summary by ID

**`GET /api/normas/{norma_id}/summary/`**

Get a summary of a specific norma without the full hierarchical structure (lightweight).

**Path Parameters:**
- `norma_id` (required): Internal ID of the norma

**Response:** Same structure as items in the list endpoint

---

### 4. Get Norma by Infoleg ID

**`GET /api/normas/by-infoleg/{infoleg_id}/`**

Get a norma summary by its infoleg_id (external identifier).

**Path Parameters:**
- `infoleg_id` (required): Infoleg ID of the norma

**Response:** Same structure as summary endpoint

---

### 5. Get Filter Options

**`GET /api/normas/filter-options/`**

Get available filter options for normas. Returns unique values from the database.

**Response:**
```json
{
  "jurisdicciones": ["Nacional", "Provincial", "CABA"],
  "tipos_norma": ["Ley", "Decreto", "Resolución"],
  "clases_norma": ["General", "Especial"],
  "estados": ["Vigente", "Derogada", "Modificada"]
}
```

**Use Case:** Populate filter dropdowns in the frontend

---

### 6. Get Normas Statistics

**`GET /api/normas/stats/`**

Get statistics about normas in the database.

**Response:**
```json
{
  "total_normas": 1500,
  "total_divisions": 8500,
  "total_articles": 45000,
  "normas_by_jurisdiction": {
    "Nacional": 1200,
    "Provincial": 250,
    "CABA": 50
  },
  "normas_by_type": {
    "Ley": 800,
    "Decreto": 500,
    "Resolución": 200
  },
  "normas_by_status": {
    "Vigente": 1200,
    "Derogada": 200,
    "Modificada": 100
  }
}
```

---

## Usage Examples

### Python Client

```python
import requests

BASE_URL = "http://localhost:8000/api"

# 1. Get filter options first
response = requests.get(f"{BASE_URL}/normas/filter-options/")
options = response.json()
print(f"Available jurisdictions: {options['jurisdicciones']}")

# 2. List normas with filters (bulk operation)
response = requests.get(f"{BASE_URL}/normas/", params={
    "jurisdiccion": "Nacional",
    "tipo_norma": "Ley",
    "estado": "Vigente",
    "limit": 50,
    "offset": 0
})
data = response.json()
print(f"Found {data['total_count']} normas")

for norma in data['normas']:
    print(f"- {norma['titulo_resumido']}")

# 3. Get full details for a specific norma
norma_id = data['normas'][0]['id']
response = requests.get(f"{BASE_URL}/normas/{norma_id}/")
norma_detail = response.json()
print(f"\nNorma: {norma_detail['titulo_resumido']}")
print(f"Divisions: {len(norma_detail['divisions'])}")

# 4. Pagination example
all_normas = []
offset = 0
limit = 100

while True:
    response = requests.get(f"{BASE_URL}/normas/", params={
        "jurisdiccion": "Nacional",
        "limit": limit,
        "offset": offset
    })
    data = response.json()
    all_normas.extend(data['normas'])
    
    if not data['has_more']:
        break
    
    offset += limit

print(f"Retrieved {len(all_normas)} normas in total")
```

### JavaScript/TypeScript Client

```typescript
const BASE_URL = 'http://localhost:8000/api';

// 1. List normas with filters
async function listNormas(filters: {
  search_term?: string;
  jurisdiccion?: string;
  tipo_norma?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([_, v]) => v != null)
  );
  
  const response = await fetch(`${BASE_URL}/normas/?${params}`);
  return await response.json();
}

// 2. Get full norma detail
async function getNormaDetail(normaId: number) {
  const response = await fetch(`${BASE_URL}/normas/${normaId}/`);
  return await response.json();
}

// 3. Get filter options
async function getFilterOptions() {
  const response = await fetch(`${BASE_URL}/normas/filter-options/`);
  return await response.json();
}

// Usage
const options = await getFilterOptions();
const normas = await listNormas({
  jurisdiccion: options.jurisdicciones[0],
  limit: 50
});
```

---

## Configuration

The feature uses the `DATABASE_URL` environment variable from the settings configuration to connect to the PostgreSQL database.

**Environment Variable:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## Testing

Run the comprehensive test suite to verify functionality:

```bash
cd backend/features/normas
python test_normas.py
```

**Test Coverage:**
- Database connection
- Basic search functionality
- Text search
- Filter functionality (jurisdiction, type, status, dates)
- Combined filters
- Pagination
- Getting filter options
- Getting norma summary
- Getting norma by infoleg_id
- Full norma reconstruction
- Invalid ID handling

---

## Performance Considerations

### When to Use Each Endpoint

| Operation | Endpoint | Performance |
|-----------|----------|-------------|
| Browse/Search | `GET /normas/` | ⚡ Fast - no recursive queries |
| Document list | `GET /normas/{id}/summary/` | ⚡ Fast - single query |
| Read document | `GET /normas/{id}/` | 🐌 Slower - full reconstruction |

**Best Practices:**
1. Use **list endpoint** (`GET /normas/`) for browsing, searching, and displaying tables
2. Use **detail endpoint** (`GET /normas/{id}/`) only when user opens a specific document
3. Use **pagination** for large result sets
4. **Cache filter options** as they change infrequently
5. For bulk operations (e.g., showing 40+ normas), always use the list endpoint

---

## Dependencies

- `psycopg2` - PostgreSQL database adapter
- `pydantic` - Data validation
- `fastapi` - Web framework
- `python-dotenv` - Environment variable loading

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK** - Successful request
- **404 NOT FOUND** - Norma not found
- **500 INTERNAL SERVER ERROR** - Server error (with error message)

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Future Enhancements

Potential improvements:
- Full-text search using PostgreSQL's text search capabilities
- Caching layer for frequently accessed normas
- Export functionality (PDF, JSON)
- Version history tracking
- Related normas suggestions
- Bookmark/favorites functionality
- Advanced query language for complex searches
