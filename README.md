# AG Empleo — App de Búsqueda de Trabajo 🇦🇷

PWA mobile-first de búsqueda de empleo en Argentina, construida con React + TypeScript + Firebase + Tailwind CSS.

---

## 📁 Estructura del proyecto

```
ag-empleo-final/
├── src/
│   ├── app/
│   │   ├── firebase.ts        # Inicialización Firebase + validación de env vars
│   │   └── rutas.tsx          # Router con rutas protegidas
│   ├── components/
│   │   ├── Feed.tsx           # Feed social con likes y subida de media
│   │   ├── FloatingAI.tsx     # Chat flotante con IA (Anthropic API)
│   │   ├── Menu.tsx           # Menú lateral deslizable
│   │   └── Navbar.tsx         # Barra de navegación inferior fija
│   ├── context/
│   │   └── ThemeContext.tsx   # Contexto global: modo empleo/social + auth user
│   ├── pages/
│   │   ├── CVBuilder.tsx      # Generador de CV con 4 plantillas → PDF
│   │   ├── Companies.tsx      # Directorio de empresas A-Z
│   │   ├── Feed.tsx           # Página del feed social
│   │   ├── Home.tsx           # Pantalla principal adaptativa
│   │   ├── Jobs.tsx           # Listado de empleos con filtros
│   │   ├── Login.tsx          # Login con Google OAuth
│   │   ├── MapPage.tsx        # Mapa de changas con Leaflet + geolocalización
│   │   ├── Privacidad.tsx     # Políticas de privacidad
│   │   └── Profile.tsx        # Perfil de usuario editable
│   ├── App.tsx                # Componente raíz con ThemeProvider
│   ├── index.css              # Estilos base + Tailwind
│   └── main.tsx               # Entry point con manejo seguro del DOM
├── .env                       # Variables de entorno (no commitear)
├── index.html
├── package.json
└── vite.config.ts
```

---

## ⚙️ Configuración inicial

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/agustindamian258-hue/ag-empleo-final.git
cd ag-empleo-final
npm install
```

### 2. Variables de entorno

Crear `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> ⚠️ **Nunca commitear el `.env` real a GitHub.** Agregar `.env` al `.gitignore`.

### 3. Iniciar en desarrollo

```bash
npm run dev
```

### 4. Build para producción

```bash
npm run build
npm run preview
```

---

## 🔥 Colecciones de Firestore requeridas

| Colección | Campos principales |
|-----------|-------------------|
| `users`   | name, email, photo, ciudad, bio, title, role, createdAt, updatedAt |
| `posts`   | text, mediaUrl, mediaType, userId, userName, userPhoto, likes[], createdAt |
| `empleos` | titulo, empresa, ubicacion, salario, tipo, descripcion, createdAt |
| `empresas`| nombre, website_url, categoria |
| `changas` | titulo, descripcion, pago, urgencia, posicion[lat,lng] |

---

## 🛡️ Seguridad implementada

- **XSS**: Sanitización de texto antes de persistir en Firestore
- **URL injection**: Validación de protocolo http/https en links de empresas
- **Auth guard**: Todas las rutas privadas verifican sesión Firebase
- **Env vars**: Validación en arranque — la app no inicia si faltan vars críticas
- **localStorage**: Wrapped en try/catch para modo incógnito restrictivo

---

## 🤖 Asistente IA (FloatingAI)

El chat usa la API de Anthropic (Claude). 

> ⚠️ **Importante para producción**: La API key de Anthropic **no debe estar en el cliente**. 
> Implementar un backend/proxy (Cloud Functions, Edge Functions, etc.) que reciba los mensajes
> y llame a la API de forma segura.

---

## 📱 Características

- ✅ Login con Google OAuth (Firebase Auth)
- ✅ Feed social con fotos/videos y sistema de likes
- ✅ Mapa de changas con geolocalización y filtros
- ✅ Generador de CV (4 plantillas) → exporta a PDF
- ✅ Directorio de empresas A-Z con búsqueda
- ✅ Listado de empleos con filtros por tipo
- ✅ Perfil de usuario editable
- ✅ Modo Empleo / Social (toggle)
- ✅ Asistente IA flotante con contexto del usuario
- ✅ PWA mobile-first con Tailwind CSS

---

## 🧪 Lint

```bash
npm run lint
```
