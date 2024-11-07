import { Router } from 'express';
import { GroupHostController } from '../controllers/awxController.js';
import { startDataSync } from '../app.js';
//import Filial from '../models/filiales.js';
import { getFilialesFromDB } from '../services/dbService.js';
import { getHostsByFilial } from '../controllers/hostsController.js';
import { getFilialesConHosts } from '../services/dbService.js';
import { updateSingleFilial } from '../controllers/syncController.js';

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

export default awxRoutes;

