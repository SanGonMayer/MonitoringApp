import { Router } from 'express';
import HostSnapshot from '../models/hostsSnapshot.js';
import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { processNovedades } from '../services/novedadesProcessor.js';
import Novedad from '../models/novedades.js';


const router = Router();

// Ruta para obtener los registros con motivo "Host agregado"
router.get('/agregados', async (req, res) => {
  try {
    // Definir el inicio y fin del día de hoy
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const agregados = await HostSnapshot.findAll({
      where: {
        motivo: {
          [Op.in]: ['Host agregado', 'Modificacion de deshabilitado a habilitado', 'Modificacion de filial']
        },
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        }
      },
      attributes: ['host_id', 'host_name', 'snapshot_date'],
      include: [
        {
          model: Filial,
          as: 'filial',
          attributes: ['name']
        },
        {
          model: Workstation,
          as:'workstation',
          attributes: ['status']
        },
        {
          model: CCTV,
          as: 'cctv',
          attributes: ['status']
        }
      ]
    });
    res.json(agregados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de Host agregado' });
  }
});

// Ruta para obtener los registros con motivo "Modificacion de habilitado a deshabilitado"
router.get('/deshabilitados', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const deshabilitados = await HostSnapshot.findAll({
      where: { 
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },        
        [Op.or]: [
          { motivo: 'Modificacion de habilitado a deshabilitado' },

          // Caso de movimiento: se modifica la filial y se registra old_filial_id (es decir, la máquina sale de la filial de origen)
          {
            [Op.and]: [
              { motivo: 'Modificacion de filial' },
              { old_filial_id: { [Op.ne]: null } }
            ]
          }
        ]
      },
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date'],
      include: [
        {
          model: Filial,
          as: 'filial',
          attributes: ['name']
        }
      ]
    });
    res.json(deshabilitados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de deshabilitados' });
  }
});

router.get('/filter', async (req, res) => {
  const { host_id, host_name, motivo, startDate, endDate } = req.query;
  const whereClause = {};
  
  if (host_id) {
    // Convertir host_id a número, si es necesario
    whereClause.host_id = host_id;
  }
  
  if (host_name) {
    whereClause.host_name = { [Op.like]: `%${host_name}%` };
  }
  
  if (motivo) {
    whereClause.motivo = motivo; // Asumiendo coincidencia exacta
  }
  
  if (startDate && endDate) {
    whereClause.snapshot_date = {
      [Op.gte]: new Date(startDate),
      [Op.lte]: new Date(endDate)
    };
  } else if (startDate) {
    // Si solo se proporciona la fecha de inicio, filtrar por ese día
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setHours(23, 59, 59, 999);
    whereClause.snapshot_date = {
      [Op.gte]: start,
      [Op.lte]: end
    };
  }
  
  try {
    const results = await HostSnapshot.findAll({
      where: whereClause,
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date', 'motivo'],
    });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al filtrar los datos' });
  }
});

router.get('/reemplazos', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Obtener las filiales en las que se registró una baja hoy.
    // Se consideran bajas:
    //   a) Directa: motivo "Modificacion de habilitado a deshabilitado"
    //   b) Por movimiento: motivo "Modificacion de filial" y old_filial_id no nulo
    const bajas = await HostSnapshot.findAll({
      attributes: [
        [
          sequelize.literal(`
            CASE 
              WHEN "motivo" = 'Modificacion de filial' AND "old_filial_id" IS NOT NULL 
              THEN "old_filial_id" 
              ELSE "filial_id" 
            END
          `),
          'bajaFilialId'
        ]
      ],
      where: {
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
        [Op.or]: [
          { motivo: 'Modificacion de habilitado a deshabilitado' },
          {
            [Op.and]: [
              { motivo: 'Modificacion de filial' },
              { old_filial_id: { [Op.ne]: null } }
            ]
          }
        ]
      },
      group: ['bajaFilialId']
    });
    const filialIdsConBaja = bajas.map(registro => registro.get('bajaFilialId'));

    // 2. Consultar los eventos de entrada, ya sea por "Host agregado" o "Modificacion de filial",
    // que se consideran reemplazo únicamente si la filial de ingreso está en la lista de filiales donde se registró baja.
    const reemplazos = await HostSnapshot.findAll({
      attributes: ['host_id', 'host_name', 'status'],
      where: {
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
        motivo: { [Op.in]: ['Host agregado', 'Modificacion de filial'] },
        // Únicamente se clasifica como reemplazo si la filial de ingreso tuvo baja
        filial_id: { [Op.in]: filialIdsConBaja }
      },
      include: [
        {
          model: Filial,
          as: 'filial',
          attributes: ['name']
        },
        {
          model: Workstation,
          as: 'workstation',
          attributes: ['status']
        }
      ]
    });

    res.json(reemplazos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de reemplazos' });
  }
});

router.get('/test-novedades', async (req, res) => {
  try {
    const novedades = await Novedad.findAll({
      order: [['snapshot_date', 'DESC']],
    });
    res.json(novedades);
  } catch (error) {
    console.error('Error obteniendo novedades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
