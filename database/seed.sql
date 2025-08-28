-- Datos de prueba para el Sistema de Gestión de Conferencias
-- Ejecutar después de schema.sql
-- NOTA: Los usuarios se crean usando el script create-user.js

-- Insertar ponentes de prueba
INSERT INTO ponentes (cedula, nombre, apellido, email, telefono, especialidad, biografia, institucion, cargo, pais, experiencia_anos, conferencias_impartidas, idiomas, disponible, tarifa_por_evento) VALUES
('12345678', 'Dr. Juan Carlos', 'Pérez García', 'juan.perez@universidad.edu', '+34 600 123 456', 'Inteligencia Artificial', 'Doctor en Ciencias de la Computación con más de 15 años de experiencia en IA y Machine Learning.', 'Universidad Complutense de Madrid', 'Profesor Titular', 'España', 15, 48, 'Español, Inglés, Francés', true, 2500),

('87654321', 'Dra. María Elena', 'Rodríguez López', 'maria.rodriguez@tech.com', '+52 55 987 654', 'Desarrollo Web', 'Ingeniera de Software especializada en tecnologías web modernas y arquitectura de sistemas.', 'Instituto Tecnológico de México', 'Directora de Tecnología', 'México', 12, 32, 'Español, Inglés', true, 2000),

('11223344', 'Dr. Robert', 'Johnson Smith', 'robert.johnson@mit.edu', '+1 617 253 1000', 'Ciberseguridad', 'Experto en seguridad informática y criptografía con publicaciones en revistas de alto impacto.', 'MIT - Massachusetts Institute of Technology', 'Profesor Asociado', 'Estados Unidos', 18, 56, 'Inglés, Alemán', false, 3500),

('55667788', 'Dra. Ana Sofía', 'Mendoza Ruiz', 'ana.mendoza@unisabana.edu.co', '+57 1 861 5555', 'Ciencia de Datos', 'Doctora en Estadística aplicada con experiencia en análisis de big data y machine learning.', 'Universidad de La Sabana', 'Investigadora Senior', 'Colombia', 10, 28, 'Español, Inglés, Portugués', true, 1800),

('99887766', 'Dr. Alessandro', 'Bianchi', 'alessandro.bianchi@polimi.it', '+39 02 2399 9999', 'IoT y Robótica', 'Ingeniero especializado en Internet de las Cosas y sistemas robóticos autónomos.', 'Politecnico di Milano', 'Profesor Ordinario', 'Italia', 14, 41, 'Italiano, Inglés, Español', true, 2200);

-- Insertar salas de prueba
INSERT INTO salas (nombre, codigo, ubicacion, capacidad, tipo, equipamiento, disponible, precio_por_hora, caracteristicas, descripcion, foto_url, contacto_responsable) VALUES
('Auditorio Principal', 'AUD-001', 'Edificio A - Planta 1', 300, 'Auditorio', 'Proyector 4K, Sistema de sonido, Micrófono inalámbrico, Aire acondicionado', true, 150, '{"tiene_proyector": true, "tiene_sonido": true, "tiene_microfono": true, "tiene_aire_acondicionado": true, "tiene_wifi": true, "es_accesible": true}', 'Auditorio principal con capacidad para 300 personas, equipado con la última tecnología audiovisual.', '/images/auditorio-principal.jpg', 'Carlos Martínez - ext. 2001'),

('Sala de Conferencias Alpha', 'CONF-A01', 'Edificio B - Planta 2', 80, 'Sala de conferencias', 'Smart TV 65", Sistema de videoconferencia, Mesa redonda, Aire acondicionado', true, 75, '{"tiene_proyector": true, "tiene_sonido": true, "tiene_microfono": true, "tiene_aire_acondicionado": true, "tiene_wifi": true, "es_accesible": true}', 'Sala moderna ideal para conferencias ejecutivas y presentaciones corporativas.', '/images/sala-alpha.jpg', 'Laura González - ext. 2002'),

('Laboratorio de Innovación', 'LAB-001', 'Edificio C - Planta 3', 45, 'Laboratorio', 'Estaciones de trabajo, Pizarra digital, Sistema colaborativo, Mobiliario flexible', false, 100, '{"tiene_proyector": true, "tiene_sonido": true, "tiene_microfono": false, "tiene_aire_acondicionado": true, "tiene_wifi": true, "es_accesible": true}', 'Espacio de trabajo colaborativo diseñado para talleres prácticos y sesiones de innovación.', '/images/lab-innovacion.jpg', 'Miguel Torres - ext. 2003'),

('Salón Beta', 'SAL-B01', 'Edificio A - Planta 2', 120, 'Salón', 'Proyector HD, Sistema de audio, Escenario, Iluminación profesional', true, 90, '{"tiene_proyector": true, "tiene_sonido": true, "tiene_microfono": true, "tiene_aire_acondicionado": true, "tiene_wifi": true, "es_accesible": false}', 'Salón versátil con escenario para presentaciones y eventos académicos medianos.', '/images/salon-beta.jpg', 'Patricia Vega - ext. 2004'),

('Aula Magna Virtual', 'VM-001', 'Edificio D - Planta 1', 200, 'Aula virtual', 'Sistema de streaming, Cámaras 360°, Audio profesional, Plataforma virtual', true, 120, '{"tiene_proyector": true, "tiene_sonido": true, "tiene_microfono": true, "tiene_aire_acondicionado": true, "tiene_wifi": true, "es_accesible": true}', 'Aula diseñada para eventos híbridos con capacidades de transmisión en vivo.', '/images/aula-virtual.jpg', 'Daniel Herrera - ext. 2005');

-- Insertar conferencias de prueba
-- Nota: Reemplaza los UUIDs con los IDs reales generados para ponentes y salas
INSERT INTO conferencias (titulo, codigo_evento, ponente_id, sala_id, fecha, hora_inicio, hora_fin, duracion, descripcion, categoria, tipo, estado, asistentes_esperados, asistentes_registrados, precio_entrada, idioma, nivel, etiquetas, materiales_necesarios, certificacion_disponible, horas_certificacion, organizador, requisitos_tecnicos) 
SELECT 
  'El Futuro de la Inteligencia Artificial en la Educación',
  'CONF-2024-001',
  p.id,
  s.id,
  '2024-09-15',
  '09:00',
  '10:30',
  90,
  'Exploraremos cómo la IA está transformando los métodos de enseñanza y aprendizaje, desde la personalización del contenido hasta la evaluación automatizada.',
  'Tecnología Educativa',
  'Presencial',
  'Confirmada',
  280,
  245,
  25,
  'Español',
  'Intermedio',
  'IA, Educación, Tecnología, Futuro',
  'Laptop, Cuaderno',
  true,
  1.5,
  'Departamento de Ciencias de la Computación',
  '["Proyector 4K", "Sistema de audio", "Conexión a internet"]'::jsonb
FROM ponentes p, salas s
WHERE p.cedula = '12345678' AND s.codigo = 'AUD-001';

INSERT INTO conferencias (titulo, codigo_evento, ponente_id, sala_id, fecha, hora_inicio, hora_fin, duracion, descripcion, categoria, tipo, estado, asistentes_esperados, asistentes_registrados, precio_entrada, idioma, nivel, etiquetas, materiales_necesarios, certificacion_disponible, horas_certificacion, organizador, requisitos_tecnicos) 
SELECT 
  'Desarrollo Frontend con React: Mejores Prácticas 2024',
  'CONF-2024-002',
  p.id,
  s.id,
  '2024-09-18',
  '14:00',
  '16:00',
  120,
  'Workshop práctico sobre las últimas tendencias en desarrollo React, incluyendo hooks avanzados, optimización de rendimiento y mejores prácticas de arquitectura.',
  'Desarrollo Web',
  'Híbrido',
  'Programada',
  70,
  58,
  35,
  'Español',
  'Avanzado',
  'React, Frontend, JavaScript, Web Development',
  'Laptop con Node.js instalado',
  true,
  2,
  'Comunidad de Desarrolladores Web',
  '["Smart TV", "Sistema de videoconferencia", "Micrófono"]'::jsonb
FROM ponentes p, salas s
WHERE p.cedula = '87654321' AND s.codigo = 'CONF-A01';

INSERT INTO conferencias (titulo, codigo_evento, ponente_id, sala_id, fecha, hora_inicio, hora_fin, duracion, descripcion, categoria, tipo, estado, asistentes_esperados, asistentes_registrados, precio_entrada, idioma, nivel, etiquetas, materiales_necesarios, certificacion_disponible, horas_certificacion, organizador, requisitos_tecnicos) 
SELECT 
  'Big Data y Analytics: Transformando Decisiones Empresariales',
  'CONF-2024-003',
  p.id,
  s.id,
  '2024-09-25',
  '16:00',
  '17:30',
  90,
  'Caso de estudio sobre implementación exitosa de soluciones de big data y analytics en empresas latinoamericanas.',
  'Data Science',
  'Presencial',
  'Confirmada',
  40,
  38,
  30,
  'Español',
  'Intermedio',
  'Big Data, Analytics, Business Intelligence, Data Science',
  'Laptop con Python',
  true,
  1.5,
  'Centro de Investigación en Data Science',
  '["Pizarra digital", "Estaciones de trabajo", "Sistema colaborativo"]'::jsonb
FROM ponentes p, salas s
WHERE p.cedula = '55667788' AND s.codigo = 'LAB-001';

INSERT INTO conferencias (titulo, codigo_evento, ponente_id, sala_id, fecha, hora_inicio, hora_fin, duracion, descripcion, categoria, tipo, estado, asistentes_esperados, asistentes_registrados, precio_entrada, idioma, nivel, etiquetas, materiales_necesarios, certificacion_disponible, horas_certificacion, organizador, requisitos_tecnicos) 
SELECT 
  'IoT y Smart Cities: Construyendo el Futuro Urbano',
  'CONF-2024-004',
  p.id,
  s.id,
  '2024-09-28',
  '10:00',
  '12:00',
  120,
  'Exploración de tecnologías IoT aplicadas al desarrollo de ciudades inteligentes y sostenibles.',
  'Internet de las Cosas',
  'Híbrido',
  'Programada',
  100,
  75,
  45,
  'Español',
  'Avanzado',
  'IoT, Smart Cities, Tecnología, Sostenibilidad',
  'Tablet o laptop',
  true,
  2,
  'Laboratorio de Ciudades Inteligentes',
  '["Proyector HD", "Sistema de audio", "Escenario", "Iluminación profesional"]'::jsonb
FROM ponentes p, salas s
WHERE p.cedula = '99887766' AND s.codigo = 'SAL-B01';

INSERT INTO conferencias (titulo, codigo_evento, ponente_id, sala_id, fecha, hora_inicio, hora_fin, duracion, descripcion, categoria, tipo, estado, asistentes_esperados, asistentes_registrados, precio_entrada, idioma, nivel, etiquetas, materiales_necesarios, certificacion_disponible, horas_certificacion, organizador, requisitos_tecnicos) 
SELECT 
  'Machine Learning Aplicado: De la Teoría a la Práctica',
  'CONF-2024-005',
  p.id,
  s.id,
  '2024-10-02',
  '09:00',
  '11:00',
  120,
  'Taller hands-on para implementar algoritmos de machine learning en casos de uso reales.',
  'Machine Learning',
  'Virtual',
  'Programada',
  180,
  156,
  50,
  'Español',
  'Intermedio',
  'Machine Learning, Python, AI, Práctica',
  'Python instalado, Jupyter Notebook',
  true,
  2,
  'Academia de Inteligencia Artificial',
  '["Sistema de streaming", "Plataforma virtual"]'::jsonb
FROM ponentes p, salas s
WHERE p.cedula = '12345678' AND s.codigo = 'VM-001';
