import sequelize from '../config/database.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import TotalHostsPorFilial from '../models/totalHostsPorFilial.js';
import Filial from '../models/filiales.js';
import { sendReportViaTelegram } from './notificadorService.js';

export const notifyTotalHostsComparison = async () => {
  try {
    // 1. Obtener el total actual de hosts por filial en Workstation y CCTV
    const wstCounts = await Workstation.findAll({
      attributes: [
        'filial_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'wstCount']
      ],
      group: ['filial_id'],
      raw: true,
    });

    const cctvCounts = await CCTV.findAll({
      attributes: [
        'filial_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cctvCount']
      ],
      group: ['filial_id'],
      raw: true,
    });

    // Fusionar los resultados en un objeto: cada clave es el id de la filial
    const currentCounts = {}; // { filial_id: totalActual }
    wstCounts.forEach(record => {
      const filialId = record.filial_id;
      currentCounts[filialId] = parseInt(record.wstCount, 10);
    });
    cctvCounts.forEach(record => {
      const filialId = record.filial_id;
      if (currentCounts[filialId] !== undefined) {
        currentCounts[filialId] += parseInt(record.cctvCount, 10);
      } else {
        currentCounts[filialId] = parseInt(record.cctvCount, 10);
      }
    });

    // 2. Obtener los totales almacenados en TotalHostsPorFilial
    const storedRecords = await TotalHostsPorFilial.findAll({ raw: true });
    const differences = [];

    storedRecords.forEach(record => {
      const filialId = record.filial_id;
      const storedTotal = record.wst_hosts_qty + record.cctv_hosts_qty;
      const currentTotal = currentCounts[filialId] || 0;
      if (storedTotal !== currentTotal) {
        differences.push({
          filial_id: filialId,
          storedTotal,
          currentTotal
        });
      }
    });

    // 3. Preparar el mensaje
    let message = '';
    if (differences.length === 0) {
      message = 'La cantidad total de hosts por filial no varió.';
    } else {
      message = 'La cantidad total de hosts varió en las siguientes filiales:\n\n';
      for (const diff of differences) {
        const filial = await Filial.findByPk(diff.filial_id, { raw: true });
        const filialName = filial ? filial.name : `ID ${diff.filial_id}`;
        message += `Filial ${filialName}: almacenado ${diff.storedTotal} vs. actual ${diff.currentTotal}\n`;
      }
    }

    // 4. Enviar el mensaje por Telegram
    await sendReportViaTelegram(message);
    console.log('Notificación enviada:', message);
  } catch (error) {
    console.error('Error en notifyTotalHostsComparison:', error.message);
  }
};