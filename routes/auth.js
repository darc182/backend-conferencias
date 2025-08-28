const express = require('express');
const { supabase } = require('../config/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Login de usuario
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son obligatorios' 
      });
    }

    // Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .eq('activo', true)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        error: 'Perfil de usuario no encontrado o inactivo' 
      });
    }

    // Actualizar último acceso
    await supabase
      .from('user_profiles')
      .update({ ultimo_acceso: new Date() })
      .eq('id', authData.user.id);

    res.json({
      message: 'Login exitoso',
      token: authData.session.access_token,
      user: {
        id: profile.id,
        email: authData.user.email,
        nombre: profile.nombre,
        apellido: profile.apellido,
        rol: profile.rol
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obtener perfil del usuario autenticado
router.get('/profile', auth, async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, nombre, apellido, rol, fecha_registro, ultimo_acceso')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Perfil de usuario no encontrado' });
    }

    res.json({ 
      user: {
        ...profile,
        email: req.user.email
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verificar token
router.get('/verify-token', auth, async (req, res, next) => {
  try {
    // Obtener perfil para incluir rol
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('rol')
      .eq('id', req.user.id)
      .single();

    res.json({ 
      valid: true, 
      user: {
        id: req.user.id,
        email: req.user.email,
        rol: profile?.rol || 'usuario'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout (invalidar token - lado cliente)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

module.exports = router;
