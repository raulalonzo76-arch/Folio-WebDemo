# FOLIO — Documento 3: Servicios, Herramientas y Planes por Capa
*Guía de contratación ordenada por capa técnica — Abril 2026*

---

## Cómo leer este documento

Cada servicio tiene una columna "¿Contratar ya?" con tres valores posibles:
- **SÍ — desde día 1:** Contratar inmediatamente. Necesario para comenzar el desarrollo.
- **Al escalar:** Contratar solo cuando el volumen lo justifique. El plan gratuito cubre las necesidades de V1.
- **NO:** No necesario para V1.

> Todos los servicios marcados como "SÍ — desde día 1" tienen plan gratuito suficiente para desarrollo y las primeras semanas de producción. No implican costo inmediato excepto donde se indica.

---

## Resumen de Costo Mensual — Primeros 100 Usuarios

| Capa | Servicio | Plan V1 | Costo USD/mes |
|------|---------|---------|---------------|
| Hosting / Frontend | Vercel | Hobby → Pro | $0 → $20 |
| Base de Datos | Supabase | Free → Pro | $0 → $25 |
| Autenticación | Supabase Auth | Incluido en Supabase | $0 |
| Storage de archivos | Supabase Storage | Incluido en Supabase | $0 → $25* |
| Cola de jobs | Inngest | Free | $0 |
| Motor IA — Extracción | Claude API | Pay-per-use | ~$10–30 |
| Motor IA — Generación | Claude API | Pay-per-use | ~$20–50 |
| Scraping web | Firecrawl | Free → Hobby | $0 → $16 |
| Generación PDF | PDFme | Open source | $0 |
| Pagos | Stripe | 2.9% + $0.30 / tx | Variable |
| Email transaccional | Resend | Free | $0 |
| Dominio | Namecheap/GoDaddy | Registro anual | ~$1.5/mes |
| DNS / CDN | Cloudflare | Free | $0 |
| Repositorio código | GitHub | Free | $0 |
| **TOTAL ESTIMADO** | — | — | **$30–140 USD** |

---

## CAPA 1 — Hosting y Frontend

### Vercel
- **Rol:** Hosting del proyecto Next.js completo. Deploy automático desde GitHub. CDN global.
- **Plan inicial:** Hobby (gratis) → Pro ($20/mes)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** El plan Hobby es suficiente para desarrollo y las primeras semanas. Migrar a Pro ($20/mes) cuando necesites más de 1 miembro en el equipo o builds paralelos.

### GitHub
- **Rol:** Repositorio de código, CI/CD integrado con Vercel, control de versiones.
- **Plan inicial:** Free (repositorio privado)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** El plan Free permite repositorios privados ilimitados.

### Cloudflare
- **Rol:** DNS authoritative para folio.app (o el dominio elegido). Protección DDoS básica gratuita.
- **Plan inicial:** Free
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Configurar Cloudflare como nameserver del dominio desde el primer día. NO usar el proxy naranja de Cloudflare con Vercel — puede causar conflictos de SSL.

### Namecheap / GoDaddy
- **Rol:** Registro del dominio folio.app o getfolio.mx.
- **Plan inicial:** Registro anual (~$18 USD)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Registrar el dominio antes de comenzar el desarrollo. Namecheap suele ser más barato para .app (~$14/año).

---

## CAPA 2 — Base de Datos, Autenticación y Storage

### Supabase — Database
- **Rol:** PostgreSQL gestionado. Contiene las 7 tablas del ERD de Folio.
- **Plan inicial:** Free (500MB DB, 2 proyectos) → Pro ($25/mes)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** El plan Free incluye 500MB de base de datos. Suficiente para desarrollo y primeros 200 usuarios. Migrar al plan Pro ($25/mes, 8GB DB) antes de superar 400MB o cuando se requiera PgBouncer en producción.

### Supabase — Auth
- **Rol:** Autenticación completa: email/contraseña, Google OAuth, recuperación de contraseña, sesiones JWT.
- **Plan inicial:** Incluido en Supabase Free (hasta 50k MAU)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Google OAuth requiere crear un proyecto en Google Cloud Console (gratuito) y configurar las credenciales en Supabase.

### Supabase — Storage
- **Rol:** Almacenamiento de archivos: imágenes de propiedades, PDFs subidos por brokers, PDFs de fichas generadas, logos de branding.
- **Plan inicial:** Free (1GB Storage)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** El plan Free incluye 1GB de Storage. Con 150MB por propiedad y 7 propiedades promedio por broker, el límite de 1GB se alcanza con ~9 brokers activos. **Migrar al plan Pro ($25/mes, 100GB) antes de los primeros 20 usuarios activos.**

### Google Cloud Console
- **Rol:** Crear las credenciales OAuth de Google (Client ID + Secret) para el login con Google.
- **Plan inicial:** Free (OAuth es gratis)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Solo se crea el proyecto, se habilita la API de Google OAuth2, y se copian las credenciales a Supabase. El proceso toma aproximadamente 15 minutos.

---

## CAPA 3 — Backend, API y Cola de Trabajos

### Next.js API Routes
- **Rol:** El backend de Folio. Todos los endpoints REST (/api/v1/*) y webhooks viven aquí.
- **Plan inicial:** Incluido en Vercel
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Las Vercel Functions tienen un límite de 10 segundos en el plan Hobby y 60 segundos en Pro. Por eso el pipeline de IA **siempre va por Inngest**, no por un API Route directo.

### Inngest
- **Rol:** Cola de trabajos asíncronos para el pipeline de generación de fichas. Maneja reintentos, timeouts y estado de jobs.
- **Plan inicial:** Free (50,000 runs/mes)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** 1 ficha = ~5 steps de Inngest. El free tier aguanta ~10,000 fichas/mes. El plan paid ($50/mes, 5M runs) solo es necesario cuando superes los 2,000 usuarios activos mensuales.

### Prisma ORM
- **Rol:** Capa de acceso a la base de datos. Define el esquema, genera migraciones y provee el cliente tipado en TypeScript.
- **Plan inicial:** Open source (gratis)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Prisma es open source. No usar Prisma Accelerate en V1 — usar el PgBouncer incluido en Supabase Pro.

---

## CAPA 4 — Motor de Inteligencia Artificial

### Anthropic — Claude API
- **Rol:** Motor principal de IA. Extrae datos estructurados de imágenes y PDFs. Genera el contenido completo de las fichas técnicas.
- **Modelos recomendados:**
  - `claude-sonnet-4` para extracción (~$3/MTok input, $15/MTok output)
  - `claude-opus-4` para generación de fichas (~$15/MTok input, $75/MTok output)
- **Costo estimado por ficha completa:** $0.30–$0.60 USD
- **Plan inicial:** Pay-per-use (sin plan fijo). Costo estimado: ~$30–80/mes con primeros usuarios.
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Registrar con tarjeta de crédito y **poner límite de gasto mensual desde el primer día** (recomendado: $50 USD para desarrollo inicial).

### Firecrawl
- **Rol:** Extrae el contenido de páginas web (portales inmobiliarios como Lamudi e Inmuebles24, websites de desarrollos). Devuelve el contenido como markdown limpio para Claude.
- **Plan inicial:** Free (500 créditos/mes) → Hobby ($16/mes, 3,000 créditos)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** 1 crédito = 1 página scrapeada. Con el promedio de 2-3 links por propiedad, el free tier aguanta ~170 propiedades nuevas/mes. Migrar a Hobby ($16/mes) cuando superes 100 propiedades nuevas/mes.

### PDFme
- **Rol:** Renderiza el PDF de la ficha técnica a partir de una plantilla JSON y los datos generados por Claude. Se ejecuta en el servidor (Node.js).
- **Plan inicial:** Open source (gratis)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** PDFme es una librería npm open source sin costo. La plantilla de ficha técnica se diseña en el PDFme Playground (herramienta web gratuita) y se exporta como JSON. URL: pdfme.com/template-design

---

## CAPA 5 — Pagos y Suscripciones

### Stripe
- **Rol:** Procesamiento de pagos para los 4 planes de Folio. Maneja suscripciones, webhooks y Customer Portal de autogestión.
- **Plan inicial:** Sin plan fijo — 2.9% + $0.30 USD por transacción exitosa
- **¿Contratar ya?** SÍ — desde día 1 (en modo TEST)
- **Observación:** Stripe no tiene costo mensual. Solo comisión sobre transacciones exitosas. El modo de pruebas (test mode) está disponible de inmediato sin restricciones.

### Stripe Customer Portal
- **Rol:** Portal de autogestión para el broker: cambiar de plan, actualizar método de pago, ver historial de facturas, cancelar suscripción.
- **Plan inicial:** Incluido en Stripe sin costo adicional
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Activar en el Stripe Dashboard (Billing → Customer Portal → Activate). Ahorra semanas de desarrollo de lógica de billing.

### Stripe Tax
- **Rol:** Cálculo y aplicación automática de IVA (16% en México) en cada transacción.
- **Plan inicial:** $0.50 USD por transacción con tax calculado
- **¿Contratar ya?** Al escalar
- **Observación:** Para V1, manejar el IVA manualmente en los precios mostrados (precios con IVA incluido). Activar cuando el volumen requiera automatización fiscal o facturas electrónicas (CFDI).

---

## CAPA 6 — Comunicaciones y Email

### Resend
- **Rol:** Servicio de envío de emails transaccionales. Integración nativa con Next.js y React Email. Maneja la entregabilidad (SPF, DKIM, DMARC) automáticamente.
- **Plan inicial:** Free (3,000 emails/mes, 1 dominio)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** El plan Free cubre los primeros 500–600 usuarios activos mensuales. Requiere verificar el dominio del remitente (noreply@folio.app) — proceso de 10 minutos.

### React Email
- **Rol:** Librería para construir las plantillas de email en React/JSX con la identidad visual de Folio.
- **Plan inicial:** Open source (gratis)
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Los emails de "ficha lista" y "bienvenida" son los dos más importantes para la primera impresión del producto — invertir tiempo en diseñarlos bien desde el inicio.

---

## CAPA 7 — Monitoreo y Observabilidad

### Vercel Analytics
- **Rol:** Métricas de performance del frontend: Core Web Vitals, tiempo de carga, visitas por página.
- **Plan inicial:** Incluido en Vercel Hobby y Pro
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Activar en Vercel Dashboard → Analytics → Enable. Sin configuración adicional.

### Supabase Dashboard
- **Rol:** Monitoreo de la base de datos: queries lentas, conexiones activas, uso de storage, logs de autenticación.
- **Plan inicial:** Incluido en Supabase Free y Pro
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Revisar semanalmente durante los primeros meses.

### Inngest Dashboard
- **Rol:** Estado de todos los jobs de generación de fichas: en cola, en proceso, completados, fallidos. Logs detallados de cada ejecución.
- **Plan inicial:** Incluido en Inngest Free
- **¿Contratar ya?** SÍ — desde día 1
- **Observación:** Es la herramienta más importante para debuggear problemas en el pipeline de generación. Marcar como favorito desde el primer día.

### Sentry
- **Rol:** Error tracking del frontend y backend: captura excepciones no manejadas, stack traces, contexto del usuario.
- **Plan inicial:** Free (5,000 errores/mes) → $26/mes
- **¿Contratar ya?** Al escalar
- **Observación:** Agregar cuando el producto tenga más de 50 usuarios activos.

### Microsoft Clarity
- **Rol:** Grabaciones de sesiones de usuario y mapas de calor.
- **Plan inicial:** Gratis (sin límite de sesiones)
- **¿Contratar ya?** Al escalar
- **Observación:** Alternativa gratuita de Microsoft a Hotjar. Usar desde que haya 10+ usuarios activos.

---

## CAPA 8 — Herramientas de Desarrollo

### Cursor / VS Code
- **Rol:** Editor de código principal. Cursor tiene IA integrada para asistencia de código.
- **Plan inicial:** VS Code: gratis. Cursor: $20/mes (Pro) o gratis (Hobby, 2,000 completions/mes).
- **¿Contratar ya?** SÍ — desde día 1

### Figma
- **Rol:** Diseño de componentes de UI, prototipos de pantallas y diseño de la plantilla PDF.
- **Plan inicial:** Starter: gratis (3 proyectos). Professional: $12/editor/mes.
- **¿Contratar ya?** SÍ — desde día 1

### PDFme Playground
- **Rol:** Herramienta web gratuita para diseñar visualmente la plantilla de la ficha técnica. Genera el JSON de configuración para el código.
- **URL:** pdfme.com/template-design
- **¿Contratar ya?** SÍ — desde día 1 (al comenzar Fase 5)

### Stripe CLI
- **Rol:** Herramienta de línea de comandos para testear los webhooks de Stripe localmente.
- **Instalación:** `brew install stripe/stripe-cli/stripe` (macOS)
- **Uso:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- **¿Contratar ya?** SÍ — desde día 1 (al comenzar Fase 7)

### Tally.so
- **Rol:** Formulario de lista de espera para el Wizard of Oz Demo. Captura emails de brokers interesados.
- **Plan inicial:** Free
- **¿Contratar ya?** SÍ — desde día 1 (para Fase 0)

---

## Orden Recomendado de Contratación

### Grupo A — Contratar el día 1 (antes de escribir código)

| # | Servicio | Acción | Tiempo | Costo inmediato |
|---|---------|--------|--------|-----------------|
| 1 | GitHub | Crear cuenta y repositorio privado "folio" | 5 min | GRATIS |
| 2 | Dominio (Namecheap) | Registrar folio.app o getfolio.mx | 10 min | ~$14–18 USD/año |
| 3 | Cloudflare | Crear cuenta y apuntar nameservers del dominio | 15 min | GRATIS |
| 4 | Vercel | Crear cuenta, conectar con GitHub, crear proyecto "folio" | 10 min | GRATIS |
| 5 | Supabase | Crear organización y dos proyectos: "folio-dev" y "folio-prod" | 15 min | GRATIS |
| 6 | Google Cloud Console | Crear proyecto, habilitar OAuth API, generar Client ID y Secret | 15 min | GRATIS |
| 7 | Anthropic Console | Crear cuenta, agregar tarjeta, crear API Key, configurar límite de $50 USD/mes | 10 min | GRATIS (pay-per-use) |
| 8 | Stripe | Crear cuenta en modo TEST. NO activar modo live todavía. | 15 min | GRATIS |
| 9 | Inngest | Crear cuenta, conectar con el proyecto de Vercel | 10 min | GRATIS |
| 10 | Resend | Crear cuenta, verificar dominio del remitente | 15 min | GRATIS |
| 11 | Firecrawl | Crear cuenta, obtener API Key | 5 min | GRATIS |
| 12 | Tally.so | Crear formulario de lista de espera con campos nombre + email | 10 min | GRATIS |

> **El único costo inmediato del Grupo A es el dominio (~$14–18 USD una vez al año). Todo lo demás es gratuito.**

### Grupo B — Contratar durante el desarrollo (semanas 2–4)

| # | Servicio | Cuándo activar | Costo |
|---|---------|----------------|-------|
| 1 | Stripe — Modo Live | Antes de abrir el acceso a los primeros beta users que pagarán | GRATIS (comisión solo sobre ventas) |
| 2 | Cursor Pro | Si el plan Hobby de 2,000 completions/mes resulta insuficiente | $20 USD/mes |
| 3 | Figma Professional | Si se necesita colaborar con un diseñador externo | $12 USD/mes |
| 4 | PDFme Playground | Al comenzar Fase 5 (generación de fichas). Gratuito. | GRATIS |
| 5 | Stripe CLI | Al comenzar Fase 7 (pagos). Instalación local gratuita. | GRATIS |

### Grupo C — Contratar al escalar (mes 2 en adelante)

| # | Servicio | Cuándo activar | Costo mensual |
|---|---------|----------------|---------------|
| 1 | Supabase Pro ($25/mes) | Antes de superar 400MB de DB o 1GB de Storage (~20 brokers activos) | $25 USD/mes |
| 2 | Vercel Pro ($20/mes) | Cuando se necesite más de 1 miembro en el equipo o builds paralelos | $20 USD/mes |
| 3 | Resend Pro ($20/mes) | Cuando los emails superen 3,000/mes (~500+ usuarios activos) | $20 USD/mes |
| 4 | Firecrawl Hobby ($16/mes) | Cuando se procesen más de 500 links/mes | $16 USD/mes |
| 5 | Microsoft Clarity (gratis) | Cuando haya 10+ usuarios activos | $0 |
| 6 | Sentry ($26/mes) | Cuando haya 50+ usuarios activos | $26 USD/mes |
| 7 | Inngest Paid ($50/mes) | Cuando los jobs superen 50,000 runs/mes (~10,000 fichas/mes) | $50 USD/mes |

---

## Costo Acumulado por Etapa

| Etapa | Descripción | Costo total USD/mes |
|-------|-------------|---------------------|
| Día 1 | Setup inicial — solo el dominio tiene costo | ~$1.50 (dominio prorrateado) |
| Semanas 1–4 | Desarrollo activo + primeras pruebas con IA | ~$10–30 (solo Claude API) |
| Mes 1–2 | Beta cerrada con primeros 10–20 brokers | ~$20–60 |
| Mes 2–3 | Lanzamiento público, primeros 50–100 usuarios | ~$60–120 |
| Mes 3+ | Crecimiento sostenido, 100+ usuarios activos | ~$120–200 |

> **Breakeven de infraestructura:** con solo 5 brokers en plan Mensual ($699 MXN ≈ $38 USD cada uno), los $190 USD de ingresos cubren el costo total de infraestructura del Grupo C completo. El breakeven se alcanza con menos de una semana de ventas.
