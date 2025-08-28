const express = require('express');
const { supabase } = require('../config/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Obtener todas las salas
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, tipo, disponible, capacidad_min, capacidad_max } = req.query;
    
    let query = supabase
      .from('salas')
      .select('*');

    // Filtros
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%,ubicacion.ilike.%${search}%`);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    if (disponible !== undefined) {
      query = query.eq('disponible', disponible === 'true');
    }

    if (capacidad_min) {
      query = query.gte('capacidad', parseInt(capacidad_min));
    }

    if (capacidad_max) {
      query = query.lte('capacidad', parseInt(capacidad_max));
    }

    // Paginación
    const offset = (page - 1) * limit;
    query = query
      .order('nombre')
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Obtener count total para paginación
    let countQuery = supabase
      .from('salas')
      .select('*', { count: 'exact', head: true });

    // Aplicar los mismos filtros al conteo
    if (search) {
      countQuery = countQuery.or(`nombre.ilike.%${search}%,codigo.ilike.%${search}%,ubicacion.ilike.%${search}%`);
    }
    if (tipo) countQuery = countQuery.eq('tipo', tipo);
    if (disponible !== undefined) countQuery = countQuery.eq('disponible', disponible === 'true');
    if (capacidad_min) countQuery = countQuery.gte('capacidad', parseInt(capacidad_min));
    if (capacidad_max) countQuery = countQuery.lte('capacidad', parseInt(capacidad_max));

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      salas: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Obtener sala por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: sala, error } = await supabase
      .from('salas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Sala no encontrada' });
      }
      throw error;
    }

    res.json({ sala });
  } catch (error) {
    next(error);
  }
});

// Crear nueva sala
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      nombre,
      codigo,
      ubicacion,
      capacidad,
      tipo,
      equipamiento,
      disponible = true,
      precio_por_hora,
      caracteristicas = {},
      descripcion,
      foto_url,
      contacto_responsable
    } = req.body;

    // Validaciones
    if (!nombre || !codigo || !ubicacion || !capacidad || !tipo) {
      return res.status(400).json({ 
        error: 'Los campos nombre, código, ubicación, capacidad y tipo son obligatorios' 
      });
    }

    // Verificar si el código ya existe
    const { data: existingSala } = await supabase
      .from('salas')
      .select('id')
      .eq('codigo', codigo)
      .single();

    if (existingSala) {
      return res.status(400).json({ 
        error: 'Ya existe una sala con este código' 
      });
    }

    const { data, error } = await supabase
      .from('salas')
      .insert({
        nombre,
        codigo,
        ubicacion,
        capacidad: parseInt(capacidad),
        tipo,
        equipamiento,
        disponible,
        precio_por_hora: precio_por_hora ? parseFloat(precio_por_hora) : null,
        caracteristicas,
        descripcion,
        foto_url,
        contacto_responsable
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Sala creada exitosamente',
      sala: data
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar sala
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      codigo,
      ubicacion,
      capacidad,
      tipo,
      equipamiento,
      disponible,
      precio_por_hora,
      caracteristicas,
      descripcion,
      foto_url,
      contacto_responsable
    } = req.body;

    // Verificar si la sala existe
    const { data: existingSala, error: checkError } = await supabase
      .from('salas')
      .select('id, codigo')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Sala no encontrada' });
      }
      throw checkError;
    }

    // Verificar si el código ya existe en otra sala
    if (codigo && codigo !== existingSala.codigo) {
      const { data: duplicateCode } = await supabase
        .from('salas')
        .select('id')
        .eq('codigo', codigo)
        .neq('id', id)
        .single();

      if (duplicateCode) {
        return res.status(400).json({ 
          error: 'Ya existe otra sala con este código' 
        });
      }
    }

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (codigo !== undefined) updateData.codigo = codigo;
    if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    if (capacidad !== undefined) updateData.capacidad = parseInt(capacidad);
    if (tipo !== undefined) updateData.tipo = tipo;
    if (equipamiento !== undefined) updateData.equipamiento = equipamiento;
    if (disponible !== undefined) updateData.disponible = disponible;
    if (precio_por_hora !== undefined) updateData.precio_por_hora = precio_por_hora ? parseFloat(precio_por_hora) : null;
    if (caracteristicas !== undefined) updateData.caracteristicas = caracteristicas;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (foto_url !== undefined) updateData.foto_url = foto_url;
    if (contacto_responsable !== undefined) updateData.contacto_responsable = contacto_responsable;

    updateData.fecha_actualizacion = new Date();

    const { data, error } = await supabase
      .from('salas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Sala actualizada exitosamente',
      sala: data
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar sala (soft delete)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si la sala tiene conferencias asociadas
    const { data: conferencias, error: confError } = await supabase
      .from('conferencias')
      .select('id')
      .eq('sala_id', id)
      .in('estado', ['Programada', 'Confirmada']);

    if (confError) {
      throw confError;
    }

    if (conferencias && conferencias.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la sala porque tiene conferencias programadas o confirmadas' 
      });
    }

    // Realizar soft delete
    const { data, error } = await supabase
      .from('salas')
      .update({ 
        disponible: false,
        fecha_actualizacion: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Sala no encontrada' });
      }
      throw error;
    }

    res.json({
      message: 'Sala desactivada exitosamente',
      sala: data
    });
  } catch (error) {
    next(error);
  }
});

// Obtener tipos de sala disponibles
router.get('/meta/tipos', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('salas')
      .select('tipo')
      .eq('disponible', true);

    if (error) {
      throw error;
    }

    const tipos = [...new Set(data.map(s => s.tipo))].filter(Boolean);
    
    res.json({ tipos });
  } catch (error) {
    next(error);
  }
});

// Verificar disponibilidad de sala para fecha y horario específico
router.post('/verificar-disponibilidad', async (req, res, next) => {
  try {
    const { sala_id, fecha, hora_inicio, hora_fin, conferencia_id = null } = req.body;

    if (!sala_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ 
        error: 'Los campos sala_id, fecha, hora_inicio y hora_fin son obligatorios' 
      });
    }

    let query = supabase
      .from('conferencias')
      .select('id, titulo, hora_inicio, hora_fin')
      .eq('sala_id', sala_id)
      .eq('fecha', fecha)
      .in('estado', ['Programada', 'Confirmada']);

    // Excluir la conferencia actual si es una actualización
    if (conferencia_id) {
      query = query.neq('id', conferencia_id);
    }

    const { data: conferenciasExistentes, error } = await query;

    if (error) {
      throw error;
    }

    // Verificar conflictos de horario
    const conflictos = conferenciasExistentes.filter(conf => {
      const inicioExistente = conf.hora_inicio;
      const finExistente = conf.hora_fin;
      
      // Verificar solapamiento de horarios
      return (hora_inicio < finExistente && hora_fin > inicioExistente);
    });

    const disponible = conflictos.length === 0;

    res.json({
      disponible,
      conflictos: conflictos.map(conf => ({
        id: conf.id,
        titulo: conf.titulo,
        hora_inicio: conf.hora_inicio,
        hora_fin: conf.hora_fin
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Obtener salas disponibles para fecha y horario específico
router.post('/disponibles', async (req, res, next) => {
  try {
    const { fecha, hora_inicio, hora_fin, capacidad_min, tipo, conferencia_id = null } = req.body;

    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ 
        error: 'Los campos fecha, hora_inicio y hora_fin son obligatorios' 
      });
    }

    // Obtener todas las salas disponibles
    let salasQuery = supabase
      .from('salas')
      .select('*')
      .eq('disponible', true);

    if (capacidad_min) {
      salasQuery = salasQuery.gte('capacidad', parseInt(capacidad_min));
    }

    if (tipo) {
      salasQuery = salasQuery.eq('tipo', tipo);
    }

    const { data: todasLasSalas, error: salasError } = await salasQuery;

    if (salasError) {
      throw salasError;
    }

    // Verificar disponibilidad de cada sala
    const salasDisponibles = [];

    for (const sala of todasLasSalas) {
      let confQuery = supabase
        .from('conferencias')
        .select('id, titulo, hora_inicio, hora_fin')
        .eq('sala_id', sala.id)
        .eq('fecha', fecha)
        .in('estado', ['Programada', 'Confirmada']);

      // Excluir la conferencia actual si es una actualización
      if (conferencia_id) {
        confQuery = confQuery.neq('id', conferencia_id);
      }

      const { data: conferenciasExistentes, error: confError } = await confQuery;

      if (confError) {
        throw confError;
      }

      // Verificar conflictos de horario
      const tieneConflicto = conferenciasExistentes.some(conf => {
        return (hora_inicio < conf.hora_fin && hora_fin > conf.hora_inicio);
      });

      if (!tieneConflicto) {
        salasDisponibles.push(sala);
      }
    }

    res.json({
      salas: salasDisponibles,
      total: salasDisponibles.length
    });
  } catch (error) {
    next(error);
  }
});

// Obtener estadísticas de uso de salas
router.get('/estadisticas/uso', auth, async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let query = supabase
      .from('conferencias')
      .select(`
        sala_id,
        salas!inner(nombre, codigo, tipo),
        duracion
      `)
      .in('estado', ['Completada', 'Confirmada']);

    if (fecha_inicio) {
      query = query.gte('fecha', fecha_inicio);
    }

    if (fecha_fin) {
      query = query.lte('fecha', fecha_fin);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Agrupar por sala y calcular estadísticas
    const estadisticas = {};
    
    data.forEach(conf => {
      const salaId = conf.sala_id;
      const sala = conf.salas;
      
      if (!estadisticas[salaId]) {
        estadisticas[salaId] = {
          sala: {
            id: salaId,
            nombre: sala.nombre,
            codigo: sala.codigo,
            tipo: sala.tipo
          },
          total_conferencias: 0,
          total_horas: 0
        };
      }
      
      estadisticas[salaId].total_conferencias++;
      estadisticas[salaId].total_horas += conf.duracion || 0;
    });

    const resultado = Object.values(estadisticas)
      .sort((a, b) => b.total_conferencias - a.total_conferencias);

    res.json({ estadisticas: resultado });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
