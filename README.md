# ABM Clientes 🏦

Sistema de Alta, Baja y Modificación de clientes bancarios. Stack: **React + Node/Express + SQLite**.

## Estructura

```
abm-clientes/
├── backend/          # API REST (Node.js + Express + SQLite)
│   ├── server.js
│   ├── database.js
│   └── routes/
│       └── clientes.js
└── frontend/         # SPA (React + Vite)
    └── src/
        ├── App.jsx
        ├── components/
        └── services/
```

## Instalación y ejecución

### Backend

```bash
cd backend
npm install
npm run dev      # puerto 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # puerto 5173
```

Abrí `http://localhost:5173` en el navegador.

## API REST

| Método | Endpoint                   | Descripción                     |
|--------|----------------------------|---------------------------------|
| GET    | `/api/clientes`            | Listado con filtros y paginación|
| GET    | `/api/clientes/:id`        | Detalle de un cliente           |
| POST   | `/api/clientes`            | Alta de cliente                 |
| PUT    | `/api/clientes/:id`        | Modificación de cliente         |
| DELETE | `/api/clientes/:id`        | Baja lógica (estado=INACTIVO)   |
| GET    | `/api/clientes/:id/auditoria` | Historial de cambios          |

### Query params para GET /api/clientes

| Param        | Ejemplo          | Descripción              |
|--------------|------------------|--------------------------|
| `busqueda`   | `tech`           | Busca en nombre/CUIT/email|
| `segmento`   | `PYME`           | Filtra por segmento      |
| `estado`     | `ACTIVO`         | Filtra por estado        |
| `tipo_persona` | `JURIDICA`     | Filtra por tipo          |
| `page`       | `2`              | Página (default: 1)      |
| `limit`      | `20`             | Registros por página     |

## Modelo de datos

```sql
clientes (
  id            INTEGER PK,
  razon_social  TEXT NOT NULL,
  cuit          TEXT NOT NULL UNIQUE,
  tipo_persona  TEXT  -- FISICA | JURIDICA
  segmento      TEXT  -- RETAIL | PYME | CORPORATIVO | PREMIUM
  estado        TEXT  -- ACTIVO | INACTIVO | BLOQUEADO
  email         TEXT,
  telefono      TEXT,
  direccion     TEXT,
  localidad     TEXT,
  provincia     TEXT,
  codigo_postal TEXT,
  fecha_alta    TEXT,
  fecha_mod     TEXT,
  observaciones TEXT
)
```

## Funcionalidades

- ✅ Listado paginado con búsqueda y filtros múltiples
- ✅ Alta de cliente con validaciones (CUIT único, formato, campos requeridos)
- ✅ Modificación con detección de campos cambiados
- ✅ Baja lógica (no elimina el registro físicamente)
- ✅ Auditoría de todas las operaciones
- ✅ Seed de datos de prueba al iniciar
- ✅ Toast notifications
- ✅ Modal de confirmación de baja
