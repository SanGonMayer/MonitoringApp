import { Router } from 'express';
import { GroupHostController } from '../controllers/awxController.js';
import { syncAllData } from '../services/syncService.js';

export const awxRoutes = Router();

awxRoutes.get('/api/awx/inventories/:inventoryId/groups', GroupHostController.getGroups);
awxRoutes.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', GroupHostController.getHosts);

awxRoutes.post('/api/sync', async (req, res) => {
    try {
        await syncAllData();
        res.status(200).json({ message: 'Sincronización de datos completada.' });
    } catch (error) {
        console.error('Error en la sincronización manual:', error.message);
        res.status(500).json({ error: 'Error en la sincronización manual: ' + error.message });
    }
});z

export default awxRoutes;

