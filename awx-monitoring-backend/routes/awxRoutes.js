import express from 'express';
import { getGroups, getHosts } from '../controllers/awxController.js';

const router = express.Router();

router.get('/api/awx/inventories/:inventoryId/groups', getGroups);

router.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', getHosts);

export default router;
