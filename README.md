# Sistema de Gestión de Conferencias - Backend

API REST para el sistema de gestión de conferencias académicas y corporativas.

## 🚀 Características

- **Autenticación Supabase**: Sistema seguro de login con Supabase Auth
- **Gestión de Ponentes**: CRUD completo para speakers y conferencistas
- **Gestión de Salas**: Administración de espacios y recursos
- **Gestión de Conferencias**: Programación completa de eventos
- **Verificación de Disponibilidad**: Control de conflictos de horarios
- **Sistema de Registros**: Control de asistencia y pagos
- **API RESTful**: Endpoints bien estructurados y documentados

## 🛠️ Tecnologías

- **Node.js** con Express.js
- **Supabase** (PostgreSQL) como base de datos
- **Supabase Auth** para autenticación
- **CORS** configurado para desarrollo y producción
- **Rate limiting** para seguridad

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta en Supabase
- Variables de entorno configuradas

## ⚙️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd conferencias/backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus valores:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Server Configuration
PORT=3000

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5173
NETLIFY_URL=https://your-app.netlify.app
```

4. **Configurar base de datos**
```bash
# Ejecutar en Supabase SQL Editor:
# 1. database/schema.sql
# 2. database/seed.sql (opcional, para datos de prueba)
```

5. **Crear usuarios administrativos**
```bash
# Crear usuarios por defecto (admin, coordinador, asistente)
npm run create-user -- --default

# O crear un usuario personalizado (editar create-user.js primero)
npm run create-user -- --custom
```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 👥 Gestión de Usuarios

Este sistema **NO incluye registro público de usuarios**. Los usuarios deben ser creados directamente por administradores.

### Crear Usuarios por Defecto
```bash
npm run create-user -- --default
```

Esto crea 3 usuarios:
- **Administrador**: admin@conferencias.com (password: admin123456)
- **Coordinador**: coordinador@conferencias.com (password: coord123456)  
- **Asistente**: asistente@conferencias.com (password: asist123456)

### Crear Usuario Personalizado
1. Edita el archivo `create-user.js` en la sección `customUser`
2. Ejecuta: `npm run create-user -- --custom`

### Roles Disponibles
- **administrador**: Acceso completo al sistema
- **coordinador**: Gestión de conferencias y recursos
- **usuario**: Acceso básico y registro a eventos

## 📚 Endpoints de la API

### Autenticación (`/api/auth`)
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere auth)
- `GET /api/auth/verify-token` - Verificar token (requiere auth)
- `POST /api/auth/logout` - Cerrar sesión (requiere auth)

### Ponentes (`/api/ponentes`)
- `GET /api/ponentes` - Listar ponentes
- `GET /api/ponentes/:id` - Obtener ponente por ID
- `POST /api/ponentes` - Crear ponente (requiere auth)
- `PUT /api/ponentes/:id` - Actualizar ponente (requiere auth)
- `DELETE /api/ponentes/:id` - Desactivar ponente (requiere auth)
- `GET /api/ponentes/meta/especialidades` - Obtener especialidades
- `GET /api/ponentes/meta/paises` - Obtener países
- `GET /api/ponentes/disponibles/:fecha` - Ponentes disponibles por fecha

### Salas (`/api/salas`)
- `GET /api/salas` - Listar salas
- `GET /api/salas/:id` - Obtener sala por ID
- `POST /api/salas` - Crear sala (requiere auth)
- `PUT /api/salas/:id` - Actualizar sala (requiere auth)
- `DELETE /api/salas/:id` - Desactivar sala (requiere auth)
- `GET /api/salas/meta/tipos` - Obtener tipos de sala
- `POST /api/salas/verificar-disponibilidad` - Verificar disponibilidad
- `POST /api/salas/disponibles` - Salas disponibles por fecha/horario
- `GET /api/salas/estadisticas/uso` - Estadísticas de uso (requiere auth)

### Conferencias (`/api/conferencias`)
- `GET /api/conferencias` - Listar conferencias
- `GET /api/conferencias/:id` - Obtener conferencia por ID
- `POST /api/conferencias` - Crear conferencia (requiere auth)
- `PUT /api/conferencias/:id` - Actualizar conferencia (requiere auth)
- `DELETE /api/conferencias/:id` - Cancelar conferencia (requiere auth)
- `GET /api/conferencias/meta/categorias` - Obtener categorías
- `GET /api/conferencias/calendario/:fecha` - Conferencias por fecha
- `POST /api/conferencias/:id/registrar-asistencia` - Registrar asistencia (requiere auth)
- `GET /api/conferencias/estadisticas/generales` - Estadísticas generales (requiere auth)

## 🔒 Autenticación

Para endpoints que requieren autenticación, incluir el token de Supabase en el header:

```
Authorization: Bearer <tu-supabase-access-token>
```

El token se obtiene del login y debe ser enviado en todas las peticiones autenticadas.

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **user_profiles**: Perfiles de usuario (conectada con auth.users de Supabase)
- **ponentes**: Speakers y conferencistas
- **salas**: Espacios y recursos disponibles
- **conferencias**: Eventos programados
- **registros_asistentes**: Control de asistencia y pagos

### Características de Seguridad
- **Supabase Auth**: Autenticación integrada
- **RLS (Row Level Security)** habilitado
- **Políticas de acceso** por usuario autenticado
- **Índices optimizados** para consultas frecuentes
- **Triggers automáticos** para auditoría

## 🌐 Despliegue

### Render.com (Recomendado)

1. **Conectar repositorio** en Render.com
2. **Configurar variables de entorno** en el dashboard
3. **Configurar build settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Deploy automático** se ejecutará

### Variables de Entorno para Producción
```env
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key
FRONTEND_URL=https://your-frontend-domain.com
NETLIFY_URL=https://your-netlify-app.netlify.app
NODE_ENV=production
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Health check
curl http://localhost:3000/health
```

## 📝 Ejemplos de Uso

### Iniciar Sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

### Crear Conferencia
```bash
curl -X POST http://localhost:3000/api/conferencias \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "titulo": "Introducción a la IA",
    "ponente_id": "uuid-ponente",
    "sala_id": "uuid-sala",
    "fecha": "2024-03-15",
    "hora_inicio": "10:00",
    "hora_fin": "12:00",
    "descripcion": "Conferencia sobre fundamentos de IA",
    "categoria": "Tecnología"
  }'
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@conferencias.com
- Issues: GitHub Issues
- Documentación: [API Docs](http://localhost:3000/)

## 🔄 Changelog

### v1.0.0 (2024-01-15)
- ✨ Lanzamiento inicial
- 🔐 Sistema de autenticación JWT
- 👥 Gestión completa de ponentes
- 🏢 Gestión de salas y recursos
- 📅 Sistema de conferencias
- 📊 Dashboard de estadísticas
- 🚀 Deploy en Render.com
