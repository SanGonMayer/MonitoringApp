import { Router } from 'express';
import HostSnapshot from '../models/hostsSnapshot.js';
import Filial from '../models/filiales.js';
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
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date'],
      include: [
        {
          model: Filial,
          as: 'filial',
          attributes: ['name']
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
    const deshabilitados = await HostSnapshot.findAll({
      where: { motivo: 'Modificacion de habilitado a deshabilitado' },
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
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date']
    });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al filtrar los datos' });
  }
});

export default router;
