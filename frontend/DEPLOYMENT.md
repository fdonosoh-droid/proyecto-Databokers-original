# 🚀 Guía de Deployment - Frontend Databrokers

Esta guía detalla los pasos para desplegar el frontend de Databrokers en diferentes entornos.

---

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Variables de Entorno](#variables-de-entorno)
3. [Build de Producción](#build-de-producción)
4. [Deployment en Diferentes Plataformas](#deployment-en-diferentes-plataformas)
5. [Configuración de Servidor Web](#configuración-de-servidor-web)
6. [Optimizaciones Post-Deployment](#optimizaciones-post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisitos

Antes de comenzar el deployment, asegúrate de tener:

- Node.js 18+ instalado
- npm o yarn
- Acceso al servidor de deployment
- URL del backend API
- Certificados SSL (para producción)

---

## 🔐 Variables de Entorno

### 1. Crear archivo `.env.production`

```bash
# API Configuration
VITE_API_BASE_URL=https://api.databrokers.com/api

# App Configuration
VITE_APP_NAME=Databrokers
VITE_APP_ENV=production

# Optional: Analytics
VITE_ANALYTICS_ID=your-analytics-id

# Optional: Error Tracking (Sentry)
VITE_SENTRY_DSN=your-sentry-dsn
```

### 2. Validar Variables de Entorno

Asegúrate de que todas las variables requeridas estén configuradas:

```bash
# En tu archivo .env.production:
- VITE_API_BASE_URL: URL del backend API
- VITE_APP_NAME: Nombre de la aplicación
```

---

## 🏗️ Build de Producción

### 1. Limpiar Build Anterior

```bash
rm -rf dist
```

### 2. Instalar Dependencias

```bash
npm ci
```

> **Nota:** `npm ci` es más rápido y confiable que `npm install` para entornos de CI/CD.

### 3. Ejecutar Linter

```bash
npm run lint
```

### 4. Ejecutar Tests

```bash
npm run test:coverage
```

Asegúrate de que:
- ✅ Todos los tests pasen
- ✅ Cobertura sea >70%

### 5. Crear Build Optimizado

```bash
npm run build
```

El build se generará en la carpeta `dist/`.

### 6. Verificar Build Localmente

```bash
npm run preview
```

Abre `http://localhost:4173` para verificar que el build funcione correctamente.

---

## 🌐 Deployment en Diferentes Plataformas

### Opción 1: Vercel (Recomendado)

#### Deployment Automático desde GitHub

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel Dashboard
3. Vercel detectará automáticamente Vite

#### Configurar `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Deployment Manual

```bash
npm install -g vercel
vercel --prod
```

---

### Opción 2: Netlify

#### Deployment Automático desde GitHub

1. Conecta tu repositorio a Netlify
2. Configura Build Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

#### Configurar `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

### Opción 3: AWS S3 + CloudFront

#### 1. Crear Bucket S3

```bash
aws s3 mb s3://databrokers-frontend
```

#### 2. Configurar Bucket para Static Website Hosting

```bash
aws s3 website s3://databrokers-frontend \
  --index-document index.html \
  --error-document index.html
```

#### 3. Subir Build

```bash
aws s3 sync dist/ s3://databrokers-frontend \
  --acl public-read \
  --cache-control max-age=31536000,public
```

#### 4. Configurar CloudFront

- Crear distribución de CloudFront apuntando al bucket S3
- Configurar SSL con ACM (AWS Certificate Manager)
- Configurar error pages para SPA routing

---

### Opción 4: Servidor Propio (Nginx)

#### 1. Copiar Build al Servidor

```bash
scp -r dist/* user@server:/var/www/databrokers
```

#### 2. Configurar Nginx

Crear archivo `/etc/nginx/sites-available/databrokers`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name databrokers.com www.databrokers.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name databrokers.com www.databrokers.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/databrokers.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/databrokers.com/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory
    root /var/www/databrokers;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

#### 3. Habilitar Sitio

```bash
sudo ln -s /etc/nginx/sites-available/databrokers /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Opción 5: Docker

#### Crear `Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Crear `nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Build y Run

```bash
# Build image
docker build -t databrokers-frontend .

# Run container
docker run -d -p 80:80 databrokers-frontend
```

---

## ⚙️ Configuración de Servidor Web

### Cache Headers

Configurar cache adecuado para diferentes tipos de archivos:

- **HTML:** No cache (para que siempre obtenga la última versión)
- **JS/CSS:** Cache 1 año (con hash en nombre de archivo)
- **Imágenes:** Cache 1 año

### Compresión

Habilitar compresión gzip o brotli para reducir tamaño de transferencia.

### Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

---

## 🚀 Optimizaciones Post-Deployment

### 1. Verificar Performance con Lighthouse

```bash
npm install -g lighthouse
lighthouse https://databrokers.com --view
```

Objetivos:
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

### 2. Configurar CDN

Considerar usar un CDN como Cloudflare para:
- Reducir latencia
- Protección DDoS
- Cache global

### 3. Monitoring

Configurar herramientas de monitoring:
- **Error Tracking:** Sentry
- **Analytics:** Google Analytics, Plausible
- **Uptime Monitoring:** UptimeRobot, Pingdom

### 4. Setup CI/CD

#### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🔍 Troubleshooting

### Problema: Routes 404 en producción

**Solución:** Configurar servidor web para servir `index.html` en todas las rutas (ver configuraciones arriba).

### Problema: Variables de entorno no funcionan

**Solución:**
- Asegúrate de que las variables empiecen con `VITE_`
- Reconstruye la aplicación después de cambiar variables
- No incluyas valores sensibles en el frontend

### Problema: Bundle size muy grande

**Solución:**
- Verificar que el code splitting esté funcionando
- Analizar bundle con `npm run build -- --mode analyze`
- Eliminar dependencias no utilizadas

### Problema: CORS errors

**Solución:**
- Configurar CORS en el backend
- Verificar que `VITE_API_BASE_URL` sea correcta
- Verificar que el backend acepte requests del dominio frontend

### Problema: Slow performance

**Solución:**
- Verificar que gzip/brotli esté habilitado
- Verificar cache headers
- Usar CDN
- Optimizar imágenes

---

## 📞 Soporte

Para problemas o preguntas sobre deployment:
- Revisar documentación en `/docs`
- Crear issue en el repositorio
- Contactar al equipo de DevOps

---

**© 2025 Databrokers - Sistema de Gestión Inmobiliaria**
