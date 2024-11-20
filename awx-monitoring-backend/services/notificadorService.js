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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gruposExcluidos = [
    'f0000',
    'f0071', 'f0603', 'f0661', 'f0662', 'f0663','f0664', 'f0665', 'f0668', 'f0299',
    'wst', 'pve','f0999'
  ];

export const getOutdatedFilialesAndHosts = async () => {
    try {
      const filiales = await Filial.findAll();
      const outdatedFiliales = [];
      const outdatedHosts = [];

      const counters = {
        wst: { actualizado: 0, pendiente: 0, fallido: 0 },
        cctv: { actualizado: 0, pendiente: 0, fallido: 0 },
        };
  
      for (const filial of filiales) {

        if (gruposExcluidos.includes(filial.name.toLowerCase())) {
            console.log(`Filial excluida del reporte: ${filial.name}`);
            continue;
          }

        const wstHosts = await Workstation.findAll({
          where: { 
            filial_id: filial.id, 
            enabled: true, 
            description: { [Op.notILike]: 'HP ProDesk 400%' } 
          },
          include: [
            {
              model: JobHostSummary,
              as: 'jobSummaries',
              attributes: ['job_name', 'failed', 'jobCreationDate'],
              required: false
            }
          ],
        });
  
        wstHosts.forEach(host => {
            const status = calculateHostStatus(host, 'wst');
            counters.wst[status] += 1;

            if (status !== 'actualizado') {
                outdatedHosts.push({
                    id: host.id,
                    name: host.name,
                    description: host.description,
                    filial_id: filial.id,
                    status,
                });

                if (!outdatedFiliales.some(f => f.id === filial.id)) {
                    outdatedFiliales.push({
                        id: filial.id,
                        name: filial.name,
                        description: filial.description,
                    });
                }
            }
        });
  
        const cctvHosts = await CCTV.findAll({
          where: { 
            filial_id: filial.id, 
            enabled: true 
          },
          include: [
            {
              model: JobHostSummary,
              as: 'jobSummaries',
              attributes: ['job_name', 'failed', 'jobCreationDate'],
              required: false
            }
          ],
        });
  
        cctvHosts.forEach(host => {
            const status = calculateHostStatus(host, 'cctv');
            counters.cctv[status] += 1;

            if (status !== 'actualizado') {
                outdatedHosts.push({
                    id: host.id,
                    name: host.name,
                    description: host.description,
                    filial_id: filial.id,
                    status,
                });

                if (!outdatedFiliales.some(f => f.id === filial.id)) {
                    outdatedFiliales.push({
                        id: filial.id,
                        name: filial.name,
                        description: filial.description,
                    });
                }
            }
        });
      }
  
      return { filiales: outdatedFiliales, hosts: outdatedHosts, counters };
    } catch (error) {
      console.error('Error al obtener filiales y hosts desactualizados:', error.message);
      throw new Error('Error al obtener filiales y hosts desactualizados');
    }
  };


  export const generateOutdatedReport = (filiales, hosts, counters) => {
    let report = '📋 Reporte de Filiales y Hosts Desactualizados:\n\n';
    
    report += `🔢 Resumen General:\n`;
    report += `- Hosts WST: Actualizados: ${counters.wst.actualizado}, Pendientes: ${counters.wst.pendiente}, Fallidos: ${counters.wst.fallido}\n`;
    report += `- Hosts CCTV: Actualizados: ${counters.cctv.actualizado}, Pendientes: ${counters.cctv.pendiente}, Fallidos: ${counters.cctv.fallido}\n\n`;
    
    filiales.forEach(filial => {
        report += `🏢 *Filial:* ${filial.name}\n`;
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

  export const generateAndSaveCSV = (filiales, hosts, counters, outputPath) => {
    try {
      const summaryRows = [
        { Type: 'Hosts WST', Actualizados: counters.wst.actualizado, Pendientes: counters.wst.pendiente, Fallidos: counters.wst.fallido },
        { Type: 'Hosts CCTV', Actualizados: counters.cctv.actualizado, Pendientes: counters.cctv.pendiente, Fallidos: counters.cctv.fallido },
      ];
  
      const hostRows = [];
      filiales.forEach(filial => {
        const filialHosts = hosts.filter(host => host.filial_id === filial.id);
        filialHosts.forEach(host => {
          hostRows.push({
            Filial: filial.name,
            Host: host.name,
            Estado: host.status,
          });
        });
      });
  
      const parser = new Parser();
      const csvSummary = parser.parse(summaryRows); 
      const csvHosts = parser.parse(hostRows);     
  
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
  
      const filePath = path.join(outputPath, `Reporte_Desactualizados_${Date.now()}.csv`);
      fs.writeFileSync(filePath, `${csvSummary}\n\n${csvHosts}`, 'utf8');
  
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
  