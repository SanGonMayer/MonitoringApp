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
import nodemailer from 'nodemailer';
import fs from 'fs';
import { sendReportByEmail } from '../services/notificadorService.js';
import { generateEmailBodyHtml } from '../services/notificadorService.js';
import { HostSnapshot } from '../models/hostsSnapshot.js'


export const awxRoutes = Router();

awxRoutes.get('/api/awx/inventories/:inventoryId/groups', GroupHostController.getGroups);
awxRoutes.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', GroupHostController.getHosts);

awxRoutes.post('/api/sync', async (req, res) => {
    try {
        await startDataSync();
        res.status(200).json({ message: 'Sincronización de datos completada.' });
        const { takeDailySnapshot } = await import('../services/snapshotService.js');

        await takeDailySnapshot(); 
        console.log('✅ Snapshot diario completado.');
        
                  // Generar reporte y enviar correo
        const { generateSnapshotChangeReport } = await import('../services/notificadorService.js');
        const { generateEmailBodyHtml } = await import('../services/notificadorService.js');
        const { sendReportByEmail } = await import('../services/notificadorService.js');

        const startDate = new Date();
        const outputPath = './reports'; // Ruta donde se guarda el CSV
        const recipientEmails = ['segmayer@bancocredicoop.coop'];

        // Generar el reporte y obtener los snapshots
        const { filePath, snapshots } = await generateSnapshotChangeReport(startDate, outputPath);
        console.log('✅ Reporte generado.');

        // Generar el cuerpo del email
        const emailBodyHtml = generateEmailBodyHtml(snapshots);

        // Enviar el correo
        await sendReportByEmail(filePath, recipientEmails, emailBodyHtml);
        console.log('✅ Correo enviado.');
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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

awxRoutes.post('/test-email', async (req, res) => {
  const { recipientEmails } = req.body;

  if (!recipientEmails || recipientEmails.length === 0) {
    return res.status(400).json({ error: 'Debes proporcionar al menos un correo.' });
  }

  try {
    // Ruta al archivo CSV ficticio
    const filePath = path.join(__dirname, 'reports', 'Snapshot_Changes_Test.csv');

    // Generar un archivo CSV ficticio si no existe
    if (!fs.existsSync(filePath)) {
      const mockCsvData = [
        { HostID: 'wst-1', HostName: 'Host1', Status: 'pendiente', Enabled: true, InventoryID: '22', FilialName: 'Filial1', Motivo: 'Host agregado', SnapshotDate: new Date() },
        { HostID: 'wst-2', HostName: 'Host2', Status: 'actualizado', Enabled: false, InventoryID: '23', FilialName: 'Filial2', Motivo: 'Modificacion de habilitado a deshabilitado', SnapshotDate: new Date() },
        { HostID: 'wst-3', HostName: 'Host3', Status: 'pendiente', Enabled: true, InventoryID: '22', FilialName: 'Filial3', Motivo: 'Modificacion de estado pendiente a actualizado', SnapshotDate: new Date() },
        { HostID: 'wst-4', HostName: 'Host4', Status: 'fallido', Enabled: false, InventoryID: '347', FilialName: 'Filial4', Motivo: 'Modificacion de estado fallido a actualizado', SnapshotDate: new Date() },
        { HostID: 'wst-5', HostName: 'Host5', Status: 'actualizado', Enabled: true, InventoryID: '347', FilialName: 'Filial5', Motivo: 'Modificacion de inventario', SnapshotDate: new Date() },
      ];
      const csvContent = [
        'HostID,HostName,Status,Enabled,InventoryID,FilialName,Motivo,SnapshotDate',
        ...mockCsvData.map(row => Object.values(row).join(',')),
      ].join('\n');
      fs.writeFileSync(filePath, csvContent, 'utf8');
    }

    // Datos ficticios para todos los casos de modificación
    const snapshots = [
      {
        host_id: 'wst-1',
        host_name: 'Host1',
        status: 'pendiente',
        enabled: true,
        inventory_id: '22',
        filial: { name: 'Filial2' },
        motivo: 'Host agregado',
        snapshot_date: new Date(),
      },
      {
        host_id: 'wst-2',
        host_name: 'Host2',
        status: 'actualizado',
        enabled: false,
        inventory_id: '23',
        filial: { name: 'Filial2' },
        motivo: 'Modificacion de habilitado a deshabilitado',
        snapshot_date: new Date(),
      },
      {
        host_id: 'wst-3',
        host_name: 'Host3',
        status: 'actualizado',
        enabled: true,
        inventory_id: '22',
        filial: { name: 'Filial3' },
        motivo: 'Modificacion de estado pendiente a actualizado',
        snapshot_date: new Date(),
      },
      {
        host_id: 'wst-4',
        host_name: 'Host4',
        status: 'actualizado',
        enabled: false,
        inventory_id: '347',
        filial: { name: 'Filial4' },
        motivo: 'Modificacion de estado fallido a actualizado',
        snapshot_date: new Date(),
      },
      {
        host_id: 'wst-5',
        host_name: 'Host5',
        status: 'actualizado',
        enabled: true,
        inventory_id: '22',
        filial: { name: 'Filial5' },
        motivo: 'Modificacion de inventario',
        snapshot_date: new Date(),
      },
    ];

    // Generar cuerpo del correo
    const emailBodyHtml = generateEmailBodyHtml(snapshots);

    // Enviar el correo
    await sendReportByEmail(filePath, recipientEmails, emailBodyHtml);

    return res.status(200).json({ message: 'Correo de prueba enviado exitosamente.' });
  } catch (error) {
    console.error('❌ Error al enviar el correo de prueba:', error.message);
    return res.status(500).json({ error: 'Error al enviar el correo de prueba.' });
  }
});

//ruta para armar el anillo cuando hay movimientos
awxRoutes.get('/api/filiales-con-movimientos', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const filialesMovidas = await HostSnapshot.findAll({
      where: {
        snapshot_date: { [Op.gte]: today }, 
      },
      attributes: ['filial_id'],
      group: ['filial_id'], 
    });

    const filialIds = filialesMovidas.map((snapshot) => snapshot.filial_id);

    res.status(200).json({ filialesConMovimientos: filialIds });
  } catch (error) {
    console.error('Error al obtener filiales con movimientos:', error.message);
    res.status(500).json({ error: 'Error al obtener filiales con movimientos.' });
  }
});





export default awxRoutes;

