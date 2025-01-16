import { Router } from 'express';
import { GroupHostController, launchJobFilial } from '../controllers/awxController.js';
import { startDataSync } from '../app.js';
//import Filial from '../models/filiales.js';
import { getFilialesFromDB } from '../services/dbService.js';
import { getHostsByFilial, getHostsByFilialSNRO } from '../controllers/hostsController.js';
import { getFilialesConHosts } from '../services/dbService.js';
import { updateSingleFilial } from '../controllers/syncController.js';
import { launchJob } from '../controllers/awxController.js';
import { sendTestTelegramMessage } from '../controllers/notifierController.js';
import { getLatestCSV } from '../services/notificadorService.js';
import {generateSnapshotChangeReport} from '../services/notificadorService.js';

export const awxRoutes = Router();

awxRoutes.get('/api/awx/inventories/:inventoryId/groups', GroupHostController.getGroups);
awxRoutes.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', GroupHostController.getHosts);

awxRoutes.post('/api/sync', async (req, res) => {
    try {
        await startDataSync();
        res.status(200).json({ message: 'Sincronización de datos completada.' });
        const { takeDailySnapshot } = await import('../services/snapshotService.js');
        takeDailySnapshot()
          .then(() => console.log('Snapshot diario completado.'))
          .catch((error) => console.error('Error al tomar snapshot diario:', error.message));
    } catch (error) {
        console.error('Error en la sincronización manual:', error.message);
        if(!res.headersSent){
        res.status(500).json({ error: 'Error en la sincronización manual: ' + error.message });
    }
  }
});

awxRoutes.get('/api/db/filiales', async (req, res) => {
    try {
      const filiales = await getFilialesFromDB();
      res.json(filiales);
    } catch (error) {
      console.error('Error al obtener filiales:', error.message);
      res.status(500).json({ error: 'Error al obtener filiales' });
    }
});

awxRoutes.get('/api/db/filiales/:filialId/hosts', getHostsByFilial);



/* ------------------------------------------------ */

awxRoutes.get('/api/db/filiales/:tipoTerminal', async (req, res) => {
  const { tipoTerminal } = req.params;
  try{
      const filiales = await getFilialesConHosts(tipoTerminal);
      res.json(filiales);
  }catch (error){
    console.log('Error al obtener filiales de CCTV', error.message);
    res.status(500).json({ error: 'Error al obtener filiales'});
  }
})

awxRoutes.post('/api/sync/filial/:filialId', updateSingleFilial);
awxRoutes.post('/api/awx/launch-job', (req, res, next) => {
  console.log("Ruta /api/awx/launch-job alcanzada");
  next();
}, launchJob);


awxRoutes.get('/api/db/filiales/:filialId/hosts/srno', getHostsByFilialSNRO);

awxRoutes.post('/api/test-telegram', sendTestTelegramMessage);

awxRoutes.get('/download-latest-csv', getLatestCSV);

//---------------

awxRoutes.post('/api/awx/launch-job-filial', (req, res, next) => {
  console.log("Ruta /api/awx/launch-job-filial alcanzada");
  next();
}, launchJobFilial);


awxRoutes.get('/test', (req, res) => {
  res.send('La ruta está funcionando');
});

awxRoutes.post('/api/validate-credentials', (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.USUARIO_PARCIAL &&
    password === process.env.PASSWORD_PARCIAL
  ) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
});

import path from 'path';

awxRoutes.post('/api/generateSnapshotChangeReport', async (req, res) => {
  const outputPath = path.join(__dirname, 'reports'); 
  const startDate = new Date().toISOString().split('T')[0]; 

  try {
    const reportPath = await generateSnapshotChangeReport(startDate, outputPath);
    res.status(200).json({
      message: 'Reporte generado exitosamente.',
      reportPath,
    });
  } catch (error) {
    console.error('Error al generar el reporte:', error.message);
    res.status(500).json({ error: 'Error al generar el reporte: ' + error.message });
  }
});




export default awxRoutes;

