import { Router } from 'express';
import { GroupHostController, launchJobFilial } from '../controllers/awxController.js';
import { startDataSync } from '../app.js';
//import Filial from '../models/filiales.js';
import { getFilialesFromDB } from '../services/dbService.js';
import { getHostsByFilial, getHostsByFilialSNRO } from '../controllers/hostsController.js';
import { getFilialesConHosts } from '../services/dbService.js';
//import { updateSingleFilial } from '../controllers/syncController.js';
import { launchJob } from '../controllers/awxController.js';
import { sendTestTelegramMessage } from '../controllers/notifierController.js';
import { getLatestCSV } from '../services/notificadorService.js';
import { updateSingleFilial, syncDbFilialWithTemplate } from '../controllers/syncController.js';

export const awxRoutes = Router();

awxRoutes.get('/api/awx/inventories/:inventoryId/groups', GroupHostController.getGroups);
awxRoutes.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', GroupHostController.getHosts);

awxRoutes.post('/api/sync', async (req, res) => {
    try {
        await startDataSync();
        res.status(200).json({ message: 'Sincronización de datos completada.' });
    } catch (error) {
        console.error('Error en la sincronización manual:', error.message);
        res.status(500).json({ error: 'Error en la sincronización manual: ' + error.message });
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



/* ------------------- ACTUALIZACION AUTOMATICA DE DB A PARTIR DE SEÑAL DE AWX-------------- */
awxRoutes.post('/webhook', syncDbFilialWithTemplate);


export default awxRoutes;

