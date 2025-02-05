import { Router } from 'express';
import HostSnapshot from '../models/hostsSnapshot.js';
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

export default router;
