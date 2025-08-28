const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar middlewares
const errorHandler = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth');
const ponentesRoutes = require('./routes/ponentes');
const salasRoutes = require('./routes/salas');
const conferenciasRoutes = require('./routes/conferencias');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://localhost:5173',
      process.env.FRONTEND_URL,
      process.env.NETLIFY_URL
    ].filter(Boolean);

    // Permitir requests sin origin (ej: aplicaciones móviles, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Origen no permitido por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests per window per IP
  message: 'Demasiadas peticiones desde esta IP, inténtalo de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Sistema de Gestión de Conferencias - Backend',
    version: '1.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del Sistema de Gestión de Conferencias',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      ponentes: '/api/ponentes',
      salas: '/api/salas',
      conferencias: '/api/conferencias'
    },
    documentation: 'https://api-conferencias.onrender.com/docs'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/ponentes', ponentesRoutes);
app.use('/api/salas', salasRoutes);
app.use('/api/conferencias', conferenciasRoutes);

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    availableEndpoints: {
      'GET /': 'Información de la API',
      'GET /health': 'Estado del servidor',
      'POST /api/auth/login': 'Iniciar sesión',
      'GET /api/ponentes': 'Listar ponentes',
      'GET /api/salas': 'Listar salas',
      'GET /api/conferencias': 'Listar conferencias'
    }
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 Sistema de Gestión de Conferencias');
  console.log('=================================');
  console.log(`🌐 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/`);
  console.log('=================================');
  console.log('📡 Endpoints disponibles:');
  console.log('   🔐 /api/auth/*');
  console.log('   🎤 /api/ponentes/*');
  console.log('   🏢 /api/salas/*');
  console.log('   📅 /api/conferencias/*');
  console.log('=================================');
  
  // Verificar variables de entorno críticas
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️  Configuración de Supabase incompleta');
  }
  
  console.log('✅ Servidor iniciado correctamente');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rechazada no manejada:', reason);
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app;
