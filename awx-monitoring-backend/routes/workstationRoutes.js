const express = require('express');
const Workstation = require('../models/Workstation');  // Importa el modelo

const router = express.Router();

// Ruta para crear una nueva workstation
router.post('/workstations', async (req, res) => {
  try {
    const { hostname, lastVersionApplied, status } = req.body;
    const newWorkstation = await Workstation.create({ hostname, lastVersionApplied, status });
    res.json(newWorkstation);
  } catch (err) {
    res.status(500).json({ error: 'Error creando la workstation' });
  }
});

// Ruta para obtener todas las workstations
router.get('/workstations', async (req, res) => {
  try {
    const workstations = await Workstation.findAll();
    res.json(workstations);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo las workstations' });
  }
});

module.exports = router;
