import { Router } from 'express';
import HostSnapshot from '../models/hostsSnapshot.js';
import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import { Op } from 'sequelize';


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
        motivo: 'Host agregado',
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
      where: { motivo: 'Modificacion de habilitado a deshabilitado',
                snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        }
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
    // Se considera baja el motivo "Modificacion de habilitado a deshabilitado".
    const bajas = await HostSnapshot.findAll({
      attributes: ['filial_id'],
      where: {
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
        motivo: 'Modificacion de habilitado a deshabilitado'
      },
      group: ['filial_id']
    });
    const filialIdsConBaja = bajas.map(registro => registro.filial_id);

    // 2. Consultar los eventos de entrada, ya sea por "Host agregado" o "Modificacion de filial",
    // que cumplan alguna de las siguientes condiciones:
    //   - Que tengan old_filial_id definido (lo que indica que provienen de otra filial).
    //   - O que la filial de ingreso (filial_id) esté en la lista de filiales donde se registró baja.
    const reemplazos = await HostSnapshot.findAll({
      attributes: ['host_id', 'host_name', 'status'],
      where: {
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
        motivo: { [Op.in]: ['Host agregado', 'Modificacion de filial'] },
        [Op.or]: [
          { old_filial_id: { [Op.ne]: null } },
          { filial_id: { [Op.in]: filialIdsConBaja } }
        ]
      },
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
        }
      ]
    });

    res.json(reemplazos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de reemplazos' });
  }
});

export default router;
