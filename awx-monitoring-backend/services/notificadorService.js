import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import JobHostSummary from '../models/jobHostSummary.js';
import { calculateHostStatus } from '../utils/hostStatus.js';
import { Op } from 'sequelize';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

export const getOutdatedFilialesAndHosts = async () => {
    try {
      const filiales = await Filial.findAll();
      const outdatedFiliales = [];
      const outdatedHosts = [];
  
      for (const filial of filiales) {
        // Obtener y procesar hosts WST
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
  
        // Obtener y procesar hosts CCTV
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
  
      return { filiales: outdatedFiliales, hosts: outdatedHosts };
    } catch (error) {
      console.error('Error al obtener filiales y hosts desactualizados:', error.message);
      throw new Error('Error al obtener filiales y hosts desactualizados');
    }
  };


export const generateOutdatedReport = (filiales, hosts) => {
  let report = '📋 Reporte de Filiales y Hosts Desactualizados:\n\n';
  filiales.forEach(filial => {
    report += `🏢 *Filial:* ${filial.name} (${filial.description})\n`;
    hosts
      .filter(host => host.filial_id === filial.id)
      .forEach(host => {
        report += `  - 🖥️ Host: ${host.name} (Status: ${host.status})\n`;
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
