# Guía de Onboarding Técnico - Homepty CBF (Core Backend Framework)

¡Bienvenido a **Homepty CBF**! Este repositorio sirve como el motor y backend centralizado que aprovisiona, gestiona e integra los sitios web satélite personalizados de los asesores del ecosistema Homepty. 

Esta guía te proporcionará una inmersión profunda en la arquitectura del sistema, el flujo de datos, la estructura de la base de datos y los flujos clave del negocio para que puedas comenzar a desarrollar de inmediato.

---

## 1. Arquitectura y Enrutamiento Multi-Tenant

Homepty CBF está construido con **Next.js 16 (App Router)** y está diseñado para soportar múltiples inquilinos (multi-tenant) a través de subdominios y dominios personalizados.

```mermaid
graph TD
    UserRequest[Petición del Cliente] --> Middleware[middleware.ts]
    Middleware -->|Subdominio o Custom Domain| RewriteSite[Interno: /sites/subdomain/page.tsx]
    Middleware -->|Ruta Normal / API| RootApp[Ruta raíz / API CBF]
    
    RewriteSite --> DBResolve[lib/db.ts - getSiteByDomain]
    DBResolve --> Supabase[(Supabase Central)]
    
    AdminSuite[CRM Suite app.homepty.com] --> AdminAPI[/api/cbf/admin/create-site]
    AdminAPI --> CreateSite[Registra user_sites]
    CreateSite --> VercelDeploy[lib/vercel.ts - deployVercelProject]
    VercelDeploy -->|Clona Agencia-template-CBF| Vercel[Vercel Projects]
```

### Flujo de Enrutamiento Dinámico
El archivo clave para este comportamiento es [middleware.ts](file:///Users/eduardovo/Developer/homepty-cbf/middleware.ts):
1. **Detección de Hostname**: Extrae el subdominio del request (soportando desarrollo local `tenant.localhost:3000`, URLs de vista previa de Vercel `tenant---branch.vercel.app` y producción `tenant.homepty.com`).
2. **Dominios Personalizados**: Si no es un subdominio conocido de la plataforma (por ejemplo, `miinmobiliaria.com`), el middleware realiza una consulta rápida a Supabase mediante la función `getSubdomainFromCustomDomain` para verificar si es un dominio personalizado verificado.
3. **Reescritura de Rutas**: Si se detecta un subdominio/dominio válido, reescribe internamente la URL hacia la ruta del sitio satélite: `src/app/sites/[subdomain]/...` de forma transparente para el usuario final.
4. **Protección**: Bloquea el acceso a rutas administrativas (`/api/cbf/admin/*`) cuando provienen de sitios satélite.

---

## 2. Aprovisionamiento y Despliegues Automáticos (Vercel)

El CBF se encarga de aprovisionar de forma dinámica la infraestructura para los nuevos sitios satélite.

* **Flujo de Creación**: El endpoint [/api/cbf/admin/create-site](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/admin/create-site/route.ts) recibe peticiones del CRM central (`app.homepty.com`) indicando el ID del asesor y los datos de dominio deseados.
* **Integración con Vercel**: Llama a la función `deployVercelProject` expuesta en [lib/vercel.ts](file:///Users/eduardovo/Developer/homepty-cbf/lib/vercel.ts), la cual interactúa con la API de Vercel para:
  1. Crear un nuevo proyecto clonando la plantilla base de frontend: `LaloVO/Agencia-template-CBF`.
  2. Configurar las variables de entorno del cliente (`VITE_CBF_API_URL` y `VITE_CBF_API_KEY`).
  3. Vincular el subdominio correspondiente en Vercel (`subdomain.homepty.com`).

---

## 3. Estructura y Esquema de Base de Datos

El framework se conecta de manera directa a la base de datos centralizada de Homepty en Supabase, utilizando el cliente configurado en [lib/supabase.ts](file:///Users/eduardovo/Developer/homepty-cbf/lib/supabase.ts). 

> [!IMPORTANT]
> El CBF opera server-side. Por lo tanto, utiliza la clave `SUPABASE_SERVICE_ROLE_KEY` para bypassear las Políticas de Seguridad a Nivel de Fila (RLS) en las tablas críticas para garantizar el acceso multi-inquilino seguro desde el servidor.

### Relación de Tablas Clave
Las interfaces de typescript que definen los modelos de datos se encuentran en [lib/supabase.ts](file:///Users/eduardovo/Developer/homepty-cbf/lib/supabase.ts). El sistema utiliza las siguientes entidades principales:

1. **`user_sites`**: Configuración e identidad visual del sitio de cada asesor.
   * `user_id_supabase` (UUID): Enlace al usuario propietario.
   * `cbf_api_key`: API Key única del sitio (`cbf_live_...`).
   * `subdomain` / `custom_domain`: Dominios asignados.
   * `theme_config`: Colores primarios/secundarios, tipografía, enlaces de logos y banners.
   * `seo_config`: Títulos y descripciones predeterminadas para los buscadores.
2. **`propiedades`**: El catálogo de bienes raíces. Filtrado por `id_usuario` para asociar las propiedades a su respectivo asesor.
3. **`imagenes_propiedades`**: URLs de imágenes asociadas a cada propiedad.
4. **`solicitudes`**: Registro de leads que ingresan a través de los embudos de los sitios satélite.
5. **`eventos_calendario`**: Calendario del asesor (usado para saber la disponibilidad de citas).
6. **`hub_posts`**: Artículos de blog creados por el asesor, opcionalmente vinculados a una propiedad.
7. **`usuarios`**: Perfil y ubicación base del asesor.

---

## 4. Sistema de Autenticación por API Key (CBF API Key)

Todos los endpoints orientados al consumo desde el cliente (sitios satélite) se protegen mediante el patrón de API Keys.

* **Formato**: Las llaves siguen el prefijo `cbf_live_` (ej. `cbf_live_lpx9z0123...`).
* **Header**: Las solicitudes de los sitios satélite deben incluir:
  ```http
  Authorization: Bearer cbf_live_xxxxxxxxxxxxx
  ```
* **Mecanismo Interno**: El helper `authMiddleware` en [lib/auth.ts](file:///Users/eduardovo/Developer/homepty-cbf/lib/auth.ts) intercepta la petición, extrae la llave y ejecuta `verifyApiKey` para buscar en `user_sites` si la llave existe y si el sitio está marcado como activo (`is_active = true`). Devuelve el ID de usuario del asesor (`userId`), vinculando así dinámicamente toda la consulta de base de datos a los datos de ese asesor específico.

---

## 5. Catálogo Completo de Endpoints de la API

La API del CBF está expuesta bajo el prefijo `/api/cbf/`. Todas las rutas del cliente requieren autenticación con `Authorization: Bearer <cbf_api_key>` a menos que se indique lo contrario.

### A. Gestión de Sitios y Administración (Interna / CRM)
* **`POST /api/cbf/admin/create-site`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/admin/create-site/route.ts)
  * *Uso*: Creación interna de un sitio y detonador de despliegue en Vercel. Protegido con `CBF_ADMIN_API_KEY`.
  * *Body*: `{ user_id_supabase, site_name, subdomain, custom_domain }`
* **`POST /api/cbf/setup-site`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/setup-site/route.ts)
  * *Uso*: Configura o modifica los estilos del sitio satélite (color principal, logo, tagline, etc.) y actualiza Vercel.
  * *Body*: `{ usuario_id, site_name, tagline, description, modules, primary_color, logo_url }`

### B. Consumo de Información del Asesor
* **`GET /api/cbf/user`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/user/route.ts)
  * *Uso*: Obtiene la información del perfil del asesor y la configuración visual/SEO de su sitio web, incluyendo llaves públicas requeridas (como tokens de Mapbox).
* **`GET /api/cbf/calendar/busy-slots`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/calendar/busy-slots/route.ts)
  * *Uso*: Devuelve los rangos de fecha y hora que el asesor tiene bloqueados (`fecha_inicio` a `fecha_fin`) para evitar encimar citas en los formularios de captura.
* **`GET /api/cbf/posts`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/posts/route.ts)
  * *Uso*: Retorna los artículos del blog del asesor. Si están vinculados a una propiedad (`property_id`), adjunta la información de dicha propiedad y sus imágenes.

### C. Propiedades
* **`GET /api/cbf/properties`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/properties/route.ts)
  * *Uso*: Lista las propiedades activas asociadas al asesor.
  * *Query Params*: `limit` (max 100), `offset` (paginación), `tipo` (tipo de inmueble), `id_tipo_accion` (1=Venta, 2=Renta), `is_unit` (true/false).
* **`GET /api/cbf/properties/[id]`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/properties/[id]/route.ts)
  * *Uso*: Obtiene los detalles completos de una propiedad por su ID, uniendo imágenes (`imagenes_propiedades`) y amenidades (`amenidades_propiedades`).

### D. Registro de Leads (Embudo de 6 Pasos)
* **`POST /api/cbf/leads`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/leads/route.ts)
  * *Uso*: Registra un lead cualificado procedente del formulario inteligente de 6 pasos del sitio web.
  * *Transformación de Datos*:
    * Mapea descripciones textuales de estado/ciudad a IDs relacionales (`id_estado`, `id_ciudad`) consultando las tablas correspondientes.
    * Compila metadatos (financiamiento, documentos disponibles cargados en almacenamiento, cita virtual seleccionada) en una bitácora detallada dentro del campo `detalles_adicionales`.
    * Inserta la solicitud en `solicitudes` y genera una alerta instantánea en `notifications` para que el asesor reciba una alerta push/in-app en su CRM.

### E. Integración con Homepty Brain (Fase 2 - Proxies tRPC)
Estos endpoints actúan como puentes hacia los modelos de Inteligencia Artificial de `homepty-brain-v1` usando el cliente configurado en [lib/brain-client.ts](file:///Users/eduardovo/Developer/homepty-cbf/lib/brain-client.ts).
* **`POST /api/cbf/valuation`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/valuation/route.ts) -> Estima el precio de una propiedad con base en sus dimensiones, tipo y zona.
* **`POST /api/cbf/recommendations`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/recommendations/route.ts) -> Obtiene inmuebles recomendados según presupuesto y perfil de búsqueda.
* **`GET /api/cbf/analysis/market`** [código](file:///Users/eduardovo/Developer/homepty-cbf/app/api/cbf/analysis/market/route.ts) -> Extrae tendencias, precios promedio por metro cuadrado e insights de la zona geográfica.

> [!NOTE]
> En la etapa MVP actual, la integración con Brain está preparada a nivel de firmas y rutas de proxy, pero las funciones en [lib/brain-client.ts](file:///Users/eduardovo/Developer/homepty-cbf/lib/brain-client.ts) retornan valores simulados/nulos hasta la activación definitiva de la Fase 2.

---

## 6. Sistema de Componentes Dinámicos (PageRenderer)

El framework posee un renderizador dinámico que permite a los asesores estructurar la página de inicio y el detalle de propiedad a través de plantillas basadas en componentes registrables.

* **El Renderizador**: [PageRenderer.tsx](file:///Users/eduardovo/Developer/homepty-cbf/app/components/PageRenderer.tsx) toma una configuración JSON de la base de datos (con rutas, slots y props) y mapea dinámicamente qué componente inyectar en cada sección del sitio satélite.
* **El Registro**: [registry.ts](file:///Users/eduardovo/Developer/homepty-cbf/app/components/registry.ts) expone el catálogo de componentes disponibles:
  * `HeroSearchV1`: Hero moderno con buscador integrado ([código](file:///Users/eduardovo/Developer/homepty-cbf/app/components/HeroSections/HeroSearchV1.tsx)).
  * `PropertyGridV2`: Cuadrícula con las fichas de las propiedades más destacadas ([código](file:///Users/eduardovo/Developer/homepty-cbf/app/components/PropertyGridV2.tsx)).
  * `ValuationChartV1`: Gráfico interactivo de valuación e históricos ([código](file:///Users/eduardovo/Developer/homepty-cbf/app/components/ValuationChartV1.tsx)).
  * `PropertyDetailsV3`: Ficha detallada del inmueble ([código](file:///Users/eduardovo/Developer/homepty-cbf/app/components/PropertyDetailsV3.tsx)).
  * `LeadCaptureFormV2`: Formulario de conversión y perfilamiento de prospectos ([código](file:///Users/eduardovo/Developer/homepty-cbf/app/components/LeadCaptureFormV2.tsx)).

---

## 7. Pasarela de Pago y Suscripciones (Stripe Webhooks)

El ciclo de facturación y activación del plan del asesor se automatiza con Stripe mediante el manejador de webhooks en [app/api/webhooks/stripe/route.ts](file:///Users/eduardovo/Developer/homepty-cbf/app/api/webhooks/stripe/route.ts).

1. **Webhook**: Recibe eventos firmados desde Stripe y valida su firma digital con `STRIPE_WEBHOOK_SECRET`.
2. **Activación de Cuenta**: Al recibir `checkout.session.completed`, extrae el `client_reference_id` (que contiene el ID de usuario del asesor) y vincula su tipo de suscripción según el enlace de pago (`asesor_starter`, `asesor_independiente`, `inmobiliaria`, etc.).
3. **Flujo de Despliegue**: Actualiza el estado del sitio a activo en `user_sites` y detona de inmediato el despliegue automático del frontend en Vercel.
4. **Sistema de Referidos**: Si el sitio tiene un código de referido asociado, genera un webhook firmado y lo notifica de forma segura al CRM central.

---

## 8. Guía de Desarrollo Local y Buenas Prácticas

### Requisitos Previos e Instalación
Clona el repositorio e instala las dependencias de Node:
```bash
git clone https://github.com/LaloVO/Homepty-CBF_Tite_Testing.git
cd Homepty-CBF_Tite_Testing
pnpm install
```

### Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto con la siguiente estructura base:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nxouqoyppkiqrhfzovny.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-para-bypass-de-rls

# Activación / Despliegues en Vercel
VERCEL_API_TOKEN=tu-token-de-vercel
VERCEL_TEAM_ID=tu-team-id-de-vercel
CBF_API_BASE_URL=https://cbf.homepty.com

# Integración con Stripe
STRIPE_SECRET_KEY=tu-secret-key-de-stripe
STRIPE_WEBHOOK_SECRET=tu-webhook-secret-de-stripe

# Integración con Brain (Fase 2)
BRAIN_API_URL=http://localhost:3001/trpc
```

### Ejecutar en Desarrollo
```bash
pnpm dev
```
El servidor de Next.js se levantará en `http://localhost:3000`.

### Mantenimiento del Grafo de Conocimiento (`graphify`)
Este repositorio utiliza el sistema de grafos de conocimiento `graphify` para mapear los componentes del sistema y las relaciones entre archivos.

> [!IMPORTANT]
> De acuerdo con las reglas de desarrollo definidas en [CLAUDE.md](file:///Users/eduardovo/Developer/homepty-cbf/CLAUDE.md), siempre que realices cambios significativos en el código de producción, debes ejecutar la actualización del grafo para mantener la documentación técnica viva y libre de desfases.

Para actualizar el grafo sin costo de API (análisis de árbol de sintaxis abstracta - AST):
```bash
graphify update .
```
Esto regenerará los reportes interactivos dentro del directorio `graphify-out/`.
