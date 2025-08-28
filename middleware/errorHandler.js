const errorHandler = (err, req, res, next) => {
  console.error('Error stack:', err.stack);

  // Error de Supabase
  if (err.code) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Error en la base de datos',
      code: err.code
    });
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Datos de entrada inválidos',
      details: err.details
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido'
    });
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expirado'
    });
  }

  // Error por defecto
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Error interno del servidor'
  });
};

module.exports = errorHandler;
