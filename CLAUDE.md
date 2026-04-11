# FOLIO — The Ultimate Broker Kit
## Instrucciones para Claude Code

---

## LEER PRIMERO

Este archivo es la fuente de verdad del proyecto. Antes de escribir cualquier línea de código, lee este archivo completo. Para detalles de cada fase, consulta los documentos en `/docs/`.

**Documentos de referencia:**
- `/docs/especificacion.md` — Arquitectura, módulos, base de datos, stack, UX, seguridad
- `/docs/fases.md` — 10 fases de desarrollo con criterios de aceptación
- `/docs/servicios.md` — Servicios externos, planes y orden de contratación

---

## QUÉ ES FOLIO

Plataforma web SaaS para brokers inmobiliarios independientes y agencias pequeñas. Permite subir documentos e imágenes de propiedades, extraer datos automáticamente con IA, y generar fichas técnicas profesionales en PDF mediante un prompt de texto libre.

**Problema que resuelve:** Los brokers pierden horas llenando formularios con datos que ya tienen en otros formatos, y pagan $800–$2,000 MXN por ficha a diseñadores. Folio lo hace en minutos y a una fracción del costo.

---

## STACK TECNOLÓGICO — NO CAMBIAR SIN CONSULTAR

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js | 14 (App Router) |
| Lenguaje | TypeScript | 5+ strict mode |
| Estilos | Tailwind CSS | 3.4+ |
| Componentes UI | shadcn/ui | Latest |
| Base de datos | PostgreSQL (Supabase) | 15+ |
| ORM | Prisma | 5+ |
| Auth | Supabase Auth | Latest |
| Cola de jobs | Inngest | Latest |
| IA — Extracción | Claude API (claude-sonnet-4) | Latest |
| IA — Generación | Claude API (claude-opus-4) | Latest |
| Web scraping | Firecrawl | Latest |
| Generación PDF | PDFme | Latest |
| Pagos | Stripe | Latest |
| Email | Resend + React Email | Latest |
| Hosting | Vercel | Latest |
| Storage | Supabase Storage | Latest |

---

## IDENTIDAD VISUAL — APLICAR EN TODOS LOS COMPONENTES

### Paleta de colores (definir en tailwind.config.ts)

```
--color-primary-deep:  #1B3D2F   → Navbar, texto principal, botones primarios, logo
--color-primary-mid:   #2D7D62   → Hover states, links activos, iconos
--color-primary-light: #4A9E82   → Bordes de énfasis, badges secundarios
--color-primary-tint:  #D4E8DF   → Backgrounds de tags, alertas de éxito
--color-accent-deep:   #C4773B   → CTAs secundarios, highlights, badges de plan
--color-accent-mid:    #E09558   → Hover del acento
--color-accent-tint:   #F5DEC8   → Fondos de cards, superficies cálidas
--color-canvas:        #F5F2EC   → Background principal (crema suave)
--color-white:         #FFFFFF   → Cards, modales, superficies elevadas
--color-stone:         #DDD9D0   → Bordes, divisores, inputs desactivados
--color-slate:         #6B7E78   → Texto secundario, placeholders
```

### Tipografía

- **Display:** DM Serif Display 400 → headlines de landing y marketing
- **UI / Body:** Inter o DM Sans 400/500 → toda la interfaz del dashboard
- **Label / Caps:** Inter 500 + uppercase → tags, estados, metadatos
- **Mono:** JetBrains Mono 400 → URLs, slugs, IDs técnicos

### Nombre y slogan

- **Nombre:** Folio
- **Slogan EN:** "The ultimate broker kit"
- **Slogan ES:** "Cada propiedad, en su mejor versión."

---

## ARQUITECTURA — REGLAS INAMOVIBLES

### Estructura de rutas

```
/                          → Landing page pública
/pricing                   → Página de planes (pública)
/login                     → Login
/register                  → Registro
/dashboard                 → Dashboard principal (protegido)
/dashboard/properties      → Lista de propiedades
/dashboard/properties/new  → Nueva propiedad
/dashboard/properties/[id] → Detalle de propiedad
/dashboard/settings/*      → Configuración (perfil, branding, billing, team)
/p/[slug]                  → MiniSite público de propiedad (sin auth)
/api/v1/*                  → Endpoints REST del backend
/api/webhooks/stripe       → Webhook de Stripe
/api/inngest               → Webhook de Inngest
```

### Reglas críticas de arquitectura

1. **NUNCA esperar IA en un API Route.** Todo pipeline de IA (extracción + generación) va por Inngest. Los API Routes solo despachan el job y responden inmediatamente con el jobId.
2. **RLS siempre activo.** Todas las tablas tienen Row Level Security. Ningún endpoint puede acceder a datos de otra organización, ni siquiera con un bug.
3. **Connection pooling desde día 1.** Configurar PgBouncer de Supabase antes del primer deploy a producción.
4. **Archivos con pre-signed URLs.** Los archivos privados usan URLs pre-firmadas con expiración de 1 hora. Las imágenes del MiniSite público usan URLs permanentes (bucket público).
5. **Stripe maneja TODO lo de pagos.** Nunca almacenar datos de tarjeta. Solo guardar stripe_customer_id y stripe_subscription_id.
6. **Validación siempre server-side.** El frontend muestra el estado del plan pero NO controla el acceso. Siempre validar plan_active en el servidor.

---

## BASE DE DATOS — TABLAS PRINCIPALES

7 tablas en PostgreSQL. Esquema completo en `/docs/especificacion.md` sección 4.

```
organizations   → Brokers individuales y agencias
users           → Usuarios (sync con Supabase Auth)
properties      → Propiedades inmobiliarias
developments    → Proyectos que agrupan propiedades (opcional)
files           → Archivos e imágenes por propiedad/desarrollo
sheets          → Fichas técnicas generadas (versionadas)
transactions    → Registro de pagos
```

**Restricción crítica en `files`:** `property_id` y `development_id` son mutuamente excluyentes. Exactamente uno debe ser NOT NULL. Implementar con CHECK constraint.

**Índices requeridos:**
```sql
properties(org_id, status)
properties(public_slug) UNIQUE
files(property_id)
files(development_id)
sheets(property_id, version DESC)
users(email) UNIQUE
users(org_id)
```

---

## PLANES Y PRECIOS

| Plan | Precio | Descripción |
|------|--------|-------------|
| Por Uso | $99 MXN / ficha | Sin suscripción. Pago por evento. |
| Mensual Pro | $699 MXN / mes | Fichas ilimitadas, 1 usuario |
| Anual Pro | $499 MXN / mes ($5,988/año) | Igual que mensual con descuento |
| Agencia | $1,899 MXN / mes | Hasta 5 usuarios, branding corporativo |

**Almacenamiento por plan:**
- Por Uso: 150MB por propiedad
- Mensual / Anual: 300MB por propiedad
- Agencia: 500MB por propiedad

---

## FASES DE DESARROLLO

Consultar `/docs/fases.md` para el detalle completo de cada fase. Resumen:

| Fase | Nombre | MVP | Duración Est. |
|------|--------|-----|---------------|
| 0 | Wizard of Oz Demo | SÍ | 2–3 días |
| 1 | Infraestructura Base + Auth | SÍ | 3–5 días |
| 2 | Organizaciones y Branding | SÍ | 3–4 días |
| 3 | Gestión de Propiedades y Archivos | SÍ | 5–7 días |
| 4 | Motor IA — Extracción | SÍ | 5–7 días |
| 5 | Generación de Fichas Técnicas PDF | SÍ | 5–7 días |
| 6 | MiniSite Público | SÍ | 3–4 días |
| 7 | Planes y Pagos | SÍ | 4–5 días |
| 8 | Plan Agencia y Multi-usuario | NO | 4–5 días |
| 9 | Módulo de Desarrollos | NO | 3–4 días |
| 10 | Pulimiento y Launch | SÍ | 4–5 días |

**MVP mínimo lanzable:** Fases 0–7 + Fase 10 → ~35–45 días de desarrollo enfocado.

**Secuencia obligatoria:** 0 → 1 → 3 → 4 → 5 → 6 → 7 → 10
**Paralelas posibles:** Fase 2 con Fase 3 (ambas después de Fase 1). Fases 8 y 9 entre sí (ambas después de Fase 7).

---

## CÓMO USAR ESTE PROYECTO CON CLAUDE CODE

### Para desarrollar una fase nueva

```
Desarrolla la Fase [N] — [Nombre] de Folio según las especificaciones en /docs/fases.md.
Stack: Next.js 14 + TypeScript + Tailwind + Supabase + Prisma.
Paleta de colores primaria: #1B3D2F. Canvas: #F5F2EC.
Genera todos los archivos necesarios según la estructura definida en la fase.
```

### Para continuar una fase en progreso

```
Continúa la Fase [N] de Folio. Ya están implementados [X e Y].
Falta implementar [Z] con las especificaciones de /docs/fases.md.
```

### Para verificar criterios de aceptación

```
Verifica los criterios de aceptación de la Fase [N] de Folio.
Muestra qué pruebas ejecutar y qué resultado esperado tiene cada una.
```

### Para corregir un bug

```
En Folio, [describe el bug]. El comportamiento esperado es [X].
El error ocurre en [archivo/componente]. Corrígelo respetando el stack y las reglas de arquitectura.
```

---

## VARIABLES DE ENTORNO REQUERIDAS

Crear `.env.local` (nunca commitear al repo):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                          # Con PgBouncer en producción

# Anthropic
ANTHROPIC_API_KEY=

# Firecrawl
FIRECRAWL_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=                   # https://folio.app en producción
```

---

## ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
folio-app/
├── CLAUDE.md                          ← Este archivo
├── docs/
│   ├── especificacion.md              ← Documento 1 completo
│   ├── fases.md                       ← Documento 2 completo
│   └── servicios.md                   ← Documento 3 completo
├── prisma/
│   ├── schema.prisma                  ← Esquema de las 7 tablas
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/                    ← login, register, forgot-password
│   │   ├── (public)/                  ← landing, pricing, /p/[slug]
│   │   ├── dashboard/                 ← rutas protegidas
│   │   └── api/
│   │       ├── v1/                    ← endpoints REST
│   │       ├── webhooks/stripe/
│   │       └── inngest/
│   ├── components/
│   │   ├── ui/                        ← shadcn/ui
│   │   ├── layout/                    ← Navbar, Sidebar
│   │   ├── properties/                ← PropertyCard, FileDropzone
│   │   ├── sheets/                    ← SheetPreview, PromptInput
│   │   └── minisite/                  ← componentes del MiniSite público
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              ← cliente browser
│   │   │   └── server.ts              ← cliente server
│   │   ├── prisma.ts                  ← instancia PrismaClient
│   │   ├── inngest/
│   │   │   ├── client.ts
│   │   │   ├── extract-property.ts    ← job de extracción IA
│   │   │   └── generate-sheet.ts      ← job de generación PDF
│   │   ├── ai/
│   │   │   ├── extract.ts             ← prompts y llamadas de extracción
│   │   │   └── generate.ts            ← prompts y llamadas de generación
│   │   ├── pdf/
│   │   │   └── render.ts              ← renderizado PDFme
│   │   └── stripe/
│   │       └── client.ts
│   ├── middleware.ts                  ← protección de rutas /dashboard/*
│   └── types/                         ← tipos TypeScript globales
└── .env.local                         ← variables de entorno (no commitear)
```

---

## SEGURIDAD — REGLAS NO NEGOCIABLES

1. **RLS en todas las tablas.** Siempre verificar que las políticas RLS están activas antes de hacer deploy.
2. **Middleware protege /dashboard/*.** Cualquier ruta bajo /dashboard sin sesión válida redirige a /login.
3. **Webhooks de Stripe validados con HMAC.** Rechazar con 400 cualquier request sin `stripe-signature` válido.
4. **Variables de entorno nunca en el código.** Usar solo `process.env.*` con las variables definidas arriba.
5. **URLs pre-firmadas para archivos privados.** Expiración de 1 hora. Solo las imágenes del MiniSite son públicas.
6. **Datos de pago nunca en la BD de Folio.** Solo `stripe_customer_id` y `stripe_subscription_id`.

---

## DECISIONES ABIERTAS (PENDIENTES DE RESOLVER)

Estos puntos deben resolverse antes de iniciar las fases indicadas:

| Decisión | Impacto | Bloquea |
|----------|---------|---------|
| Dominio final: folio.app vs getfolio.mx | DNS, Stripe, Supabase desde día 1 | Fase 1 |
| ¿Badge "Creado con Folio" es removible? ¿En qué plan? | Growth loop viral | Fase 6 |
| Política de retención de archivos (cuentas canceladas / propiedades vendidas) | Storage y GDPR | Fase 3 |
| ¿Una plantilla de PDF o varias en V1? | Scope del motor PDF | Fase 5 |
| Idioma del PDF: ¿el broker elige en el prompt o hay selector en UI? | UX del flujo de generación | Fase 5 |
| ¿Plan Por Uso tiene límite de propiedades activas simultáneas? (propuesta: 5) | Lógica de negocio y pagos | Fase 7 |
| ¿Habrá trial gratuito de N días para planes de suscripción? | Estrategia de adquisición | Fase 7 |

---

*Última actualización: Abril 2026 — Versión 1.0*
