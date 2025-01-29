import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import JobHostSummary from '../models/jobHostSummary.js';
import { calculateHostStatus } from '../utils/hostStatus.js';
import { Op } from 'sequelize';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import HostSnapshot from '../models/hostsSnapshot.js';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gruposExcluidos = [
    'f0000',
    'f0071', 'f0603', 'f0661', 'f0662', 'f0664', 'f0665', 'f0668', 'f0299',
    'wst', 'pve','f0999'
  ];

  export const getOutdatedFilialesAndHosts = async (type) => {
    try {
      const filiales = await Filial.findAll();
      const outdatedFiliales = [];
      const outdatedHosts = [];
  
      const counters = { actualizado: 0, pendiente: 0, fallido: 0 };
      const filialCounters = {};
  
      const isWst = type === 'wst';
      const HostModel = isWst ? Workstation : CCTV;
  
      for (const filial of filiales) {
        if (gruposExcluidos.includes(filial.name.toLowerCase())) {
          console.log(`Filial excluida del reporte: ${filial.name}`);
          continue;
        }
  
        filialCounters[filial.id] = {
          [`total${type.toUpperCase()}`]: 0,
          [`pendientes${type.toUpperCase()}`]: 0,
          [`fallidos${type.toUpperCase()}`]: 0,
          [`desactualizados${type.toUpperCase()}`]: 0,
        };
  
        const hosts = await HostModel.findAll({
          where: {
            filial_id: filial.id,
            enabled: true,
            ...(isWst && { description: { [Op.notILike]: 'HP ProDesk 400%' } }),
          },
          include: [
            {
              model: JobHostSummary,
              as: 'jobSummaries',
              attributes: ['job_name', 'failed', 'jobCreationDate'],
              required: false,
            },
          ],
        });
  
        hosts.forEach((host) => {
          const status = calculateHostStatus(host, type);
          counters[status] += 1;
  
          filialCounters[filial.id][`total${type.toUpperCase()}`] += 1;
          if (status === 'pendiente') filialCounters[filial.id][`pendientes${type.toUpperCase()}`] += 1;
          if (status === 'fallido') filialCounters[filial.id][`fallidos${type.toUpperCase()}`] += 1;
          filialCounters[filial.id][`desactualizados${type.toUpperCase()}`] =
            filialCounters[filial.id][`pendientes${type.toUpperCase()}`] +
            filialCounters[filial.id][`fallidos${type.toUpperCase()}`];
  
          if (status !== 'actualizado') {
            outdatedHosts.push({
              id: host.id,
              name: host.name,
              description: host.description,
              filial_id: filial.id,
              status,
            });
  
            if (!outdatedFiliales.some((f) => f.id === filial.id)) {
              outdatedFiliales.push({
                id: filial.id,
                name: filial.name,
                description: filial.description,
              });
            }
          }
        });
      }
  
      return { filiales: outdatedFiliales, hosts: outdatedHosts, counters, filialCounters };
    } catch (error) {
      console.error(`Error al obtener filiales y hosts ${type.toUpperCase()} desactualizados:`, error.message);
      throw error;
    }
  };
  


  export const generateOutdatedReport = (filiales, hosts, counters, filialCounters, type) => {
    let report = '📋 Reporte de Filiales y Hosts Desactualizados:\n\n';
    
    report += `🔢 Resumen General:\n`;
    report += `- Hosts: Actualizados: ${counters.actualizado}, Pendientes: ${counters.pendiente}, Fallidos: ${counters.fallido}\n`;
    
    filiales.forEach(filial => {
        const countersForFilial = filialCounters[filial.id];

        report += `🏢 *Filial:* ${filial.name}\n`;
        report += `  - Total Hosts: ${countersForFilial[`total${type.toUpperCase()}`] || 0}\n`;
        report += `    - Pendientes: ${countersForFilial[`pendientes${type.toUpperCase()}`] || 0}\n`;
        report += `    - Fallidos: ${countersForFilial[`fallidos${type.toUpperCase()}`] || 0}\n`;
        report += `    - Total Desactualizados: ${countersForFilial[`desactualizados${type.toUpperCase()}`] || 0}\n`;
        
        hosts
            .filter(host => host.filial_id === filial.id)
            .forEach(host => {
                report += `  - Host: ${host.name} - Estado: ${host.status}\n`;
            });
        report += '\n';
    });
    
    return report;
};


export const sendReportViaTelegram = async (report) => {
    try {
      const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramChatIds = process.env.TELEGRAM_CHAT_ID.split(',');
  
      if (!telegramBotToken || !telegramChatIds.length) {
        throw new Error('TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están definidos en el archivo .env');
      }
  
      const httpsProxyAgent = new HttpsProxyAgent('http://10.1.1.89:3128');
      const httpProxyAgent = new HttpProxyAgent('http://10.1.1.89:3128');
  
      const getProxyAgent = (url) => {
        return url.startsWith('https') ? httpsProxyAgent : httpProxyAgent;
      };
  
      for (const chatId of telegramChatIds) {
        const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            text: report,
            parse_mode: 'Markdown',
          }),
          agent: getProxyAgent(url), 
        });
  
        if (!response.ok) {
          console.error(`Error al enviar reporte a chat ID ${chatId}:`, response.statusText);
        } else {
          console.log(`Reporte enviado correctamente a chat ID ${chatId}.`);
        }
      }
    } catch (error) {
      console.error('Error al enviar el reporte por Telegram:', error.message);
    }
  };

  export const generateAndSaveCSV = (filiales, hosts, counters, filialCounters, outputPath, type) => {
    try {
      const rows = []; 
  

      rows.push(['Resumen Global:']);
      rows.push(['Type', 'Actualizados', 'Pendientes', 'Fallidos']);
      rows.push(['Hosts', counters.actualizado, counters.pendiente, counters.fallido]);
      rows.push([]); 
  
      filiales.forEach((filial) => {
        const countersForFilial = filialCounters[filial.id]; 
  
        rows.push([`Filial: ${filial.name}`]);
        rows.push(['Total Hosts ', 'Pendientes ', 'Fallidos ', 'Desactualizados ']);
        rows.push([
            countersForFilial[`total${type.toUpperCase()}`] || 0,
            countersForFilial[`pendientes${type.toUpperCase()}`] || 0,
            countersForFilial[`fallidos${type.toUpperCase()}`] || 0,
            countersForFilial[`desactualizados${type.toUpperCase()}`] || 0,
          ]);
        rows.push([]); 
  
        rows.push(['Host', 'Estado']);
        const filialHosts = hosts.filter((host) => host.filial_id === filial.id);
        filialHosts.forEach((host) => {
          rows.push([host.name, host.status]);
        });
        rows.push([]); 
      });
  
      const csvContent = rows.map((row) => row.join(',')).join('\n');
  
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
  
      const filePath = path.join(outputPath, `Reporte_Desactualizados_${Date.now()}.csv`);
  
      fs.writeFileSync(filePath, csvContent, 'utf8');
  
      console.log(`CSV generado y guardado en: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error al generar el CSV:', error.message);
      throw new Error('Error al generar el CSV');
    }
  };
  

  export const getLatestCSV = (req, res) => {
    try {
      const reportsPath = path.join(__dirname, '../reports'); 
      if (!fs.existsSync(reportsPath)) {
        return res.status(404).send('No se encontraron reportes.');
      }
  
      const files = fs.readdirSync(reportsPath)
        .filter(file => file.endsWith('.csv'))
        .map(file => ({
          name: file,
          time: fs.statSync(path.join(reportsPath, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);
  
      if (files.length === 0) {
        return res.status(404).send('No se encontraron reportes.');
      }
  
      const latestFile = files[0].name;
      const filePath = path.join(reportsPath, latestFile);
  
      res.download(filePath, latestFile, (err) => {
        if (err) {
          console.error('Error al descargar el archivo:', err);
          res.status(500).send('Error al descargar el archivo.');
        }
      });
    } catch (error) {
      console.error('Error al obtener el CSV más reciente:', error.message);
      res.status(500).send('Error al obtener el CSV más reciente.');
    }
  };


  export const generateSnapshotChangeReport = async (startDate, outputPath) => {
    try {
      console.log('📊 Generando reporte de cambios en snapshots...');
      console.log(`🔍 Filtrando snapshots entre ${startOfDay} y ${endOfDay}`);

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0); 
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); 
  
      const changedSnapshots = await HostSnapshot.findAll({
        where: {
          snapshot_date: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
        include: [
          {
            model: Filial,
            as: 'filial', 
            attributes: ['name'], 
          },
        ],
        order: [['snapshot_date', 'DESC']],
      });
  
      if (changedSnapshots.length === 0) {
        console.log('🔍 No se encontraron cambios recientes en snapshots.');
        throw new Error('No hay cambios recientes para generar un reporte.');
      }
  
      // Estructurar los datos para el CSV
      const rows = changedSnapshots.map(snapshot => ({
        HostID: snapshot.host_id,
        HostName: snapshot.host_name,
        Status: snapshot.status,
        Enabled: snapshot.enabled,
        InventoryID: snapshot.inventory_id,
        FilialName: snapshot.filial?.name,
        Motivo: snapshot.motivo,
        SnapshotDate: snapshot.snapshot_date,
      }));
  
      // Convertir a CSV
      const parser = new Parser({ fields: Object.keys(rows[0]) });
      const csvContent = parser.parse(rows);
  
      // Asegurar que el directorio de reportes existe
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
  
      // Guardar el CSV
      const filePath = path.join(outputPath, `Snapshot_Changes_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      fs.writeFileSync(filePath, csvContent, 'utf8');
  
      console.log(`✅ CSV de cambios generado en: ${filePath}`);
      return { filePath, snapshots: changedSnapshots };
    } catch (error) {
      console.error('❌ Error al generar el reporte de cambios en snapshots:', error.message);
      throw new Error('Error al generar el reporte de cambios en snapshots.');
    }
  };


const groupSnapshotsByReason = (snapshots) => {
  const groupedChanges = {
    addedHosts: [],
    enabledToDisabled: [],
    disabledToEnabled: [],
    pendingToUpdated: [],
    pendingToFailed: [],
    failedToUpdated: [],
    otherChanges: [],
  };

  snapshots.forEach((snapshot) => {
    switch (snapshot.motivo) {
      case 'Host agregado':
        groupedChanges.addedHosts.push(snapshot);
        break;
      case 'Modificacion de habilitado a deshabilitado':
        groupedChanges.enabledToDisabled.push(snapshot);
        break;
      case 'Modificacion de deshabilitado a habilitado':
        groupedChanges.disabledToEnabled.push(snapshot);
        break;
      case 'Modificacion de estado pendiente a actualizado':
        groupedChanges.pendingToUpdated.push(snapshot);
        break;
      case 'Modificacion de estado pendiente a fallido':
        groupedChanges.pendingToFailed.push(snapshot);
        break;
      case 'Modificacion de estado fallido a actualizado':
        groupedChanges.failedToUpdated.push(snapshot);
        break;
      default:
        groupedChanges.otherChanges.push(snapshot);
        break;
    }
  });

  return groupedChanges;
}

const formatHosts = (hosts) =>
  hosts
    .map(
      (host) =>
        `host_id: '${host.host_id}', host_name: '${host.host_name}', Filial: '${host.filial_id}', Inventario: '${host.inventory_id}', Estado: '${host.status}'`
    )
    .join('\n');


const generateSectionHtml = (title, hosts) => {
  if (hosts.length === 0) return '';
  return `### ${title}: ###\n${formatHosts(hosts)}`;
};


export const generateEmailBodyHtml = (snapshots) => {

  const groupedChanges = groupSnapshotsByReason(snapshots);

  const generateSectionHtml = (title, hosts) => {
    if (hosts.length === 0) return '';
    const hostList = hosts
      .map(
        (host) =>
          `<li>host_id: '${host.host_id}', host_name: '${host.host_name}', Filial: '${host.filial?.name || 'Desconocido'}', Inventario: '${host.inventory_id}', Estado: '${host.status}'</li>`
      )
      .join('');
    return `<h3 style="font-weight: bold;">${title}</h3><ul>${hostList}</ul>`;
  };

  const sectionsHtml = [
    generateSectionHtml('HOSTS NUEVOS', groupedChanges.addedHosts),
    generateSectionHtml('HOSTS DESHABILITADOS', groupedChanges.enabledToDisabled),
    generateSectionHtml('HOSTS HABILITADOS', groupedChanges.disabledToEnabled),
    generateSectionHtml('HOSTS ACTUALIZADOS DESDE PENDIENTE', groupedChanges.pendingToUpdated),
    generateSectionHtml('HOSTS FALLIDOS DESDE PENDIENTE', groupedChanges.pendingToFailed),
    generateSectionHtml('HOSTS ACTUALIZADOS DESDE FALLIDO', groupedChanges.failedToUpdated),
    generateSectionHtml('OTROS CAMBIOS', groupedChanges.otherChanges),
  ];

  const bodyHtml = sectionsHtml.filter((section) => section.trim() !== '').join('<br>');

  return `
    <div style="font-family: 'Comic', bold; font-size: 14px;">
      ${bodyHtml || '<p>No se detectaron cambios en los hosts.</p>'}
    </div>
  `;
};



  export const sendReportByEmail = async (filePath, recipientEmails, emailBodyHtml) => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
  
      const mailOptions = {
        from: `"Santiago Gonzalez Mayer" <${process.env.SMTP_USER}>`,
        to: Array.isArray(recipientEmails) ? recipientEmails.join(',') : recipientEmails,
        subject: 'Reporte de Cambios en Snapshots',
        html: emailBodyHtml,
        //text: 'Adjunto se encuentra el reporte de cambios en los hosts en el día de la fecha.',
        attachments: [
          {
            filename: path.basename(filePath),
            path: filePath,
          },
        ],
      };
  
      await transporter.sendMail(mailOptions);
      console.log('✅ Correo enviado exitosamente.');
    } catch (error) {
      console.error('❌ Error al enviar el correo:', error.message);
      throw new Error('Error al enviar el correo.');
    }
  };
  

  