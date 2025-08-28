-- Schema para Sistema de Gestión de Conferencias Académicas
-- Ejecutar en Supabase SQL Editor

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perfiles de usuario (conectada con auth.users de Supabase)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre VARCHAR(150),
    apellido VARCHAR(150),
    rol VARCHAR(20) DEFAULT 'usuario' CHECK (rol IN ('administrador', 'coordinador', 'usuario')),
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ponentes
CREATE TABLE IF NOT EXISTS ponentes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    especialidad VARCHAR(150) NOT NULL,
    biografia TEXT,
    institucion VARCHAR(200),
    cargo VARCHAR(150),
    pais VARCHAR(100),
    experiencia_anos INTEGER DEFAULT 0,
    conferencias_impartidas INTEGER DEFAULT 0,
    idiomas TEXT, -- "Español, Inglés, Francés"
    disponible BOOLEAN DEFAULT true,
    tarifa_por_evento DECIMAL(10,2),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de salas
CREATE TABLE IF NOT EXISTS salas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    ubicacion VARCHAR(200),
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    tipo VARCHAR(50) NOT NULL, -- 'Auditorio', 'Sala de conferencias', 'Laboratorio', 'Aula virtual'
    equipamiento TEXT,
    disponible BOOLEAN DEFAULT true,
    precio_por_hora DECIMAL(10,2),
    caracteristicas JSONB, -- {"tiene_proyector": true, "tiene_sonido": true, ...}
    descripcion TEXT,
    foto_url VARCHAR(500),
    contacto_responsable VARCHAR(200),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de conferencias
CREATE TABLE IF NOT EXISTS conferencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo VARCHAR(300) NOT NULL,
    codigo_evento VARCHAR(20) UNIQUE NOT NULL,
    ponente_id UUID NOT NULL REFERENCES ponentes(id) ON DELETE RESTRICT,
    sala_id UUID NOT NULL REFERENCES salas(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion INTEGER NOT NULL, -- minutos
    descripcion TEXT,
    categoria VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'Presencial' CHECK (tipo IN ('Presencial', 'Virtual', 'Híbrido')),
    estado VARCHAR(20) DEFAULT 'Programada' CHECK (estado IN ('Programada', 'Confirmada', 'En curso', 'Completada', 'Cancelada')),
    asistentes_esperados INTEGER DEFAULT 0,
    asistentes_registrados INTEGER DEFAULT 0,
    precio_entrada DECIMAL(10,2) DEFAULT 0,
    idioma VARCHAR(50) DEFAULT 'Español',
    nivel VARCHAR(20) DEFAULT 'Intermedio' CHECK (nivel IN ('Básico', 'Intermedio', 'Avanzado')),
    etiquetas TEXT, -- "IA, Educación, Tecnología"
    materiales_necesarios TEXT,
    certificacion_disponible BOOLEAN DEFAULT false,
    horas_certificacion DECIMAL(3,1) DEFAULT 0,
    organizador VARCHAR(200),
    requisitos_tecnicos JSONB, -- ["Proyector 4K", "Sistema de audio"]
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar conferencias superpuestas en la misma sala
    CONSTRAINT unique_sala_datetime UNIQUE (sala_id, fecha, hora_inicio),
    
    -- Constraint para validar que hora_fin sea posterior a hora_inicio
    CONSTRAINT valid_time_range CHECK (hora_fin > hora_inicio)
);

-- Tabla de registro de asistentes
CREATE TABLE IF NOT EXISTS registros_asistentes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conferencia_id UUID NOT NULL REFERENCES conferencias(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    estado_pago VARCHAR(20) DEFAULT 'Pendiente' CHECK (estado_pago IN ('Pendiente', 'Pagado', 'No requerido')),
    metodo_pago VARCHAR(50),
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observaciones TEXT,
    
    -- Un usuario no puede registrarse dos veces a la misma conferencia
    CONSTRAINT unique_user_conference UNIQUE (conferencia_id, usuario_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_rol ON user_profiles(rol);
CREATE INDEX IF NOT EXISTS idx_user_profiles_activo ON user_profiles(activo);

CREATE INDEX IF NOT EXISTS idx_ponentes_email ON ponentes(email);
CREATE INDEX IF NOT EXISTS idx_ponentes_especialidad ON ponentes(especialidad);
CREATE INDEX IF NOT EXISTS idx_ponentes_disponible ON ponentes(disponible);

CREATE INDEX IF NOT EXISTS idx_salas_codigo ON salas(codigo);
CREATE INDEX IF NOT EXISTS idx_salas_tipo ON salas(tipo);
CREATE INDEX IF NOT EXISTS idx_salas_disponible ON salas(disponible);

CREATE INDEX IF NOT EXISTS idx_conferencias_fecha ON conferencias(fecha);
CREATE INDEX IF NOT EXISTS idx_conferencias_ponente ON conferencias(ponente_id);
CREATE INDEX IF NOT EXISTS idx_conferencias_sala ON conferencias(sala_id);
CREATE INDEX IF NOT EXISTS idx_conferencias_categoria ON conferencias(categoria);
CREATE INDEX IF NOT EXISTS idx_conferencias_estado ON conferencias(estado);

CREATE INDEX IF NOT EXISTS idx_registros_conferencia ON registros_asistentes(conferencia_id);
CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros_asistentes(usuario_id);

-- Triggers para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_ponentes_updated_at
    BEFORE UPDATE ON ponentes
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_salas_updated_at
    BEFORE UPDATE ON salas
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

CREATE TRIGGER trigger_conferencias_updated_at
    BEFORE UPDATE ON conferencias
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- Políticas RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_asistentes ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles de usuario
CREATE POLICY "Usuarios pueden ver su propio perfil" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para usuarios autenticados (lectura y escritura)
CREATE POLICY "Usuarios autenticados pueden leer ponentes" ON ponentes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear ponentes" ON ponentes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar ponentes" ON ponentes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar ponentes" ON ponentes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas similares para salas
CREATE POLICY "Usuarios autenticados pueden leer salas" ON salas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear salas" ON salas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar salas" ON salas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar salas" ON salas
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para conferencias
CREATE POLICY "Usuarios autenticados pueden leer conferencias" ON conferencias
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear conferencias" ON conferencias
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar conferencias" ON conferencias
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar conferencias" ON conferencias
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para registros de asistentes
CREATE POLICY "Usuarios autenticados pueden leer registros" ON registros_asistentes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear registros" ON registros_asistentes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar registros" ON registros_asistentes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden eliminar registros" ON registros_asistentes
    FOR DELETE USING (auth.role() = 'authenticated');
