const express = require('express');
const { supabase } = require('../config/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Obtener todas las conferencias
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      categoria, 
      tipo, 
      estado, 
      fecha_inicio, 
      fecha_fin,
      ponente_id,
      sala_id
    } = req.query;
    
    let query = supabase
      .from('conferencias')
      .select(`
        *,
        ponentes!inner(id, nombre, apellido, especialidad, institucion),
        salas!inner(id, nombre, codigo, ubicacion, capacidad)
      `)
      .neq('estado', 'Cancelada'); // Por defecto, no mostrar conferencias canceladas

    // Filtros
    if (search) {
      query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,categoria.ilike.%${search}%`);
    }

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    if (estado) {
      // Si se especifica un estado específico, remover el filtro por defecto y aplicar el solicitado
      if (estado === 'Cancelada') {
        query = supabase
          .from('conferencias')
          .select(`
            *,
            ponentes!inner(id, nombre, apellido, especialidad, institucion),
            salas!inner(id, nombre, codigo, ubicacion, capacidad)
          `)
          .eq('estado', estado);
          
        // Re-aplicar otros filtros
        if (search) {
          query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,categoria.ilike.%${search}%`);
        }
        if (categoria) {
          query = query.eq('categoria', categoria);
        }
        if (tipo) {
          query = query.eq('tipo', tipo);
        }
        if (fecha_inicio) {
          query = query.gte('fecha', fecha_inicio);
        }
        if (fecha_fin) {
          query = query.lte('fecha', fecha_fin);
        }
        if (ponente_id) {
          query = query.eq('ponente_id', ponente_id);
        }
        if (sala_id) {
          query = query.eq('sala_id', sala_id);
        }
      } else {
        query = query.eq('estado', estado);
      }
    }

    if (fecha_inicio) {
      query = query.gte('fecha', fecha_inicio);
    }

    if (fecha_fin) {
      query = query.lte('fecha', fecha_fin);
    }

    if (ponente_id) {
      query = query.eq('ponente_id', ponente_id);
    }

    if (sala_id) {
      query = query.eq('sala_id', sala_id);
    }

    // Paginación
    const offset = (page - 1) * limit;
    query = query
      .order('fecha', { ascending: false })
      .order('hora_inicio')
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Obtener count total para paginación
    let countQuery = supabase
      .from('conferencias')
      .select('*', { count: 'exact', head: true })
      .neq('estado', 'Cancelada'); // Por defecto, no contar las canceladas

    // Aplicar los mismos filtros al conteo
    if (search) {
      countQuery = countQuery.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,categoria.ilike.%${search}%`);
    }
    if (categoria) countQuery = countQuery.eq('categoria', categoria);
    if (tipo) countQuery = countQuery.eq('tipo', tipo);
    if (estado) {
      // Si se solicitan específicamente las canceladas, contar solo esas
      if (estado === 'Cancelada') {
        countQuery = supabase
          .from('conferencias')
          .select('*', { count: 'exact', head: true })
          .eq('estado', estado);
        // Re-aplicar filtros
        if (search) {
          countQuery = countQuery.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,categoria.ilike.%${search}%`);
        }
        if (categoria) countQuery = countQuery.eq('categoria', categoria);
        if (tipo) countQuery = countQuery.eq('tipo', tipo);
        if (fecha_inicio) countQuery = countQuery.gte('fecha', fecha_inicio);
        if (fecha_fin) countQuery = countQuery.lte('fecha', fecha_fin);
        if (ponente_id) countQuery = countQuery.eq('ponente_id', ponente_id);
        if (sala_id) countQuery = countQuery.eq('sala_id', sala_id);
      } else {
        countQuery = countQuery.eq('estado', estado);
      }
    }
    if (fecha_inicio) countQuery = countQuery.gte('fecha', fecha_inicio);
    if (fecha_fin) countQuery = countQuery.lte('fecha', fecha_fin);
    if (ponente_id) countQuery = countQuery.eq('ponente_id', ponente_id);
    if (sala_id) countQuery = countQuery.eq('sala_id', sala_id);

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    res.json({
      conferencias: data,
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

// Obtener conferencia por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: conferencia, error } = await supabase
      .from('conferencias')
      .select(`
        *,
        ponentes!inner(id, cedula, nombre, apellido, email, especialidad, biografia, institucion, cargo, pais, experiencia_anos, idiomas),
        salas!inner(id, nombre, codigo, ubicacion, capacidad, tipo, equipamiento, caracteristicas, descripcion, contacto_responsable)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Conferencia no encontrada' });
      }
      throw error;
    }

    res.json({ conferencia });
  } catch (error) {
    next(error);
  }
});

// Crear nueva conferencia
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      titulo,
      codigo_evento,
      ponente_id,
      sala_id,
      fecha,
      hora_inicio,
      hora_fin,
      duracion,
      descripcion,
      categoria,
      tipo = 'Presencial',
      estado = 'Programada',
      asistentes_esperados,
      precio_entrada = 0,
      idioma = 'Español',
      nivel = 'Intermedio',
      etiquetas,
      materiales_necesarios,
      certificacion_disponible = false,
      horas_certificacion = 0,
      organizador,
      requisitos_tecnicos
    } = req.body;

    // Validaciones
    if (!titulo || !ponente_id || !sala_id || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ 
        error: 'Los campos titulo, ponente_id, sala_id, fecha, hora_inicio y hora_fin son obligatorios' 
      });
    }

    // Verificar si el código del evento ya existe
    if (codigo_evento) {
      const { data: existingConferencia } = await supabase
        .from('conferencias')
        .select('id')
        .eq('codigo_evento', codigo_evento)
        .single();

      if (existingConferencia) {
        return res.status(400).json({ 
          error: 'Ya existe una conferencia con este código de evento' 
        });
      }
    }

    // Verificar que el ponente existe y está disponible
    const { data: ponente, error: ponenteError } = await supabase
      .from('ponentes')
      .select('id, disponible')
      .eq('id', ponente_id)
      .single();

    if (ponenteError || !ponente) {
      return res.status(404).json({ error: 'Ponente no encontrado' });
    }

    if (!ponente.disponible) {
      return res.status(400).json({ error: 'El ponente no está disponible' });
    }

    // Verificar que la sala existe y está disponible
    const { data: sala, error: salaError } = await supabase
      .from('salas')
      .select('id, disponible')
      .eq('id', sala_id)
      .single();

    if (salaError || !sala) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    if (!sala.disponible) {
      return res.status(400).json({ error: 'La sala no está disponible' });
    }

    // Verificar conflictos de horario para la sala
    const { data: conflictosSala, error: confSalaError } = await supabase
      .from('conferencias')
      .select('id, titulo, hora_inicio, hora_fin')
      .eq('sala_id', sala_id)
      .eq('fecha', fecha)
      .in('estado', ['Programada', 'Confirmada']);

    if (confSalaError) {
      throw confSalaError;
    }

    const tieneConflictoSala = conflictosSala.some(conf => {
      return (hora_inicio < conf.hora_fin && hora_fin > conf.hora_inicio);
    });

    if (tieneConflictoSala) {
      return res.status(400).json({ 
        error: 'La sala no está disponible en el horario solicitado',
        conflictos: conflictosSala.filter(conf => 
          hora_inicio < conf.hora_fin && hora_fin > conf.hora_inicio
        )
      });
    }

    // Verificar conflictos de horario para el ponente
    const { data: conflictosPonente, error: confPonError } = await supabase
      .from('conferencias')
      .select('id, titulo, hora_inicio, hora_fin')
      .eq('ponente_id', ponente_id)
      .eq('fecha', fecha)
      .in('estado', ['Programada', 'Confirmada']);

    if (confPonError) {
      throw confPonError;
    }

    const tieneConflictoPonente = conflictosPonente.some(conf => {
      return (hora_inicio < conf.hora_fin && hora_fin > conf.hora_inicio);
    });

    if (tieneConflictoPonente) {
      return res.status(400).json({ 
        error: 'El ponente no está disponible en el horario solicitado',
        conflictos: conflictosPonente.filter(conf => 
          hora_inicio < conf.hora_fin && hora_fin > conf.hora_inicio
        )
      });
    }

    // Calcular duración si no se proporciona
    let duracionCalculada = duracion;
    if (!duracionCalculada) {
      const inicio = new Date(`2024-01-01 ${hora_inicio}`);
      const fin = new Date(`2024-01-01 ${hora_fin}`);
      duracionCalculada = Math.round((fin - inicio) / (1000 * 60)); // minutos
    }

    const { data, error } = await supabase
      .from('conferencias')
      .insert({
        titulo,
        codigo_evento: codigo_evento || `CONF-${Date.now()}`,
        ponente_id,
        sala_id,
        fecha,
        hora_inicio,
        hora_fin,
        duracion: duracionCalculada,
        descripcion,
        categoria,
        tipo,
        estado,
        asistentes_esperados,
        asistentes_registrados: 0,
        precio_entrada: parseFloat(precio_entrada),
        idioma,
        nivel,
        etiquetas,
        materiales_necesarios,
        certificacion_disponible,
        horas_certificacion: parseFloat(horas_certificacion),
        organizador,
        requisitos_tecnicos
      })
      .select(`
        *,
        ponentes!inner(id, nombre, apellido, especialidad),
        salas!inner(id, nombre, codigo, ubicacion)
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Conferencia creada exitosamente',
      conferencia: data
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar conferencia
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      codigo_evento,
      ponente_id,
      sala_id,
      fecha,
      hora_inicio,
      hora_fin,
      duracion,
      descripcion,
      categoria,
      tipo,
      estado,
      asistentes_esperados,
      precio_entrada,
      idioma,
      nivel,
      etiquetas,
      materiales_necesarios,
      certificacion_disponible,
      horas_certificacion,
      organizador,
      requisitos_tecnicos
    } = req.body;

    // Verificar si la conferencia existe
    const { data: existingConferencia, error: checkError } = await supabase
      .from('conferencias')
      .select('id, codigo_evento, ponente_id, sala_id, fecha, hora_inicio, hora_fin')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Conferencia no encontrada' });
      }
      throw checkError;
    }

    // Verificar si el código del evento ya existe en otra conferencia
    if (codigo_evento && codigo_evento !== existingConferencia.codigo_evento) {
      const { data: duplicateCode } = await supabase
        .from('conferencias')
        .select('id')
        .eq('codigo_evento', codigo_evento)
        .neq('id', id)
        .single();

      if (duplicateCode) {
        return res.status(400).json({ 
          error: 'Ya existe otra conferencia con este código de evento' 
        });
      }
    }

    // Si se cambian ponente, sala, fecha u horarios, verificar conflictos
    const cambiaHorario = (
      ponente_id && ponente_id !== existingConferencia.ponente_id
    ) || (
      sala_id && sala_id !== existingConferencia.sala_id
    ) || (
      fecha && fecha !== existingConferencia.fecha
    ) || (
      hora_inicio && hora_inicio !== existingConferencia.hora_inicio
    ) || (
      hora_fin && hora_fin !== existingConferencia.hora_fin
    );

    if (cambiaHorario) {
      const nuevoPonente = ponente_id || existingConferencia.ponente_id;
      const nuevaSala = sala_id || existingConferencia.sala_id;
      const nuevaFecha = fecha || existingConferencia.fecha;
      const nuevoInicio = hora_inicio || existingConferencia.hora_inicio;
      const nuevoFin = hora_fin || existingConferencia.hora_fin;

      // Verificar conflictos de sala
      if (sala_id && sala_id !== existingConferencia.sala_id) {
        const { data: sala, error: salaError } = await supabase
          .from('salas')
          .select('id, disponible')
          .eq('id', sala_id)
          .single();

        if (salaError || !sala || !sala.disponible) {
          return res.status(400).json({ error: 'Sala no válida o no disponible' });
        }
      }

      const { data: conflictosSala, error: confSalaError } = await supabase
        .from('conferencias')
        .select('id, titulo, hora_inicio, hora_fin')
        .eq('sala_id', nuevaSala)
        .eq('fecha', nuevaFecha)
        .in('estado', ['Programada', 'Confirmada'])
        .neq('id', id);

      if (confSalaError) {
        throw confSalaError;
      }

      const tieneConflictoSala = conflictosSala.some(conf => {
        return (nuevoInicio < conf.hora_fin && nuevoFin > conf.hora_inicio);
      });

      if (tieneConflictoSala) {
        return res.status(400).json({ 
          error: 'La sala no está disponible en el horario solicitado'
        });
      }

      // Verificar conflictos de ponente
      if (ponente_id && ponente_id !== existingConferencia.ponente_id) {
        const { data: ponente, error: ponenteError } = await supabase
          .from('ponentes')
          .select('id, disponible')
          .eq('id', ponente_id)
          .single();

        if (ponenteError || !ponente || !ponente.disponible) {
          return res.status(400).json({ error: 'Ponente no válido o no disponible' });
        }
      }

      const { data: conflictosPonente, error: confPonError } = await supabase
        .from('conferencias')
        .select('id, titulo, hora_inicio, hora_fin')
        .eq('ponente_id', nuevoPonente)
        .eq('fecha', nuevaFecha)
        .in('estado', ['Programada', 'Confirmada'])
        .neq('id', id);

      if (confPonError) {
        throw confPonError;
      }

      const tieneConflictoPonente = conflictosPonente.some(conf => {
        return (nuevoInicio < conf.hora_fin && nuevoFin > conf.hora_inicio);
      });

      if (tieneConflictoPonente) {
        return res.status(400).json({ 
          error: 'El ponente no está disponible en el horario solicitado'
        });
      }
    }

    // Calcular duración si se cambian los horarios
    let duracionCalculada = duracion;
    if ((hora_inicio || hora_fin) && !duracion) {
      const inicio = new Date(`2024-01-01 ${hora_inicio || existingConferencia.hora_inicio}`);
      const fin = new Date(`2024-01-01 ${hora_fin || existingConferencia.hora_fin}`);
      duracionCalculada = Math.round((fin - inicio) / (1000 * 60));
    }

    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (codigo_evento !== undefined) updateData.codigo_evento = codigo_evento;
    if (ponente_id !== undefined) updateData.ponente_id = ponente_id;
    if (sala_id !== undefined) updateData.sala_id = sala_id;
    if (fecha !== undefined) updateData.fecha = fecha;
    if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
    if (hora_fin !== undefined) updateData.hora_fin = hora_fin;
    if (duracionCalculada !== undefined) updateData.duracion = duracionCalculada;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (categoria !== undefined) updateData.categoria = categoria;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (estado !== undefined) updateData.estado = estado;
    if (asistentes_esperados !== undefined) updateData.asistentes_esperados = asistentes_esperados;
    if (precio_entrada !== undefined) updateData.precio_entrada = parseFloat(precio_entrada);
    if (idioma !== undefined) updateData.idioma = idioma;
    if (nivel !== undefined) updateData.nivel = nivel;
    if (etiquetas !== undefined) updateData.etiquetas = etiquetas;
    if (materiales_necesarios !== undefined) updateData.materiales_necesarios = materiales_necesarios;
    if (certificacion_disponible !== undefined) updateData.certificacion_disponible = certificacion_disponible;
    if (horas_certificacion !== undefined) updateData.horas_certificacion = parseFloat(horas_certificacion);
    if (organizador !== undefined) updateData.organizador = organizador;
    if (requisitos_tecnicos !== undefined) updateData.requisitos_tecnicos = requisitos_tecnicos;

    updateData.fecha_actualizacion = new Date();

    const { data, error } = await supabase
      .from('conferencias')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        ponentes!inner(id, nombre, apellido, especialidad),
        salas!inner(id, nombre, codigo, ubicacion)
      `)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Conferencia actualizada exitosamente',
      conferencia: data
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar conferencia
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si la conferencia tiene registros de asistentes
    const { data: registros, error: regError } = await supabase
      .from('registros_asistentes')
      .select('id')
      .eq('conferencia_id', id);

    if (regError) {
      throw regError;
    }

    if (registros && registros.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la conferencia porque tiene asistentes registrados' 
      });
    }

    const { data, error } = await supabase
      .from('conferencias')
      .update({ 
        estado: 'Cancelada',
        fecha_actualizacion: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Conferencia no encontrada' });
      }
      throw error;
    }

    res.json({
      message: 'Conferencia cancelada exitosamente',
      conferencia: data
    });
  } catch (error) {
    next(error);
  }
});

// Obtener categorías disponibles
router.get('/meta/categorias', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('conferencias')
      .select('categoria')
      .not('estado', 'eq', 'Cancelada');

    if (error) {
      throw error;
    }

    const categorias = [...new Set(data.map(c => c.categoria))].filter(Boolean);
    
    res.json({ categorias });
  } catch (error) {
    next(error);
  }
});

// Obtener conferencias por fecha
router.get('/calendario/:fecha', async (req, res, next) => {
  try {
    const { fecha } = req.params;

    const { data, error } = await supabase
      .from('conferencias')
      .select(`
        *,
        ponentes!inner(id, nombre, apellido, especialidad),
        salas!inner(id, nombre, codigo, ubicacion)
      `)
      .eq('fecha', fecha)
      .in('estado', ['Programada', 'Confirmada', 'En curso'])
      .order('hora_inicio');

    if (error) {
      throw error;
    }

    res.json({ conferencias: data });
  } catch (error) {
    next(error);
  }
});

// Registrar asistencia a conferencia
router.post('/:id/registrar-asistencia', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usuario_id, metodo_pago = 'Efectivo', observaciones } = req.body;

    // Verificar que la conferencia existe y está disponible
    const { data: conferencia, error: confError } = await supabase
      .from('conferencias')
      .select('id, titulo, asistentes_esperados, asistentes_registrados, precio_entrada, estado')
      .eq('id', id)
      .single();

    if (confError) {
      if (confError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Conferencia no encontrada' });
      }
      throw confError;
    }

    if (!['Programada', 'Confirmada'].includes(conferencia.estado)) {
      return res.status(400).json({ 
        error: 'No se puede registrar asistencia a esta conferencia' 
      });
    }

    // Verificar cupos disponibles
    if (conferencia.asistentes_registrados >= conferencia.asistentes_esperados) {
      return res.status(400).json({ 
        error: 'No hay cupos disponibles para esta conferencia' 
      });
    }

    // Verificar si el usuario ya está registrado
    const { data: existingRegistro } = await supabase
      .from('registros_asistentes')
      .select('id')
      .eq('conferencia_id', id)
      .eq('usuario_id', usuario_id || req.user.id)
      .single();

    if (existingRegistro) {
      return res.status(400).json({ 
        error: 'El usuario ya está registrado para esta conferencia' 
      });
    }

    // Crear registro de asistencia
    const { data: registro, error: regError } = await supabase
      .from('registros_asistentes')
      .insert({
        conferencia_id: id,
        usuario_id: usuario_id || req.user.id,
        estado_pago: conferencia.precio_entrada > 0 ? 'Pendiente' : 'No requerido',
        metodo_pago: conferencia.precio_entrada > 0 ? metodo_pago : null,
        monto_pagado: conferencia.precio_entrada,
        observaciones
      })
      .select()
      .single();

    if (regError) {
      throw regError;
    }

    // Actualizar contador de asistentes
    const { error: updateError } = await supabase
      .from('conferencias')
      .update({ 
        asistentes_registrados: conferencia.asistentes_registrados + 1,
        fecha_actualizacion: new Date()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    res.status(201).json({
      message: 'Asistencia registrada exitosamente',
      registro
    });
  } catch (error) {
    next(error);
  }
});

// Obtener estadísticas generales
router.get('/estadisticas/generales', auth, async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    let query = supabase
      .from('conferencias')
      .select('id, estado, asistentes_registrados, precio_entrada');

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

    const estadisticas = {
      total_conferencias: data.length,
      programadas: data.filter(c => c.estado === 'Programada').length,
      confirmadas: data.filter(c => c.estado === 'Confirmada').length,
      completadas: data.filter(c => c.estado === 'Completada').length,
      canceladas: data.filter(c => c.estado === 'Cancelada').length,
      total_asistentes: data.reduce((sum, c) => sum + (c.asistentes_registrados || 0), 0),
      ingresos_estimados: data.reduce((sum, c) => sum + ((c.asistentes_registrados || 0) * (c.precio_entrada || 0)), 0)
    };

    res.json({ estadisticas });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
