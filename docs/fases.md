# FOLIO — Documento 2: Plan de Desarrollo para Claude Code
*Blueprint Ejecutable por Fases — Abril 2026*

---

## Estructura Global del Desarrollo

### Orden Óptimo de Fases

| Fase | Nombre | Tipo | Duración Est. | MVP |
|------|--------|------|---------------|-----|
| 0 | Wizard of Oz Demo | HTML estático local | 2–3 días | SÍ |
| 1 | Infraestructura Base | Setup + Auth | 3–5 días | SÍ |
| 2 | Organizaciones y Branding | Módulo de cuentas | 3–4 días | SÍ |
| 3 | Gestión de Propiedades y Archivos | CRUD + Storage | 5–7 días | SÍ |
| 4 | Motor de IA — Extracción | Claude + Firecrawl + Inngest | 5–7 días | SÍ |
| 5 | Generación de Fichas Técnicas | Claude + PDFme + Historial | 5–7 días | SÍ |
| 6 | MiniSite Público | SSR público + badge | 3–4 días | SÍ |
| 7 | Planes y Pagos | Stripe + Suscripciones | 4–5 días | SÍ |
| 8 | Plan Agencia y Multi-usuario | Roles + Invitaciones | 4–5 días | NO |
| 9 | Desarrollos | Módulo de proyectos | 3–4 días | NO |
| 10 | Pulimiento y Launch | Email, onboarding, SEO | 4–5 días | SÍ |

### Secuencia de Fases

**Secuencia obligatoria:** 0 → 1 → 3 → 4 → 5 → 6 → 7 → 10

**Paralelas posibles:**
- Fase 2 puede desarrollarse en paralelo con Fase 3 (ambas después de Fase 1).
- Fases 8 y 9 pueden desarrollarse en paralelo entre sí (ambas después de Fase 7).

**MVP mínimo lanzable (Fases 0–7 + Fase 10):** estimado 35–45 días de desarrollo enfocado.

### Cómo Usar Este Documento con Claude Code

Para ejecutar cada fase:

```
Desarrolla la Fase [N] — [Nombre] de Folio siguiendo exactamente las especificaciones de /docs/fases.md.
Stack: Next.js 14 + TypeScript + Tailwind + Supabase + Prisma.
Paleta de colores primaria: #1B3D2F. Canvas: #F5F2EC.
Genera todos los archivos necesarios según la estructura definida.
```

---

## FASE 0: WIZARD OF OZ DEMO
**Duración: 2–3 días | Herramienta: HTML + CSS + JS vanilla | Sin servidor**

### Objetivo
Crear un demo interactivo completamente estático que simule el flujo completo de Folio sin ningún backend ni base de datos. El archivo se ejecuta localmente (doble click en index.html). Se usa para validar el producto con brokers reales antes de escribir una línea de código de producción y para capturar emails de lista de espera.

### Qué incluye
- Pantalla de login con campos email y contraseña — al hacer click en "Entrar" avanza sin validación real.
- Dashboard con 3 propiedades ficticias: "Departamento Polanco", "Casa Santa Fe", "Local Condesa". Fotos de Unsplash.
- Flujo completo de "Agregar propiedad": pantalla de upload con dropzone visual animada → barra de progreso (setTimeout) → pantalla de "extrayendo datos..." → formulario pre-llenado con datos ficticios estáticos.
- Botón "Generar ficha técnica" → input de prompt → spinner de 3 segundos → apertura de PDF de muestra en nueva pestaña (PDF real pre-generado manualmente).
- Pantalla final con los 4 planes y CTA "Unirse a lista de espera" que abre un formulario con campo de email y nombre.
- El formulario de waitlist envía a Tally.so o Google Forms (servicio externo gratuito, sin backend).

### Qué NO incluye
- Ningún backend, API, base de datos ni autenticación real.
- Ningún procesamiento de archivos — la dropzone acepta archivos pero los ignora.
- El PDF de muestra es un archivo pre-creado manualmente, no generado por IA.
- No hay persistencia de datos entre sesiones del browser.

### Estructura de archivos
```
folio-demo/
  index.html           → pantalla de login
  dashboard.html       → dashboard con propiedades ficticias
  nueva-propiedad.html → flujo de upload y extracción simulada
  generar-ficha.html   → prompt + generación simulada
  planes.html          → pantalla de planes y waitlist
  sample-ficha.pdf     → ficha técnica de ejemplo pre-creada
  assets/              → CSS, JS, imágenes de Unsplash
```

### Reglas de negocio del demo
- El flujo es lineal: Login → Dashboard → Nueva Propiedad → Generar Ficha → Planes.
- Los botones "Volver" funcionan correctamente.
- Las animaciones de "procesando" duran exactamente 3 segundos.
- Los datos ficticios deben ser realistas: precio en MXN, dirección en CDMX, características coherentes.
- El diseño debe usar la paleta Folio: `#1B3D2F` como primario, `#F5F2EC` como canvas.

### Criterios de aceptación
1. El archivo index.html abre correctamente en Chrome sin servidor web.
2. Un broker puede completar el flujo completo (login → generar ficha) en menos de 3 minutos sin instrucciones.
3. El PDF de muestra abre correctamente en nueva pestaña.
4. El formulario de waitlist redirige a la página de confirmación de Tally/Google Forms.
5. El diseño es visualmente consistente con la paleta Folio en todos los archivos.

---

## FASE 1: INFRAESTRUCTURA BASE Y AUTENTICACIÓN
**Duración: 3–5 días | Stack: Next.js 14 + Supabase + Prisma + Tailwind**

### Objetivo
Configurar el proyecto Next.js 14 completo con toda la infraestructura base: autenticación funcional (email + Google OAuth), base de datos PostgreSQL con el esquema completo de Prisma, Tailwind con los tokens de diseño de Folio, y el layout base del dashboard. Al terminar esta fase, un usuario puede registrarse, iniciar sesión y ver un dashboard vacío.

### Qué incluye
- Proyecto Next.js 14 con App Router, TypeScript strict mode, ESLint y Prettier configurados.
- Tailwind CSS con los tokens de color de Folio definidos en `tailwind.config.ts`.
- shadcn/ui instalado con los componentes base: Button, Input, Form, Card, Toast.
- Supabase proyecto configurado (dev y prod): Auth, Database, Storage.
- Prisma con el esquema completo de las 7 tablas. Migración inicial aplicada.
- Supabase Auth: registro con email/contraseña, login, recuperación de contraseña, Google OAuth.
- Middleware de Next.js que protege todas las rutas `/dashboard/*` y redirige a `/login` si no hay sesión.
- Trigger de Supabase: al crear un usuario en `auth.users`, automáticamente crear registro en `public.users` y `public.organizations` (tipo individual).
- Layout base del dashboard: navbar con logo Folio, nombre del usuario, botón de logout. Sidebar vacío. Área de contenido.
- Página `/dashboard` vacía con mensaje "Aún no tienes propiedades. Agrega tu primera propiedad."
- Variables de entorno configuradas.

### Qué NO incluye
- CRUD de propiedades, archivos, fichas ni pagos.
- Lógica de roles (admin/agent) — todos los usuarios son admin en esta fase.
- Branding personalizado del broker.
- Emails transaccionales (se agregan en Fase 10).

### Estructura de archivos
```
src/
  app/
    (auth)/login/page.tsx
    (auth)/register/page.tsx
    (auth)/forgot-password/page.tsx
    (auth)/callback/route.ts          → OAuth callback handler
    dashboard/layout.tsx              → layout protegido con sidebar
    dashboard/page.tsx                → dashboard vacío
    api/auth/confirm/route.ts         → confirmación de email
  components/
    ui/                               → componentes shadcn/ui
    layout/Navbar.tsx
    layout/Sidebar.tsx
  lib/
    supabase/client.ts                → cliente browser
    supabase/server.ts                → cliente server
    prisma.ts                         → instancia de PrismaClient
  middleware.ts                       → protección de rutas
  types/                              → tipos TypeScript globales
prisma/
  schema.prisma                       → esquema completo de 7 tablas
  migrations/                         → migración inicial
```

### Endpoints — Fase 1

| Método | Ruta | Input | Output | Auth |
|--------|------|-------|--------|------|
| POST | /api/auth/register | { email, password, name } | { user, session } | NO |
| POST | /api/auth/login | { email, password } | { user, session } | NO |
| POST | /api/auth/logout | {} | { success } | SÍ |
| GET | /api/auth/callback | code (query param) | Redirect a /dashboard | NO |
| POST | /api/auth/forgot-password | { email } | { success } | NO |

### Criterios de aceptación — Fase 1
1. Usuario puede registrarse con email/contraseña y recibe email de confirmación.
2. Usuario puede iniciar sesión con Google OAuth y llega al dashboard.
3. Rutas `/dashboard/*` redirigen a `/login` si no hay sesión activa.
4. Al registrarse, se crea automáticamente un registro en `organizations` y `users`.
5. El dashboard muestra el nombre del usuario en el navbar.
6. `prisma db push` ejecuta sin errores con el esquema completo.

---

## FASE 2: ORGANIZACIONES Y BRANDING DEL BROKER
**Duración: 3–4 días | Depende de: Fase 1**

### Objetivo
Permitir que el broker configure su perfil profesional y branding opcional (logo, color de marca). Esta información se usa en las fichas técnicas generadas.

### Qué incluye
- Página `/dashboard/settings/profile`: editar nombre, email de contacto, teléfono (WhatsApp), website.
- Página `/dashboard/settings/branding`: subir logo (JPG/PNG, máx 2MB), seleccionar color de marca con color picker. Preview en tiempo real.
- Upload de logo a Supabase Storage en bucket `branding/{org_id}/logo.{ext}`. Actualizar `organizations.logo_url`.
- El branding es completamente opcional. Si no hay logo, las fichas usan el diseño genérico de Folio.
- API endpoint para actualizar organización.
- Componente `BrandingPreview`: card pequeña que muestra cómo quedaría una ficha con el logo y color seleccionado.

### Qué NO incluye
- Invitación de agentes ni panel de administración (Fase 8).
- Facturación ni cambio de plan (Fase 7).
- Eliminación de cuenta.

### Endpoints
```
GET  /api/v1/organization           → Datos de la organización del usuario autenticado
PUT  /api/v1/organization           → { name?, contact_email?, contact_phone?, website_url?, brand_color? }
POST /api/v1/organization/logo      → FormData con archivo de logo → { logo_url }
```

### Reglas de negocio
- El logo debe ser JPG o PNG. Máximo 2MB. Si excede, rechazar con error 400.
- El color de marca debe ser un hex válido (#RRGGBB). Validar con regex antes de guardar.
- El logo se redimensiona a máximo 400x400px server-side antes de subir (usar sharp).
- Solo el usuario con `role=admin` puede modificar el branding de la organización.

### Criterios de aceptación
1. Broker sube un PNG de 500KB como logo. Aparece en la vista de branding en menos de 3 segundos.
2. Broker selecciona color #FF5500. El preview de ficha refleja el cambio inmediatamente.
3. Si se sube un archivo de 3MB, el sistema muestra error "El logo debe pesar menos de 2MB".
4. Un usuario con `role=agent` no puede acceder a `/dashboard/settings/branding` (redirect o 403).
5. Los cambios de perfil se persisten después de cerrar sesión y volver a entrar.

---

## FASE 3: GESTIÓN DE PROPIEDADES Y REPOSITORIO DE ARCHIVOS
**Duración: 5–7 días | Depende de: Fases 1 y 2**

### Objetivo
Implementar el CRUD completo de propiedades y el sistema de subida y almacenamiento de archivos. Al terminar esta fase, el broker puede crear propiedades, subir imágenes, PDFs y agregar links. Los datos estructurados se llenan manualmente en esta fase (la extracción automática por IA llega en Fase 4).

### Qué incluye
- Dashboard `/dashboard/properties`: grid de cards con filtro por status (activa/pausada/vendida).
- Página `/dashboard/properties/new`: formulario de creación con campos básicos + dropzone de archivos.
- Página `/dashboard/properties/[id]`: vista detallada con tabs: Datos | Archivos | Fichas.
- Página `/dashboard/properties/[id]/edit`: edición de datos de la propiedad.
- File Dropzone: acepta imágenes (JPG, PNG, WEBP) y PDFs. Multi-archivo. Barra de progreso por archivo.
- Validaciones: imágenes máx 10MB, PDFs máx 25MB y 10 páginas.
- Upload a Supabase Storage: bucket `properties/{org_id}/{property_id}/{uuid}.{ext}`.
- Formulario de links: campo URL con tipo (portal_link o project_link). Validación de URL.
- Límite de almacenamiento por propiedad según plan: 150MB (per_use), 300MB (monthly/annual), 500MB (agency).
- Generación automática de `public_slug`: slug del título + sufijo aleatorio de 6 chars.
- Eliminación de archivos individuales con confirmación.

### Qué NO incluye
- Extracción de datos por IA de los archivos (Fase 4).
- Generación de fichas técnicas (Fase 5).
- MiniSite público (Fase 6).
- Vinculación a Desarrollos (Fase 9).

### Endpoints
```
GET    /api/v1/properties             → Lista de propiedades del usuario (con filtros)
POST   /api/v1/properties             → { title, type?, status? } → Crea propiedad con slug
GET    /api/v1/properties/[id]        → Datos completos de la propiedad
PUT    /api/v1/properties/[id]        → Campos actualizables de la propiedad
DELETE /api/v1/properties/[id]        → Elimina propiedad y sus archivos
POST   /api/v1/properties/[id]/files  → FormData con archivo → Sube a Storage
DELETE /api/v1/files/[id]             → Elimina archivo de Storage y registro en BD
POST   /api/v1/properties/[id]/links  → { url, source_type } → Crea registro file tipo link
```

### Reglas de negocio
- El `public_slug` debe ser único globalmente. Formato: `titulo-de-la-propiedad-ABC123`.
- Al subir un PDF, contar páginas server-side antes de aceptar. Si supera 10 páginas, rechazar.
- El límite de almacenamiento se calcula como suma de `size_bytes` de todos los files de esa propiedad.
- Solo el `owner_user_id` o un admin de la misma org puede modificar una propiedad.
- Al eliminar una propiedad: eliminar archivos en Storage → registros en files → la propiedad.
- Las URLs de archivos en Storage son privadas (pre-signed URLs con expiración de 1 hora).

### Criterios de aceptación
1. Broker crea propiedad "Depto Polanco". Aparece en el dashboard con status "activa".
2. Broker sube 5 imágenes simultáneamente. Todas aparecen con preview y barra de progreso individual.
3. Broker intenta subir un PDF de 12 páginas. Sistema muestra "El PDF no puede exceder 10 páginas".
4. Broker intenta subir imagen de 15MB. Sistema muestra "La imagen no puede exceder 10MB".
5. Barra de almacenamiento muestra el porcentaje de uso actual vs límite del plan.
6. Broker elimina un archivo. Desaparece del UI y no existe en Supabase Storage.
7. Slug generado es único: crear dos propiedades con el mismo título produce slugs diferentes.

---

## FASE 4: MOTOR DE IA — EXTRACCIÓN DE DATOS
**Duración: 5–7 días | Depende de: Fase 3 | APIs: Claude API + Firecrawl + Inngest**

### Objetivo
Implementar el pipeline de extracción automática de datos de propiedades. El sistema procesa imágenes, PDFs y links para extraer campos estructurados y los presenta al broker para revisión y confirmación.

### Qué incluye
- Inngest configurado: instalar cliente, definir función de extracción, configurar webhook en `/api/inngest`.
- Job de Inngest `extract-property-data`: se dispara cuando el broker hace click en "Extraer datos con IA".
- Pipeline de extracción:
  1. Para cada archivo tipo image/pdf: enviar a Claude API con prompt de extracción.
  2. Para cada archivo tipo link: enviar URL a Firecrawl, recibir markdown, enviar a Claude para estructurar.
  3. Consolidar todos los resultados en un único JSON estructurado.
- Pantalla de revisión de datos extraídos: formulario con todos los campos extraídos. Cada campo editable. Indicador visual de confianza (alto/medio/bajo). Botón "Confirmar y guardar datos".
- Estado de procesamiento visible: "Analizando archivos... (2/5 completados)". Actualización en tiempo real via Supabase Realtime o polling cada 3s.
- Guardar `extracted_text` en `files.extracted_text` para cada archivo procesado.
- Actualizar `properties.data_extracted = true` y `properties.data_confirmed = true` después de confirmación.

### Qué NO incluye
- Generación de fichas técnicas en PDF (Fase 5).
- Procesamiento de archivos de Desarrollos (Fase 9).

### Endpoints
```
POST /api/v1/properties/[id]/extract   → Dispara job de Inngest. Responde { jobId }
GET  /api/v1/properties/[id]/extracted → Estado actual de extracción + datos extraídos
PUT  /api/v1/properties/[id]/confirm   → { fields } → Guarda datos confirmados
POST /api/inngest                      → Webhook de Inngest (validado por firma)
```

### Prompt de extracción Claude (template)
```
Analiza el siguiente contenido de una propiedad inmobiliaria y extrae los datos en formato JSON.
Devuelve ÚNICAMENTE el JSON, sin texto adicional, con esta estructura exacta:
{
  "type": string|null,
  "price": number|null,
  "currency": "MXN"|"USD"|"EUR"|null,
  "area_m2": number|null,
  "bedrooms": number|null,
  "bathrooms": number|null,
  "parking": number|null,
  "address": string|null,
  "country": string|null,
  "city": string|null,
  "description": string|null,
  "features": string[]
}
Si un campo no está disponible, usa null. No inventes datos.
```

### Reglas de negocio
- Si múltiples archivos dan valores distintos para el mismo campo (ej: precio diferente), mostrar el conflicto y pedir al broker que elija.
- La extracción es siempre disparada manualmente por el broker. No hay extracción automática al subir archivos.
- Si Firecrawl falla al procesar un link, marcar ese archivo como `processed=false` y continuar con los demás. Notificar al broker.
- El job tiene timeout máximo de 120 segundos. Si supera, marcar `status=error` y notificar.
- Claude API: usar modelo `claude-sonnet-4` para extracción. Loggear `tokens_used`.

### Criterios de aceptación
1. Broker sube PDF con datos de propiedad y hace click en "Extraer datos". En menos de 60s aparece el formulario con datos pre-llenados.
2. Los datos extraídos son correctos en al menos 80% de los campos para un PDF de portal estándar.
3. Broker agrega link de Lamudi. El sistema extrae precio y m² correctamente.
4. Si un link falla, el sistema continúa con los demás archivos y muestra aviso del fallo.
5. Broker puede editar cualquier campo en el formulario de revisión antes de confirmar.
6. Después de confirmar, `properties.data_confirmed = true` en la BD.
7. El indicador de progreso se actualiza en tiempo real sin recargar la página.

---

## FASE 5: GENERACIÓN DE FICHAS TÉCNICAS Y PDF
**Duración: 5–7 días | Depende de: Fase 4 | APIs: Claude API + PDFme + Inngest**

### Objetivo
Implementar el flujo completo de generación de fichas técnicas en PDF. El broker escribe un prompt, el sistema genera el contenido con Claude API y lo renderiza como PDF profesional con PDFme. Incluye historial de versiones y capacidad de iterar mediante retroalimentación.

### Qué incluye
- Página `/dashboard/properties/[id]/sheets/new`: formulario de prompt con textarea guiada, selector de idioma (ES/EN), preview del branding a aplicar.
- Validación pre-generación: verificar que la propiedad tiene `data_confirmed=true`.
- Job de Inngest `generate-sheet`: recibe propertyId, userId, prompt. Ejecuta pipeline completo.
- Pipeline de generación:
  1. Cargar todos los datos de la propiedad + `extracted_text` de sus archivos.
  2. Construir prompt enriquecido para Claude con todos los datos + instrucciones de estructura.
  3. Llamar a Claude API, recibir contenido estructurado de la ficha.
  4. Seleccionar imágenes destacadas del repositorio (hasta 6).
  5. Renderizar PDF con PDFme usando plantilla base de Folio.
  6. Subir PDF a Supabase Storage.
  7. Actualizar registro sheet con `pdf_url` y `status=ready`.
- Plantilla PDFme: portada con imagen hero + título + precio. Segunda página: descripción + características + datos técnicos en grid. Tercera página (opcional): imágenes adicionales + datos de contacto + branding.
- Historial de fichas en tab "Fichas" de la propiedad: lista de versiones con fecha, prompt usado, status.
- Flujo de iteración: botón "Solicitar ajuste" abre textarea para feedback. Dispara nuevo job con contexto de la versión anterior.
- Versiones: cada generación crea un nuevo registro sheet con `version++`. Las versiones anteriores se conservan.
- El broker puede marcar cualquier versión como "activa" — esta es la que aparece en el MiniSite.

### Qué NO incluye
- Pago por generación en plan Por Uso (Fase 7, pero el código debe estar preparado con un hook de validación).
- Datos del Desarrollo en la ficha (Fase 9).
- Múltiples plantillas de PDF (V2).

### Endpoints
```
POST /api/v1/properties/[id]/sheets         → { prompt, language } → Crea sheet, encola job
GET  /api/v1/properties/[id]/sheets         → Lista de sheets de la propiedad
GET  /api/v1/sheets/[sheetId]               → Estado y datos de un sheet específico
POST /api/v1/sheets/[sheetId]/feedback      → { feedback } → Encola job de iteración
PUT  /api/v1/sheets/[sheetId]/activate      → Marca sheet como activo en la propiedad
GET  /api/v1/sheets/[sheetId]/download      → Redirect a URL pre-firmada del PDF
```

### Prompt de generación Claude (estructura)
```
Eres un experto en marketing inmobiliario. Genera el contenido completo de una ficha técnica profesional.

DATOS DE LA PROPIEDAD: [JSON completo de la propiedad]
INSTRUCCIONES DEL BROKER: [prompt del broker]
IDIOMA: [ES o EN]

Devuelve ÚNICAMENTE un JSON con:
{
  headline: string,
  price_display: string,
  description_short: string (max 150 chars),
  description_full: string (max 400 chars),
  highlights: string[] (max 6 items),
  cta_text: string,
  contact_note: string
}
```

### Reglas de negocio
- Si `properties.data_confirmed=false`, rechazar la generación con error 400 y mensaje claro.
- El job de generación tiene timeout de 180 segundos. Si supera, `status=error`.
- Las imágenes del PDF se seleccionan automáticamente: hasta 6 imágenes del repositorio.
- El feedback de iteración siempre genera una nueva versión, nunca sobreescribe la anterior.
- Claude API: usar `claude-opus-4` para generación (máxima calidad). Loggear `tokens_used`.
- El PDF se nombra: `folio-{property_slug}-v{version}.pdf`.

### Criterios de aceptación
1. Broker escribe prompt "Ficha ejecutiva para inversionista, tono formal, en español" y hace click en generar. En menos de 60s aparece la vista previa del PDF.
2. El PDF tiene al menos 2 páginas. Contiene: precio, superficie, descripción, al menos 3 características y datos de contacto del broker.
3. Si el broker tiene logo y color de marca configurados, aparecen en el PDF.
4. Broker solicita ajuste "Cambia el precio a $3.5M y agrega que tiene roof garden". Se genera v2 con los cambios. v1 sigue disponible en historial.
5. Broker marca v2 como activa. `properties.active_sheet_id` apunta a v2.
6. El botón de descarga genera una URL pre-firmada válida que descarga el PDF.
7. Si la propiedad no tiene `data_confirmed=true`, el sistema muestra mensaje de error claro.

---

## FASE 6: MINISITE PÚBLICO DE PROPIEDAD
**Duración: 3–4 días | Depende de: Fase 5**

### Objetivo
Implementar la página web pública de cada propiedad, accesible sin autenticación mediante URL única. El MiniSite es el canal de distribución principal del broker y contiene el growth loop viral (badge "Creado con Folio").

### Qué incluye
- Ruta `/p/[slug]`: página SSR (Server-Side Rendering) de Next.js sin autenticación.
- Layout del MiniSite: galería de imágenes (carousel/swiper), sección de datos clave (precio, m², recámaras), descripción completa, sección de características, ficha técnica descargable, datos de contacto del broker.
- Botón de WhatsApp flotante: `wa.me/{phone}?text=Hola, me interesa la propiedad {title}`. Solo si el broker tiene teléfono configurado.
- Botón de email de contacto si no hay WhatsApp.
- Badge "Creado con Folio" en el footer del MiniSite con link a folio.app.
- Página 404 personalizada si el slug no existe.
- Meta tags SEO: og:title, og:description, og:image (primera foto), canonical URL.
- El MiniSite refleja siempre la ficha marcada como activa.
- Opción en dashboard para copiar el link del MiniSite y compartir por WhatsApp con un click.

### Qué NO incluye
- Autenticación ni áreas privadas en el MiniSite.
- Formulario de contacto (V2) — en V1 solo botones de WhatsApp/email.
- Analytics del MiniSite (V2).
- Opción de remover el badge Folio.

### Endpoints
```
GET /p/[slug]                           → Página SSR pública del MiniSite
GET /api/v1/public/properties/[slug]    → JSON con datos públicos de la propiedad
```

### Reglas de negocio
- El MiniSite solo muestra campos que el broker haya confirmado (`data_confirmed=true`).
- Las imágenes se sirven con URLs públicas (no pre-firmadas) para el MiniSite. Configurar bucket policy como público para las imágenes de propiedades.
- El badge "Creado con Folio" es obligatorio en V1 para todos los planes.
- El link de WhatsApp debe incluir el nombre de la propiedad en el mensaje pre-llenado.
- Si la propiedad tiene `status=sold` o `status=paused`, mostrar banner informativo pero mantener el MiniSite accesible.

### Criterios de aceptación
1. Abrir `/p/mi-depto-polanco-ABC123` sin sesión activa muestra el MiniSite correctamente.
2. El MiniSite carga en menos de 2 segundos en conexión 4G (Lighthouse Performance > 80).
3. El botón de WhatsApp abre WhatsApp con mensaje pre-llenado con el nombre de la propiedad.
4. El badge "Creado con Folio" es visible y el link lleva a folio.app.
5. Si se accede a `/p/slug-inexistente`, aparece página 404 con branding Folio.
6. Los meta tags OG están correctamente configurados.
7. Broker actualiza la ficha activa en el dashboard. El MiniSite refleja el cambio al recargar.

---

## FASE 7: PLANES, SUSCRIPCIONES Y PAGOS
**Duración: 4–5 días | Depende de: Fase 1 | APIs: Stripe**

### Objetivo
Integrar Stripe para gestionar los cuatro planes de Folio. Implementar cobro por evento (plan Por Uso), suscripciones mensuales y anuales, y webhooks para activación/desactivación de planes en tiempo real.

### Qué incluye
- Stripe configurado: productos y precios creados en Stripe Dashboard para los 4 planes.
- Página `/pricing` (pública): muestra los 4 planes con features y CTAs.
- Página `/dashboard/settings/billing`: plan actual, fecha de próximo cobro, botón "Gestionar suscripción".
- Flujo de upgrade: broker selecciona plan → Stripe Checkout → webhook confirma → acceso activado.
- Plan Por Uso: interceptor en el job de generación que verifica plan. Si es `per_use`, crear PaymentIntent de $99 MXN antes de ejecutar.
- Stripe webhooks en `/api/webhooks/stripe`:
  - `customer.subscription.created`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `invoice.payment_failed`
- Cada webhook actualiza `users.plan`, `users.plan_active`, `users.plan_expires_at` y crea registro en `transactions`.
- Guard de plan en todos los endpoints relevantes.

### Precios en Stripe (MXN)
- **per_use:** PaymentIntent único de $99.00 MXN por ficha.
- **monthly:** Price recurrente $699.00 MXN/mes.
- **annual:** Price recurrente $5,988.00 MXN/año.
- **agency:** Price recurrente $1,899.00 MXN/mes.

### Endpoints
```
POST /api/v1/billing/checkout   → { plan } → Crea Stripe Checkout Session, devuelve URL
GET  /api/v1/billing/portal     → Crea Stripe Customer Portal Session, devuelve URL
GET  /api/v1/billing/status     → Plan actual, estado, fecha de expiración
POST /api/webhooks/stripe       → Webhook de Stripe (validado con stripe-signature)
```

### Reglas de negocio
- La validación del plan se hace siempre server-side. El frontend solo muestra el plan actual.
- Si `plan_active=false`, el broker puede ver sus propiedades y fichas existentes pero NO puede generar nuevas fichas.
- El webhook debe procesarse en menos de 3 segundos (Stripe espera respuesta 200 rápida). Responder 200 incluso si hay error interno, loggear el error.
- Crear `stripe_customer_id` en el primer Checkout y guardarlo en `users`. No crear customers duplicados.
- El plan Por Uso es el default para todos los usuarios nuevos.
- Las transacciones de suscripción se crean en el webhook `invoice.payment_succeeded`, no en el checkout.

### Criterios de aceptación
1. Broker en plan `per_use` genera una ficha. Sistema muestra modal de confirmación de $99 MXN. Al pagar, genera la ficha.
2. Broker hace upgrade a plan mensual. Después del Checkout exitoso, su plan muestra "Mensual Pro".
3. Simular webhook `customer.subscription.deleted`. El plan del usuario cambia a `per_use` inmediatamente.
4. Broker con `plan_active=false` ve botón "Generar ficha" deshabilitado con mensaje de plan.
5. Botón "Gestionar suscripción" abre el Stripe Customer Portal correctamente.
6. Verificar en tabla `transactions` que se creó registro por cada pago exitoso.

---

## FASE 8: PLAN AGENCIA Y MULTI-USUARIO
**Duración: 4–5 días | Depende de: Fases 2 y 7 | NO es MVP mínimo**

### Objetivo
Permitir que una organización de tipo agency tenga hasta 5 usuarios (1 admin + 4 agentes). El admin invita agentes por email, gestiona el acceso, y todas las fichas generadas por los agentes usan el branding corporativo de la organización.

### Qué incluye
- Página `/dashboard/settings/team`: lista de miembros, botón "Invitar agente" (hasta 4).
- Flujo de invitación: admin ingresa email → sistema envía email con link de invitación (Resend) → invitado se registra o inicia sesión → queda vinculado a la organización con `role=agent`.
- Tabla `invitations`: { id, org_id, email, token, expires_at, accepted_at }.
- El agente ve solo sus propias propiedades. El admin ve todas las propiedades de la organización.
- Las fichas generadas por cualquier agente usan el branding de la organización.
- Admin puede desactivar (no eliminar) a un agente: `users.active=false`.

### Criterios de aceptación
1. Admin invita a agente@email.com. El agente recibe email con link de invitación válido por 48 horas.
2. Agente acepta invitación. Aparece en la lista del equipo con `role=agent`.
3. Agente genera una ficha. El PDF incluye el logo y color de la organización.
4. Si se intenta invitar al agente 5, el botón de invitar se deshabilita con mensaje.
5. Admin desactiva a un agente. El agente no puede iniciar sesión.

---

## FASE 9: MÓDULO DE DESARROLLOS
**Duración: 3–4 días | Depende de: Fase 4 | NO es MVP mínimo**

### Objetivo
Implementar la entidad Desarrollo que agrupa múltiples propiedades de un mismo proyecto inmobiliario. La información del desarrollo se procesa una vez y se incluye automáticamente en las fichas de todas las propiedades vinculadas.

### Qué incluye
- CRUD completo de Desarrollos en `/dashboard/developments`.
- Upload de archivos del desarrollo (mismo sistema que propiedades, mismo pipeline de extracción IA).
- Vinculación de propiedad a desarrollo: dropdown en el formulario de propiedad.
- Al generar ficha, el pipeline incluye automáticamente los datos y archivos del desarrollo vinculado.

### Criterios de aceptación
1. Broker crea desarrollo "Torres Ámsterdam" con descripción, 3 fotos y link al website del proyecto.
2. Broker crea propiedad "Depto 302" y la vincula a "Torres Ámsterdam".
3. Al generar ficha para "Depto 302", el PDF incluye sección de amenidades del desarrollo.
4. Broker crea segunda propiedad "Depto 405" y la vincula al mismo desarrollo. El proceso es más rápido porque los archivos del desarrollo ya están procesados.

---

## FASE 10: PULIMIENTO, EMAILS Y LAUNCH
**Duración: 4–5 días | Depende de: Fases 1–7 | SÍ es MVP**

### Objetivo
Completar todos los detalles necesarios para el lanzamiento público: emails transaccionales, onboarding del nuevo usuario, landing page pública, SEO básico, manejo de errores visible al usuario y monitoreo mínimo.

### Qué incluye
- Resend + React Email: templates para bienvenida, ficha lista, confirmación de pago, recuperación de contraseña.
- Flujo de onboarding para nuevo usuario: wizard de 3 pasos (perfil → primera propiedad → branding opcional).
- Landing page pública en `/`: hero section, cómo funciona (3 pasos), planes, testimoniales (placeholder), CTA de registro. Diseño con paleta Folio.
- Manejo de errores global: boundary de errores en React, páginas de error 404 y 500 con branding Folio.
- Loading states en todas las operaciones asíncronas.
- Toast notifications para acciones exitosas y errores.
- Connection pooling con PgBouncer de Supabase configurado.
- Verificación final de RLS: prueba de que un usuario no puede acceder a datos de otra organización.
- Favicon, og:image global, robots.txt, sitemap.xml básico.

### Criterios de aceptación
1. Usuario nuevo completa el onboarding y tiene su primera propiedad creada en menos de 5 minutos.
2. Email de "tu ficha está lista" llega en menos de 2 minutos después de completar la generación.
3. Landing page carga en menos de 2 segundos. Lighthouse Performance > 85.
4. Prueba de seguridad: usuario A no puede acceder a `/api/v1/properties/[id_de_usuario_B]`. Responde 404.
5. Todos los flujos principales funcionan sin errores en dispositivo móvil (iOS Safari + Android Chrome).

---

## Resumen de Riesgos Críticos

| Fase | Riesgo Principal | Mitigación |
|------|-----------------|-----------|
| 4 — Extracción IA | Calidad de extracción insuficiente | Pantalla de revisión obligatoria. La IA propone, el broker confirma. |
| 4 — Extracción IA | Firecrawl bloqueado por portales | Fallback: si el link falla, mostrar error específico y continuar. |
| 5 — Generación PDF | PDF no se ve suficientemente profesional | Invertir en la plantilla PDFme antes de lanzar. Probar con brokers reales. |
| 5 — Generación PDF | Timeout de Vercel Function (10s) | El pipeline SIEMPRE va por Inngest. Ningún API route espera la IA. |
| 7 — Pagos | Webhook de Stripe no procesado correctamente | Responder 200 inmediatamente. Procesar en async. Implementar idempotency keys. |
| Global | PgBouncer no configurado | Configurar connection pooling ANTES del primer deploy a producción. |
| Global | Costo de Claude API mayor al estimado | Loggear tokens_used en cada operación. Alertar si costo diario supera umbral. |
