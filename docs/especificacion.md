# FOLIO — Documento 1: Especificación General del Sistema
*Versión 1.0 — Abril 2026*

---

## 1. Visión del Sistema

### 1.1 Objetivo del Producto

Folio es una plataforma web SaaS diseñada para brokers inmobiliarios independientes y agencias pequeñas/medianas. Su propósito central es eliminar la fricción en la creación de material de presentación de propiedades, particularmente fichas técnicas en formato PDF, mediante el uso de inteligencia artificial.

El broker sube los documentos, imágenes y links que ya tiene de cada propiedad. Folio extrae la información relevante automáticamente, la organiza en una base de datos estructurada, y genera fichas técnicas profesionales y visualmente atractivas bajo demanda mediante un prompt de texto libre.

### 1.2 Problema que Resuelve

Los brokers inmobiliarios independientes carecen de herramientas accesibles para crear material de presentación profesional. Las opciones actuales presentan tres problemas:

- **Captura manual de datos:** los brokers deben llenar formularios extensos con información que ya tienen en otros formatos (PDFs, portales, imágenes).
- **Costo elevado:** contratar diseñadores para fichas técnicas cuesta entre $800 y $2,000 MXN por propiedad, con tiempos de entrega de días.
- **Falta de centralización:** la información de las propiedades vive dispersa en WhatsApp, emails, Excel, portales y documentos físicos sin un repositorio unificado.

Folio resuelve los tres problemas simultáneamente: captura pasiva de datos por IA, generación automática de fichas en minutos, y repositorio centralizado por propiedad.

### 1.3 Usuarios Objetivo

#### Usuario Primario — Broker Independiente
- Broker inmobiliario sin estructura corporativa detrás.
- Maneja entre 3 y 30 propiedades activas simultáneamente.
- Opera principalmente en México, con propiedades que pueden estar en cualquier país.
- Necesita material de presentación profesional pero no tiene presupuesto ni personal dedicado.
- Usa WhatsApp como canal principal de comunicación con clientes.

#### Usuario Secundario — Agencia Pequeña/Mediana
- Agencia con 2 a 5 agentes activos.
- Necesita identidad visual unificada en todas las fichas generadas por sus agentes.
- El administrador gestiona accesos y supervisa la actividad del equipo.
- NO aplica: franquicias grandes (RE/MAX, Century 21) con departamentos dedicados de marketing.

### 1.4 Casos de Uso Principales

1. Broker registra una propiedad subiendo archivos (imágenes, PDFs) y/o links a portales inmobiliarios. El sistema extrae los datos automáticamente y genera una ficha de datos validada por el broker.
2. Broker genera una ficha técnica en PDF escribiendo un prompt de texto libre que define tono, énfasis y audiencia. Recibe el PDF en menos de 60 segundos.
3. Broker solicita ajustes a una ficha generada mediante retroalimentación en texto libre. El sistema genera una nueva versión guardando el historial completo.
4. Broker comparte el MiniSite público de una propiedad por WhatsApp. El prospecto accede a galería de fotos, datos clave y botón de contacto directo.
5. Administrador de agencia invita a sus agentes, configura el branding corporativo y supervisa las fichas generadas por el equipo.
6. Broker vincula múltiples propiedades a un mismo Desarrollo, cargando la información del proyecto una sola vez y compartiéndola entre todas las unidades.

---

## 2. Arquitectura del Sistema

### 2.1 Tipo de Arquitectura

V1 implementa una arquitectura **monolítica modular (Modular Monolith)** desplegada en Vercel. Esta decisión prioriza velocidad de desarrollo sobre separación de servicios. Los módulos están claramente delimitados internamente pero comparten un único repositorio y runtime.

La excepción es el motor de generación de fichas, que opera de forma asíncrona mediante **Inngest** como sistema de colas. Esto lo desacopla del ciclo de request/response del servidor sin requerir una arquitectura de microservicios completa.

> **Nota V2:** Si el volumen lo justifica, el motor de IA (extracción + generación) puede migrarse a un servicio FastAPI independiente sin cambios en el frontend o la base de datos.

### 2.2 Capas del Sistema

#### Capa 1: Cliente (Browser)
Aplicación Next.js 14 con App Router. Cubre dos contextos:
- **Dashboard autenticado** del broker (rutas protegidas bajo `/dashboard`)
- **MiniSite público** de propiedades (bajo `/p/[slug]`), accesible sin autenticación.

#### Capa 2: API (Next.js API Routes)
Endpoints REST organizados bajo `/api/v1/`. Manejan autenticación, CRUD de entidades, webhooks de Stripe e Inngest, y disparo de trabajos de IA. En V1 corren en el mismo proceso que el frontend dentro de Vercel Functions.

#### Capa 3: Servicios Externos
- **Supabase:** PostgreSQL + Storage + Auth
- **Claude API (Anthropic):** extracción de datos e imágenes, generación de contenido
- **Firecrawl:** extracción de contenido web desde links de portales
- **Inngest:** cola de trabajos asíncronos
- **PDFme:** renderizado de PDF a partir de plantillas
- **Stripe:** procesamiento de pagos y suscripciones
- **Resend + React Email:** emails transaccionales

#### Capa 4: Almacenamiento
Supabase Storage con buckets organizados:
- `/properties/{org_id}/{property_id}/` — archivos de propiedades
- `/developments/{org_id}/{development_id}/` — archivos de desarrollos
- `/sheets/{org_id}/{property_id}/` — PDFs generados

RLS de Supabase garantiza que cada organización solo accede a sus propios archivos.

### 2.3 Flujo de Datos — Generación de Ficha Técnica

Este es el flujo más crítico del sistema:

1. El broker hace click en "Generar ficha técnica" desde la vista de una propiedad.
2. El frontend envía `POST /api/v1/sheets` con el prompt del broker y el ID de la propiedad.
3. La API valida el plan del usuario. Si es plan Por Uso, procesa el pago via Stripe antes de continuar.
4. La API crea un registro FICHA en estado `processing` y encola un trabajo en Inngest.
5. La API responde al frontend con el ID de la ficha. El frontend entra en modo polling (cada 3 segundos) o recibe actualización via Supabase Realtime.
6. Inngest ejecuta el job: (a) recupera todos los ARCHIVOs de la propiedad y del DESARROLLO vinculado, (b) invoca a Firecrawl para los links pendientes, (c) construye el prompt completo, (d) llama a Claude API con todos los datos, (e) recibe el contenido estructurado, (f) renderiza el PDF con PDFme, (g) sube el PDF a Supabase Storage.
7. Inngest actualiza el registro FICHA a estado `ready` con la URL del PDF.
8. El frontend detecta el cambio de estado y muestra la ficha al broker.
9. Resend envía email de notificación al broker con link directo a la ficha.

---

## 3. Módulos del Sistema

### Módulo: Autenticación y Sesión
**Prioridad: CRÍTICA — Fase 1**

Gestiona el registro, login, recuperación de contraseña y sesión de usuarios. Soporta email/contraseña y Google OAuth. Diferencia entre usuarios tipo broker independiente y usuarios miembro de una organización (agencia).

- **Inputs:** Email + contraseña, token OAuth de Google, token de sesión en cookies
- **Outputs:** Sesión activa, JWT, perfil de usuario cargado en contexto
- **Dependencias:** Supabase Auth

### Módulo: Gestión de Organizaciones y Usuarios
**Prioridad: ALTA — Fase 2**

Permite crear y administrar organizaciones (agencias). Incluye invitación de agentes por email, gestión de roles (admin/agente), configuración de branding corporativo (logo, color primario) y panel de administración básico. Los brokers independientes también pertenecen a una organización de un solo miembro.

- **Inputs:** Datos de la organización, invitación por email, archivo de logo, color de marca
- **Outputs:** Organización creada/actualizada, email de invitación enviado, lista de miembros
- **Dependencias:** Módulo de Autenticación, Resend, Supabase Storage

### Módulo: Gestión de Desarrollos
**Prioridad: ALTA — Fase 9**

Permite crear y administrar Desarrollos (proyectos inmobiliarios) que agrupan múltiples propiedades. La información del desarrollo se sube una vez y se hereda por todas las propiedades vinculadas al generar fichas. La vinculación es opcional.

- **Inputs:** Nombre del desarrollo, descripción, archivos (imágenes, PDFs ≤10pp), links al website del proyecto
- **Outputs:** Desarrollo creado con datos estructurados, archivos procesados por IA, disponible para vinculación
- **Dependencias:** Módulo de Autenticación, Motor de IA (extracción), Repositorio de Archivos

### Módulo: Gestión de Propiedades
**Prioridad: CRÍTICA — Fase 3**

CRUD completo de propiedades inmobiliarias. Incluye la captura pasiva de datos mediante IA (extracción de archivos y links), el formulario de revisión/corrección de datos extraídos, la vinculación opcional a un Desarrollo, y la visualización en dashboard con filtros básicos.

- **Inputs:** Nombre interno, archivos (imágenes JPG/PNG/WEBP ≤10MB, PDFs ≤10pp/25MB), links, ID de desarrollo (opcional)
- **Outputs:** Propiedad creada con datos estructurados validados por el broker, repositorio de archivos cargado, minisite público activo
- **Dependencias:** Motor de IA (extracción), Repositorio de Archivos, Módulo de Desarrollos

### Módulo: Repositorio de Archivos
**Prioridad: CRÍTICA — Fase 3**

Gestiona el almacenamiento, organización y limitaciones de archivos por propiedad y por desarrollo. Aplica restricciones de tipo, tamaño y página. Proporciona acceso controlado a los archivos para el motor de IA.

- **Inputs:** Archivo binario (imagen/PDF) o URL externa. Tipo de recurso (propiedad o desarrollo).
- **Outputs:** URL de almacenamiento en Supabase, metadatos del archivo, texto extraído (para PDFs), estado de procesamiento
- **Dependencias:** Supabase Storage, Módulo de Autenticación (RLS)

### Módulo: Motor de IA — Extracción y Generación
**Prioridad: CRÍTICA — Fase 4 y 5**

Núcleo del producto. Se divide en dos sub-procesos:

1. **Extracción:** procesa archivos e imágenes con Claude API y links con Firecrawl para construir el perfil estructurado de la propiedad.
2. **Generación:** recibe el perfil + el prompt del broker + el branding activo y produce el contenido de la ficha técnica, que luego se renderiza como PDF con PDFme. El procesamiento es asíncrono via Inngest.

- **Inputs:** Archivos de propiedad y desarrollo, links externos, prompt del broker, configuración de branding
- **Outputs:** Datos estructurados de la propiedad (extracción), PDF de ficha técnica (generación), URL pública del PDF
- **Dependencias:** Claude API, Firecrawl, Inngest, PDFme, Repositorio de Archivos, Supabase Storage

### Módulo: Fichas Técnicas e Historial
**Prioridad: CRÍTICA — Fase 5**

Gestiona el ciclo de vida completo de las fichas técnicas: creación, versionado, retroalimentación e iteración. Cada solicitud de ficha genera un registro independiente con su prompt, versión y estado. El broker puede ver el historial completo de versiones, descargar cualquier versión, y designar una versión como "activa" para el MiniSite.

### Módulo: MiniSite Público de Propiedad
**Prioridad: ALTA — Fase 6**

Página web pública de acceso libre generada automáticamente para cada propiedad. Incluye galería de imágenes, datos clave, la ficha técnica activa descargable, y botón de contacto directo con el broker (WhatsApp o email). Incluye badge "Creado con Folio" como mecanismo de growth viral. URL: `/p/[slug]`.

### Módulo: Planes, Suscripciones y Pagos
**Prioridad: ALTA — Fase 7**

Gestiona los cuatro planes de Folio mediante Stripe. Maneja cobros por evento (Plan Por Uso: $99 MXN/ficha), suscripciones mensuales ($699 MXN/mes), suscripciones anuales ($499 MXN/mes equiv.), y plan Agencia ($1,899 MXN/mes). Procesa webhooks de Stripe para activar/desactivar acceso en tiempo real.

---

## 4. Base de Datos

### 4.1 Motor y Configuración
PostgreSQL gestionado por Supabase. **Row Level Security (RLS) habilitado en todas las tablas.** Las políticas RLS garantizan que cada organización accede únicamente a sus propios datos sin lógica adicional en el backend.

### 4.2 Esquema de Tablas

#### organizations
| Campo | Tipo | Nulo | Default | Descripción |
|-------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| name | VARCHAR(200) | NO | — | Nombre de la organización o broker |
| type | ENUM('individual','agency') | NO | individual | Tipo de organización |
| logo_url | TEXT | SÍ | NULL | URL en Supabase Storage del logo |
| brand_color | VARCHAR(7) | SÍ | NULL | Color primario hex (#RRGGBB) |
| contact_email | VARCHAR(300) | NO | — | Email público de contacto |
| contact_phone | VARCHAR(30) | SÍ | NULL | Teléfono de contacto (WhatsApp) |
| website_url | TEXT | SÍ | NULL | Website de la organización |
| created_at | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

#### users
| Campo | Tipo | Nulo | Default | Descripción |
|-------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK — Sync con Supabase Auth |
| org_id | UUID | NO | — | FK → organizations.id |
| name | VARCHAR(200) | NO | — | Nombre completo |
| email | VARCHAR(300) | NO | — | Email único, sync con Auth |
| role | ENUM('admin','agent') | NO | admin | Rol dentro de la organización |
| avatar_url | TEXT | SÍ | NULL | URL de foto de perfil |
| plan | ENUM('per_use','monthly','annual','agency') | NO | per_use | Plan activo |
| stripe_customer_id | VARCHAR(100) | SÍ | NULL | ID de customer en Stripe |
| stripe_subscription_id | VARCHAR(100) | SÍ | NULL | ID de suscripción en Stripe |
| plan_active | BOOLEAN | NO | TRUE | Acceso habilitado |
| plan_expires_at | TIMESTAMPTZ | SÍ | NULL | Expiración del plan activo |
| active | BOOLEAN | NO | TRUE | Usuario activo en la org |
| created_at | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

#### developments
| Campo | Tipo | Nulo | Default | Descripción |
|-------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| owner_user_id | UUID | NO | — | FK → users.id (creador) |
| org_id | UUID | NO | — | FK → organizations.id |
| name | VARCHAR(300) | NO | — | Nombre del desarrollo |
| description_ai | TEXT | SÍ | NULL | Descripción extraída por IA |
| address | TEXT | SÍ | NULL | Dirección del proyecto |
| country | VARCHAR(100) | SÍ | NULL | País |
| city | VARCHAR(100) | SÍ | NULL | Ciudad |
| amenities | TEXT[] | SÍ | NULL | Array de amenidades extraídas |
| website_url | TEXT | SÍ | NULL | URL del sitio del desarrollo |
| extra_links | TEXT[] | SÍ | NULL | Links adicionales del proyecto |
| data_extracted | BOOLEAN | NO | FALSE | Si la IA ya procesó los archivos |
| created_at | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

#### properties
| Campo | Tipo | Nulo | Default | Descripción |
|-------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| owner_user_id | UUID | NO | — | FK → users.id |
| org_id | UUID | NO | — | FK → organizations.id |
| development_id | UUID | SÍ | NULL | FK → developments.id (opcional) |
| title | VARCHAR(300) | NO | — | Nombre interno de la propiedad |
| type | VARCHAR(100) | SÍ | NULL | Casa, depto, local, terreno, etc. |
| status | ENUM('active','paused','sold') | NO | active | Estado de la propiedad |
| price | NUMERIC(15,2) | SÍ | NULL | Precio de venta/renta |
| currency | VARCHAR(10) | SÍ | MXN | Moneda del precio |
| address | TEXT | SÍ | NULL | Dirección completa |
| country | VARCHAR(100) | SÍ | NULL | País de la propiedad |
| city | VARCHAR(100) | SÍ | NULL | Ciudad |
| area_m2 | NUMERIC(10,2) | SÍ | NULL | Superficie en m² |
| bedrooms | SMALLINT | SÍ | NULL | Número de recámaras |
| bathrooms | SMALLINT | SÍ | NULL | Número de baños |
| parking | SMALLINT | SÍ | NULL | Lugares de estacionamiento |
| description_ai | TEXT | SÍ | NULL | Descripción extraída por IA |
| features_ai | TEXT[] | SÍ | NULL | Características extraídas por IA |
| portal_url | TEXT | SÍ | NULL | Link al portal inmobiliario |
| public_slug | VARCHAR(200) | NO | — | Slug único para MiniSite |
| active_sheet_id | UUID | SÍ | NULL | FK → sheets.id (ficha activa) |
| data_extracted | BOOLEAN | NO | FALSE | Si la IA ya procesó archivos |
| data_confirmed | BOOLEAN | NO | FALSE | Si el broker confirmó los datos |
| created_at | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

#### files
| Campo | Tipo | Nulo | Default | Descripción |
|-------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| property_id | UUID | SÍ | NULL | FK → properties.id (mutex con development_id) |
| development_id | UUID | SÍ | NULL | FK → developments.id (mutex con property_id) |
| org_id | UUID | NO | — | FK → organizations.id (para RLS) |
| file_type | ENUM('image','pdf','link') | NO | — | Tipo de archivo |
| original_name | VARCHAR(300) | SÍ | NULL | Nombre original del archivo |
| storage_url | TEXT | SÍ | NULL | URL en Supabase Storage (null si es link) |
| external_url | TEXT | SÍ | NULL | URL externa (null si es archivo) |
| size_bytes | INTEGER | SÍ | NULL | Tamaño en bytes |
| page_count | SMALLINT | SÍ | NULL | Páginas (solo PDFs) |
| source_type | ENUM('upload','portal_link','project_link') | NO | — | Origen del archivo |
| extracted_text | TEXT | SÍ | NULL | Texto extraído por IA o Firecrawl |
| processed | BOOLEAN | NO | FALSE | Si fue procesado por la IA |
| created_at | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

> **RESTRICCIÓN CRÍTICA:** `property_id` y `development_id` son mutuamente excluyentes. Exactamente uno debe ser NOT NULL. Implementar con CHECK constraint.

#### sheets
| Campo | Tipo | Nulo | Default | Descripción |
|-------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| property_id | UUID | NO | — | FK → properties.id |
| generated_by | UUID | NO | — | FK → users.id |
| org_id | UUID | NO | — | FK → organizations.id |
| prompt_original | TEXT | NO | — | Prompt escrito por el broker |
| prompt_refined | TEXT | SÍ | NULL | Prompt enriquecido enviado a Claude |
| feedback | TEXT | SÍ | NULL | Retroalimentación del broker |
| pdf_url | TEXT | SÍ | NULL | URL del PDF en Supabase Storage |
| public_url | TEXT | SÍ | NULL | URL pública del PDF |
| version | SMALLINT | NO | 1 | Número de versión (1, 2, 3…) |
| status | ENUM('queued','processing','ready','error') | NO | queued | Estado de generación |
| ai_model | VARCHAR(100) | SÍ | NULL | Modelo de Claude usado |
| tokens_used | INTEGER | SÍ | NULL | Tokens consumidos en generación |
| inngest_job_id | VARCHAR(200) | SÍ | NULL | ID del job en Inngest |
| error_message | TEXT | SÍ | NULL | Mensaje de error si status=error |
| created_at | TIMESTAMPTZ | NO | NOW() | Fecha de creación |

#### transactions
| Campo | Tipo | Nulo | Default | Descripción |
|-------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| user_id | UUID | NO | — | FK → users.id |
| org_id | UUID | NO | — | FK → organizations.id |
| sheet_id | UUID | SÍ | NULL | FK → sheets.id (null si es suscripción) |
| stripe_payment_id | VARCHAR(200) | SÍ | NULL | ID de PaymentIntent o Invoice en Stripe |
| type | ENUM('per_use','subscription_monthly','subscription_annual','agency_monthly','agency_annual') | NO | — | Tipo de transacción |
| amount_mxn | NUMERIC(10,2) | NO | — | Monto en MXN |
| currency_charged | VARCHAR(10) | NO | MXN | Moneda cobrada por Stripe |
| status | ENUM('pending','succeeded','failed','refunded') | NO | pending | Estado del cobro |
| created_at | TIMESTAMPTZ | NO | NOW() | Fecha de la transacción |

### 4.3 Índices Recomendados

```sql
CREATE INDEX ON properties(org_id, status);
CREATE UNIQUE INDEX ON properties(public_slug);
CREATE INDEX ON files(property_id);
CREATE INDEX ON files(development_id);
CREATE INDEX ON sheets(property_id, version DESC);
CREATE UNIQUE INDEX ON users(email);
CREATE INDEX ON users(org_id);
```

---

## 5. Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Frontend Framework | Next.js | 14 (App Router) | SSR para MiniSite público (SEO), un solo repo para dashboard y sitio público |
| Estilos | Tailwind CSS | 3.4+ | Implementación directa de tokens de diseño Folio |
| Componentes UI | shadcn/ui | Latest | Componentes accesibles, código propio, 100% personalizable |
| Base de Datos | PostgreSQL (Supabase) | 15+ | RLS nativo, Storage integrado, Auth integrado, Realtime |
| ORM | Prisma | 5+ | Tipado fuerte, migraciones automáticas |
| Autenticación | Supabase Auth | Latest | Google OAuth incluido, manejo de sesiones, integración nativa con RLS |
| Cola de Jobs | Inngest | Latest | Asincronía para generación de fichas, reintentos automáticos |
| Motor IA — Extracción | Claude API | claude-sonnet-4 | Visión multimodal nativa, español de alta calidad |
| Motor IA — Generación | Claude API | claude-opus-4 | Máxima calidad para generación de fichas |
| Web Scraping | Firecrawl | Latest | Maneja JavaScript, paginación y antibot de portales inmobiliarios |
| Generación de PDF | PDFme | Latest | Plantillas JSON para V1, renderizado server-side |
| Pagos | Stripe | Latest | Soporte nativo México, Customer Portal para autogestión |
| Email | Resend + React Email | Latest | API moderna para Next.js, plantillas en React |
| Hosting | Vercel | Latest | Zero config para Next.js, CDN global |
| Storage | Supabase Storage | Latest | Incluido en Supabase, RLS por bucket |
| Lenguaje | TypeScript | 5+ | Type safety en toda la aplicación |

---

## 6. UX/UI — Identidad Visual y Principios de Diseño

### 6.1 Identidad de Marca

- **Nombre:** Folio
- **Slogan EN:** "The ultimate broker kit"
- **Slogan ES:** "Cada propiedad, en su mejor versión."
- **Territorio visual:** Claro y profesional — fondos crema suave, verde bosque como primario, terracota como acento. Referentes: Notion, Linear, Idealista.

### 6.2 Paleta de Colores

| Token | Nombre | Hex | Uso |
|-------|--------|-----|-----|
| --color-primary-deep | Folio Deep | #1B3D2F | Navbar, texto principal, botones primarios, logo |
| --color-primary-mid | Folio Mid | #2D7D62 | Hover states, links activos, iconos |
| --color-primary-light | Folio Light | #4A9E82 | Bordes de énfasis, badges secundarios |
| --color-primary-tint | Folio Tint | #D4E8DF | Backgrounds de tags, alertas de éxito |
| --color-accent-deep | Terra Deep | #C4773B | CTAs secundarios, highlights, badges de plan |
| --color-accent-mid | Terra Mid | #E09558 | Hover del acento |
| --color-accent-tint | Terra Tint | #F5DEC8 | Fondos de cards, superficies cálidas |
| --color-canvas | Canvas | #F5F2EC | Background principal |
| --color-white | White | #FFFFFF | Cards, modales, superficies elevadas |
| --color-stone | Stone | #DDD9D0 | Bordes, divisores, inputs desactivados |
| --color-slate | Slate | #6B7E78 | Texto secundario, subtítulos, placeholders |

### 6.3 Tipografía

| Rol | Familia | Peso | Uso |
|-----|---------|------|-----|
| Display | DM Serif Display | 400 | Headlines de landing page y marketing |
| UI / Body | Inter o DM Sans | 400/500 | Toda la interfaz del dashboard |
| Label / Caps | Inter | 500 + uppercase | Tags, metadatos, indicadores de estado |
| Mono | JetBrains Mono | 400 | URLs, slugs, IDs técnicos |

### 6.4 Principios de Diseño

1. **Captura pasiva primero:** el broker nunca llena formularios desde cero. La IA propone, el broker confirma.
2. **Estado visible:** siempre se muestra en qué paso está el proceso. Sin spinners genéricos.
3. **Confianza mediante transparencia:** mostrar qué datos extrajo la IA y de qué fuente.
4. **Mobile-first en consulta, desktop-first en creación:** el broker crea fichas desde desktop pero comparte desde móvil.
5. **Cada acción tiene confirmación:** antes de generar (y cobrar), mostrar resumen de lo que se va a procesar.

---

## 7. Seguridad

### 7.1 Autenticación
- Supabase Auth maneja el ciclo completo: registro, login, recuperación, invalidación de sesión.
- Soporte para email/contraseña y Google OAuth desde V1.
- Sesiones mediante cookies HttpOnly con JWT firmado por Supabase. Expiración: 7 días con refresh automático.
- Rate limiting en endpoints de auth: máximo 5 intentos fallidos de login por IP en 15 minutos.

### 7.2 Autorización
- **RLS en PostgreSQL:** cada query está restringida automáticamente al `org_id` del usuario autenticado.
- **Roles:** admin puede gestionar usuarios y branding; agent solo puede gestionar sus propias propiedades y fichas.
- **Supabase Storage policies:** buckets con políticas de acceso que verifican `org_id`.
- **Middleware de Next.js:** valida sesión en cada request. Ningún endpoint de escritura es accesible sin sesión válida.

### 7.3 Manejo de Datos Sensibles
- Datos de pago: nunca almacenados en la BD de Folio. Solo `stripe_customer_id` y `stripe_subscription_id`.
- API keys: nunca en el código. Gestionadas en Vercel Environment Variables.
- Webhook de Stripe: validado con firma HMAC (`stripe-signature` header).
- Archivos subidos: pre-signed URLs con expiración de 1 hora. PDFs de fichas públicas tienen URLs permanentes.
- Datos del broker en MiniSite: solo se expone lo que el broker marcó explícitamente como público.

---

## 8. Riesgos de Implementación

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Calidad de extracción de IA insuficiente para PDFs complejos | Media | Alto | Pantalla de revisión obligatoria. El broker siempre confirma. |
| Firecrawl bloqueado por portales con antibot agresivo | Media | Medio | Fallback manual: si el link falla, el broker sube los datos como archivo. |
| Timeout en generación de PDF para propiedades con muchos archivos | Media | Medio | Inngest maneja timeout de hasta 300s. Si supera, dividir en jobs encadenados. |
| Costo de Claude API mayor al estimado | Baja | Alto | Límite de tokens por request. Loggear tokens_used en sheets. |
| Supabase Storage alcanza límite del plan gratuito | Media | Medio | Migrar a plan Pro antes de los primeros 20 usuarios activos. |

### Riesgos de Escalabilidad

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Vercel Functions con límite de 10 segundos | Alta | Alto | El pipeline de generación SIEMPRE va por Inngest. Ningún API route espera la IA. |
| Prisma agota conexiones de Supabase free tier (2 máx) | Alta | Medio | Configurar PgBouncer desde el primer deploy a producción. |
| Inngest free tier (50k runs/mes) se agota | Baja | Bajo | Plan paid ($50/mes, 5M runs) cuando supere 2,000 usuarios activos. |

---

## 9. Decisiones Abiertas

### Requeridas antes de iniciar desarrollo

1. **Dominio final:** folio.app vs getfolio.mx — impacta DNS, Stripe y Supabase desde día 1.
2. **Badge removible:** ¿el badge "Creado con Folio" es removible? ¿En qué plan? Impacta el growth loop viral.
3. **Política de retención:** ¿cuánto tiempo se conservan archivos y fichas de cuentas canceladas o propiedades vendidas?
4. **Plantillas de PDF:** ¿una sola plantilla para V1 o dos/tres estilos predefinidos?
5. **Idioma del PDF:** ¿el broker elige en el prompt o hay un selector explícito en la UI?
6. **Límite de propiedades activas en plan Por Uso:** ¿5 propiedades simultáneas? No formalmente confirmado.
7. **Trial gratuito:** ¿habrá período de prueba de N días para planes de suscripción?

### Recomendaciones

- Resolver dominio y trial antes de la Fase 1 para evitar reconfiguración posterior.
- Empezar con una sola plantilla de PDF en V1. Agregar estilos basados en feedback real.
- Implementar el badge como no-removible en V1. Es el mecanismo de growth más valioso.
