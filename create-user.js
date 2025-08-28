require('dotenv').config();
const { supabase } = require('./config/supabase');

/**
 * Script para crear usuarios usando Supabase Auth
 * Los usuarios se crean en auth.users y se crea su perfil en user_profiles
 */

async function createUser(userData) {
  try {
    const { nombre, apellido, email, password, rol = 'usuario' } = userData;

    // Validaciones
    if (!nombre || !apellido || !email || !password) {
      throw new Error('Todos los campos son obligatorios: nombre, apellido, email, password');
    }

    console.log(`Creando usuario: ${nombre} ${apellido} (${email})...`);
    
    // Primero, intentar crear el usuario con admin
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar automáticamente
      user_metadata: {
        nombre: nombre,
        apellido: apellido,
        rol: rol
      }
    });

    if (adminError) {
      console.error('Error creando usuario con admin API:', adminError.message);
      throw adminError;
    }

    // Crear perfil en user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: adminData.user.id,
        nombre: nombre,
        apellido: apellido,
        rol: rol,
        activo: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creando perfil:', profileError.message);
      // Intentar eliminar el usuario creado
      await supabase.auth.admin.deleteUser(adminData.user.id);
      throw profileError;
    }

    console.log('✅ Usuario creado exitosamente:');
    console.log({
      id: adminData.user.id,
      email: adminData.user.email,
      nombre: profileData.nombre,
      apellido: profileData.apellido,
      rol: profileData.rol,
      fecha_registro: profileData.fecha_registro
    });

    return { user: adminData.user, profile: profileData };
  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    throw error;
  }
}

// Función para crear múltiples usuarios
async function createMultipleUsers(users) {
  console.log(`🚀 Creando ${users.length} usuarios...`);
  
  for (const userData of users) {
    try {
      await createUser(userData);
    } catch (error) {
      console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
    }
    console.log(''); // Línea vacía entre usuarios
  }
}

// Usuarios por defecto para el sistema
const defaultUsers = [
  {
    nombre: 'Administrador',
    apellido: 'Principal',
    email: 'admin@conferencias.com',
    password: 'admin123456',
    rol: 'administrador'
  },
  {
    nombre: 'Coordinador',
    apellido: 'Académico',
    email: 'coordinador@conferencias.com',
    password: 'coord123456',
    rol: 'coordinador'
  },
  {
    nombre: 'Asistente',
    apellido: 'Eventos',
    email: 'asistente@conferencias.com',
    password: 'asist123456',
    rol: 'usuario'
  }
];

// Ejecutar script si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Uso del script:');
    console.log('npm run create-user -- --default  # Crear usuarios por defecto');
    console.log('npm run create-user -- --custom   # Crear usuario personalizado');
    console.log('');
    console.log('Para usuario personalizado, edita este archivo y modifica la sección customUser');
    process.exit(1);
  }

  if (args.includes('--default')) {
    console.log('🔧 Creando usuarios por defecto...');
    createMultipleUsers(defaultUsers)
      .then(() => {
        console.log('✅ Proceso completado');
        console.log('');
        console.log('📝 Credenciales creadas:');
        defaultUsers.forEach(user => {
          console.log(`${user.rol}: ${user.email} / ${user.password}`);
        });
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  }

  if (args.includes('--custom')) {
    // Personaliza este usuario según necesites
    const customUser = {
      nombre: 'Usuario',
      apellido: 'Personalizado',
      email: 'usuario@example.com',
      password: 'password123',
      rol: 'usuario' // 'administrador', 'coordinador', 'usuario'
    };

    console.log('🔧 Creando usuario personalizado...');
    createUser(customUser)
      .then(() => {
        console.log('✅ Usuario personalizado creado');
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  }
}

module.exports = { createUser, createMultipleUsers };
