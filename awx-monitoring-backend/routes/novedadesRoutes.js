import { Router } from 'express';
import HostSnapshot from '../models/hostsSnapshot.js';
import { Op } from 'sequelize';


const router = Router();

// Ruta para obtener los registros con motivo "Host agregado"
router.get('/agregados', async (req, res) => {
  try {
    const agregados = await HostSnapshot.findAll({
      where: { motivo: 'Host agregado' },
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date']
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
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date']
    });
    res.json(deshabilitados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de deshabilitados' });
  }
});

export default router;
