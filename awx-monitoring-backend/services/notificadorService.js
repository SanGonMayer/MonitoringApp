import fetch from 'node-fetch';
import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import { Op } from 'sequelize';

export const getOutdatedFilialesAndHosts = async () => {
  try {
    const filiales = await Filial.findAll();
    const outdatedFiliales = [];
    const outdatedHosts = [];

    for (const filial of filiales) {
      const wstHosts = await Workstation.findAll({
        where: { filial_id: filial.id, status: { [Op.ne]: 'actualizado' } }
      });

      const cctvHosts = await CCTV.findAll({
        where: { filial_id: filial.id, status: { [Op.ne]: 'actualizado' } }
      });

      if (wstHosts.length > 0 || cctvHosts.length > 0) {
        outdatedFiliales.push({
          id: filial.id,
          name: filial.name,
          description: filial.description,
        });

        wstHosts.forEach(host => outdatedHosts.push({ ...host.dataValues }));
        cctvHosts.forEach(host => outdatedHosts.push({ ...host.dataValues }));
      }
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
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      throw new Error('TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no están definidos en el archivo .env');
    }

    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: report,
        parse_mode: 'Markdown'
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la respuesta de Telegram: ${response.statusText}`);
    }

    console.log('Reporte enviado por Telegram correctamente.');
  } catch (error) {
    console.error('Error al enviar el reporte por Telegram:', error.message);
  }
};
