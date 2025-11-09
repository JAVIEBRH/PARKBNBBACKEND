# Parkbnb Backend API

API REST construida con Express y MongoDB para la plataforma Parkbnb.

## Requisitos

- Node.js 18+
- npm 9+
- MongoDB (local o remoto)

## Configuración

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y completa las variables necesarias:
   ```bash
   cp .env.example .env
   ```
3. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` – inicia el servidor con `nodemon`.
- `npm start` – inicia el servidor con Node.
- `npm test` – ejecuta los tests (si están configurados).

## Estructura

- `server.js` – punto de entrada.
- `routes/` – rutas API (`/api/v1`).
- `controllers/` – controladores Express.
- `services/` – lógica de negocio.
- `models/` – modelos Mongoose.
- `middlewares/` – middlewares personalizados.
- `config/` – configuración de CORS, Helmet, rate limit, Swagger.
- `utils/` – helpers de errores, validaciones, etc.
- `public/uploads/` – almacenamiento de archivos.

## Enlaces

- Frontend (Expo): [parkbnb-frontend](../parkbnb-frontend)
