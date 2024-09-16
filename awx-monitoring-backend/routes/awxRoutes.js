const express = require('express');
const Workstation = require('../models/Workstation');  // Importa el modelo

const router = express.Router();

// Ruta para crear una nueva workstation
router.post('/workstations', async (req, res) => {
  try {
    const { hostname, lastVersionApplied, status } = req.body;
    const newWorkstation = await Workstation.create({ hostname, lastVersionApplied, status });
    res.json(newWorkstation);lo 
  } catch (err) {
    res.status(500).json({ error: 'Error creando la workstation' });
  }
});

// Ruta para obtener todas las workstations
router.get('/workstations', async (req, res) => {
  try {
    // Obtener los datos desde la API de AWX
    const response = await axios.get('http://api-awx-url/v2/hosts/', {
      headers: {
        Authorization: 'Bearer tu-token-de-autenticación',
      },
    });

    let hosts = response.data.results;  // Datos de los hosts (workstations)

    // Limitar los hosts a solo los primeros 10
    hosts = hosts.slice(0, 10);

    // Filtra y prepara solo la información que queremos exponer
    const filteredHosts = hosts.map(host => ({
      hostname: host.name,
      status: host.summary_fields.last_job.status,  // Estado del host
      lastVersion: host.summary_fields.last_job.job_template_name  // Última versión aplicada
    }));

    // Enviar los hosts filtrados como respuesta JSON
    res.json(filteredHosts);

  } catch (error) {
    console.error('Error obteniendo datos de AWX:', error);
    res.status(500).json({ error: 'Error obteniendo datos de AWX' });
  }
});


module.exports = router;
