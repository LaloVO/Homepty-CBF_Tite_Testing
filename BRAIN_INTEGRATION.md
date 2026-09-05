# Integración con Homepty Brain

Este documento describe cómo el CBF se integra con Homepty Brain para proporcionar análisis avanzados y predicciones a los sitios satélite.

## Arquitectura

```
Sitio Satélite → CBF API → Homepty Brain (tRPC)
```

El CBF actúa como un **proxy** entre los sitios satélite y Homepty Brain, proporcionando:
- Autenticación centralizada (CBF_API_KEY)
- Rate limiting y control de acceso
- Transformación de datos
- Caché de respuestas (futuro)

## Módulo Inteligencia (activo)

Namespace dedicado para capacidades del Brain con **billing por consumo**.
Cada llamada al Brain se registra en la tabla `brain_api_usage` (DB del Brain,
proyecto `zwmzfqlxcgqlasnbqfjb`) con `cost_units` por endpoint.

### POST /api/cbf/intelligence/valuation

Valuación de inmueble con el AVM del Brain (`valueweb.estimate`) + explicación
LLM (`ai.interpretation.valuation`).

**Headers:**
```
Authorization: Bearer cbf_live_xxxxx
Content-Type: application/json
```

**Body:**
```json
{
  "lat": 19.428,
  "lon": -99.165,
  "direccion": "Polanco, Ciudad de México",
  "tipo_inmueble": 4,
  "superficie_construida": 120,
  "habitaciones": 3,
  "banos": 2,
  "estacionamientos": 2,
  "estado_conservacion": "bueno"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "valor": 20259453.02,
    "valor_m2": 101575.08,
    "rango": [17220535.07, 23298370.97],
    "confidence": 0.2,
    "explanation": {
      "summary": "La propiedad tiene un precio predicho de $20,259,453.02...",
      "keyInsights": ["..."],
      "recommendations": ["..."],
      "riskFactors": ["..."],
      "opportunities": ["..."]
    },
    "comparables": 12,
    "status": "estimated"
  }
}
```

**Sin comparables suficientes (200, no es error):**
```json
{
  "success": false,
  "code": "INSUFFICIENT_COMPARABLES",
  "message": "No hay suficientes avalúos comparables para una estimación con calidad.",
  "comparableCount": 3,
  "suggestedNextSteps": ["..."]
}
```

**Errores:** `401` key inválida · `400` campos faltantes · `502` Brain inalcanzable.

**Billing:** 2 registros por llamada exitosa — `valueweb.estimate` (1 unit) y
`ai.interpretation.valuation` (1 unit).

### Endpoints legacy (stubs — NO activos)

`/api/cbf/valuation`, `/api/cbf/analysis/market` y `/api/cbf/recommendations`
existen pero sus funciones en `lib/brain-client.ts` (`getPropertyValuation`,
`getMarketAnalysis`, `getPropertyRecommendations`) **retornan null/[] sin llamar
al Brain** (Fase 2 pendiente). No usarlos para integraciones nuevas: usar el
namespace `/api/cbf/intelligence/*`.

## Configuración

### Variables de Entorno

Agregar al `.env.local`:

```env
# Homepty Brain Configuration
BRAIN_API_URL=https://ml.homepty.com/api/trpc
HOMEPTY_BRAIN_API_KEY=<api key del Brain>
BRAIN_DATABASE_URL=postgresql://postgres.zwmzfqlxcgqlasnbqfjb:***@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

Notas:
- `BRAIN_API_URL` y `HOMEPTY_BRAIN_API_KEY` también deben existir en Vercel (Production).
- `BRAIN_DATABASE_URL` usa el **pooler** de Supabase (`aws-1-us-east-1.pooler.supabase.com`),
  NO la direct connection (`db.zwmzfqlxcgqlasnbqfjb.supabase.co`) — el hostname
  directo no resuelve desde Vercel (ENOTFOUND).
- El cliente tRPC usa **SuperJSON** como transformer (el Brain lo exige; sin él
  el input llega como `undefined` → 400).
- Los queries tRPC van por **GET** (el Brain rechaza POST para `.query()` con 405).

### Desarrollo Local

Para probar la integración en desarrollo local:

1. El Brain corre en prod (`https://ml.homepty.com`). No es necesario levantarlo local.
2. Iniciar Homepty CBF:
```bash
cd homepty-cbf
pnpm dev -- -p 8080
# Corre en http://localhost:8080
```

3. Probar endpoints:
```bash
curl -X POST http://localhost:8080/api/cbf/intelligence/valuation \
  -H "Authorization: Bearer cbf_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"lat":19.428,"lon":-99.165,"direccion":"Polanco, CDMX","tipo_inmueble":4,"superficie_construida":120}'
```

## Routers del Brain Disponibles

El CBF puede consumir los siguientes routers del Brain:

| Router | Descripción | Endpoints Implementados |
|--------|-------------|------------------------|
| `valuewebRouter` | AVM / estimación de valor | ✅ `valueweb.estimate` (vía `/intelligence/valuation`) |
| `aiRouter` | Servicios de IA | ✅ `ai.interpretation.valuation` (vía `/intelligence/valuation`) |
| `mlRouter` | Modelos de ML | 🔄 Por implementar (SageMaker, `ml.valuation.predict`) |
| `analysisRouter` | Análisis de mercado | 🔄 Por implementar |
| `financialRouter` | Análisis financiero | 🔄 Por implementar |
| `spatialRouter` | Análisis espacial | 🔄 Por implementar |
| `semanticSearchRouter` | Búsqueda semántica | 🔄 Por implementar |

## Billing (brain_api_usage)

Tabla en la DB del Brain (proyecto `zwmzfqlxcgqlasnbqfjb`):

```sql
CREATE TABLE IF NOT EXISTS brain_api_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id_supabase TEXT,
  cbf_api_key TEXT,
  brain_endpoint TEXT NOT NULL,
  cost_units INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ok',
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

El registro es fire-and-forget (nunca rompe la respuesta). Consulta de uso por sitio:

```sql
SELECT cbf_api_key, brain_endpoint, count(*), sum(cost_units)
FROM brain_api_usage
GROUP BY 1, 2 ORDER BY 3 DESC;
```

## Próximos Pasos

1. **Implementar caché**: Agregar Redis para cachear respuestas del Brain
2. **Rate limiting**: Limitar llamadas al Brain por usuario (por `cbf_api_key`)
3. **Monitoreo**: Dashboard de uso sobre `brain_api_usage`
4. **Webhooks**: Notificaciones cuando hay nuevos análisis disponibles

## Notas Técnicas

- El cliente tRPC se configura en `lib/brain-client.ts` (transformer SuperJSON, auth Bearer)
- Los endpoints del CBF actúan como proxies en `app/api/cbf/`
- La autenticación se maneja en `lib/auth.ts`
- Los tipos del Brain deben sincronizarse manualmente por ahora

## Troubleshooting

### Error: "Cannot connect to Brain"

Verificar que:
1. `BRAIN_API_URL` esté configurado correctamente (prod: `https://ml.homepty.com/api/trpc`)
2. `HOMEPTY_BRAIN_API_KEY` sea la key vigente del Brain (401 "API key required" = key inválida/ausente)
3. No haya firewalls bloqueando la conexión

### Error: "Invalid API Key"

Verificar que:
1. El `CBF_API_KEY` sea válido
2. El sitio del usuario esté activo en `user_sites`
3. El header `Authorization` tenga el formato correcto

### Error: billing no registra (ENOTFOUND db.*)

La direct connection `db.zwmzfqlxcgqlasnbqfjb.supabase.co` no resuelve desde
Vercel. Usar el pooler: `aws-1-us-east-1.pooler.supabase.com` con usuario
`postgres.zwmzfqlxcgqlasnbqfjb`.
