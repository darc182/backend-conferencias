const express = require('express');
const { supabase } = require('../config/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Obtener todos los ponentes
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, especialidad, disponible, pais } = req.query;
    
    let query = supabase
      .from('ponentes')
      .select('*');

    // Filtros
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,especialidad.ilike.%${search}%`);
    }

    if (especialidad) {
      query = query.eq('especialidad', especialidad);
    }

    if (disponible !== undefined) {
      query = query.eq('disponible', disponible === 'true');
    }

    if (pais) {
      query = query.eq('pais', pais);
    }

    // Paginación
    const offset = (page - 1) * limit;
    query = query
      .order('nombre')
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Obtener count total para paginación
    const { count: totalCount, error: countError } = await supabase
      .from('ponentes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    res.json({
      ponentes: data,
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

// Obtener ponente por ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: ponente, error } = await supabase
      .from('ponentes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Ponente no encontrado' });
      }
      throw error;
    }

    res.json({ ponente });
  } catch (error) {
    next(error);
  }
});

// Crear nuevo ponente
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      cedula,
      nombre,
      apellido,
      email,
      telefono,
      especialidad,
      biografia,
      institucion,
      cargo,
      pais,
      experiencia_anos,
      conferencias_impartidas = 0,
      idiomas,
      disponible = true,
      tarifa_por_evento
    } = req.body;

    // Validaciones
    if (!cedula || !nombre || !apellido || !email || !especialidad) {
      return res.status(400).json({ 
        error: 'Los campos cedula, nombre, apellido, email y especialidad son obligatorios' 
      });
    }

    // Verificar si la cedula ya existe
    const { data: existingPonente } = await supabase
      .from('ponentes')
      .select('id')
      .eq('cedula', cedula)
      .single();

    if (existingPonente) {
      return res.status(400).json({ 
        error: 'Ya existe un ponente con esta cédula' 
      });
    }

    // Verificar si el email ya existe
    const { data: existingEmail } = await supabase
      .from('ponentes')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ 
        error: 'Ya existe un ponente con este email' 
      });
    }

    const { data, error } = await supabase
      .from('ponentes')
      .insert({
        cedula,
        nombre,
        apellido,
        email,
        telefono,
        especialidad,
        biografia,
        institucion,
        cargo,
        pais,
        experiencia_anos,
        conferencias_impartidas,
        idiomas,
        disponible,
        tarifa_por_evento
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      message: 'Ponente creado exitosamente',
      ponente: data
    });
  } catch (error) {
    next(error);
  }
});

// Actualizar ponente
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      cedula,
      nombre,
      apellido,
      email,
      telefono,
      especialidad,
      biografia,
      institucion,
      cargo,
      pais,
      experiencia_anos,
      conferencias_impartidas,
      idiomas,
      disponible,
      tarifa_por_evento
    } = req.body;

    // Verificar si el ponente existe
    const { data: existingPonente, error: checkError } = await supabase
      .from('ponentes')
      .select('id, cedula, email')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Ponente no encontrado' });
      }
      throw checkError;
    }

    // Verificar si la cedula ya existe en otro ponente
    if (cedula && cedula !== existingPonente.cedula) {
      const { data: duplicateCedula } = await supabase
        .from('ponentes')
        .select('id')
        .eq('cedula', cedula)
        .neq('id', id)
        .single();

      if (duplicateCedula) {
        return res.status(400).json({ 
          error: 'Ya existe otro ponente con esta cédula' 
        });
      }
    }

    // Verificar si el email ya existe en otro ponente
    if (email && email !== existingPonente.email) {
      const { data: duplicateEmail } = await supabase
        .from('ponentes')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (duplicateEmail) {
        return res.status(400).json({ 
          error: 'Ya existe otro ponente con este email' 
        });
      }
    }

    const updateData = {};
    if (cedula !== undefined) updateData.cedula = cedula;
    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellido !== undefined) updateData.apellido = apellido;
    if (email !== undefined) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (especialidad !== undefined) updateData.especialidad = especialidad;
    if (biografia !== undefined) updateData.biografia = biografia;
    if (institucion !== undefined) updateData.institucion = institucion;
    if (cargo !== undefined) updateData.cargo = cargo;
    if (pais !== undefined) updateData.pais = pais;
    if (experiencia_anos !== undefined) updateData.experiencia_anos = experiencia_anos;
    if (conferencias_impartidas !== undefined) updateData.conferencias_impartidas = conferencias_impartidas;
    if (idiomas !== undefined) updateData.idiomas = idiomas;
    if (disponible !== undefined) updateData.disponible = disponible;
    if (tarifa_por_evento !== undefined) updateData.tarifa_por_evento = tarifa_por_evento;

    updateData.fecha_actualizacion = new Date();

    const { data, error } = await supabase
      .from('ponentes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Ponente actualizado exitosamente',
      ponente: data
    });
  } catch (error) {
    next(error);
  }
});

// Eliminar ponente (soft delete)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si el ponente tiene conferencias asociadas
    const { data: conferencias, error: confError } = await supabase
      .from('conferencias')
      .select('id')
      .eq('ponente_id', id);

    if (confError) {
      throw confError;
    }

    if (conferencias && conferencias.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el ponente porque tiene conferencias asociadas' 
      });
    }

    // Realizar soft delete
    const { data, error } = await supabase
      .from('ponentes')
      .update({ 
        disponible: false,
        fecha_actualizacion: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Ponente no encontrado' });
      }
      throw error;
    }

    res.json({
      message: 'Ponente desactivado exitosamente',
      ponente: data
    });
  } catch (error) {
    next(error);
  }
});

// Obtener especialidades disponibles
router.get('/meta/especialidades', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('ponentes')
      .select('especialidad')
      .eq('disponible', true);

    if (error) {
      throw error;
    }

    const especialidades = [...new Set(data.map(p => p.especialidad))].filter(Boolean);
    
    res.json({ especialidades });
  } catch (error) {
    next(error);
  }
});

// Obtener países disponibles
router.get('/meta/paises', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('ponentes')
      .select('pais')
      .eq('disponible', true);

    if (error) {
      throw error;
    }

    const paises = [...new Set(data.map(p => p.pais))].filter(Boolean);
    
    res.json({ paises });
  } catch (error) {
    next(error);
  }
});

// Obtener ponentes disponibles para una fecha específica
router.get('/disponibles/:fecha', async (req, res, next) => {
  try {
    const { fecha } = req.params;
    
    // Obtener ponentes que no tienen conferencias en esa fecha
    const { data, error } = await supabase
      .from('ponentes')
      .select(`
        *,
        conferencias!inner(id, fecha)
      `)
      .eq('disponible', true)
      .neq('conferencias.fecha', fecha);

    if (error) {
      throw error;
    }

    res.json({ ponentes: data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
