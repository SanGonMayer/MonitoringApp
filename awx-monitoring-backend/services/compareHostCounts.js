import sequelize from '../config/database.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import TotalHostsPorFilial from '../models/totalHostsPorFilial.js';
import Filial from '../models/filiales.js';
import { sendReportViaTelegram } from './notificadorService.js';

export const notifyTotalHostsComparison = async () => {
    try {
      // 1. Contar Workstations y CCTV actuales por filial
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
  
      // Fusionar resultados en un objeto: { filial_id: { wst, cctv } }
      const currentCounts = {};
      wstCounts.forEach(record => {
        const filialId = record.filial_id;
        currentCounts[filialId] = { wst: parseInt(record.wstCount, 10), cctv: 0 };
      });
      cctvCounts.forEach(record => {
        const filialId = record.filial_id;
        if (currentCounts[filialId]) {
          currentCounts[filialId].cctv = parseInt(record.cctvCount, 10);
        } else {
          currentCounts[filialId] = { wst: 0, cctv: parseInt(record.cctvCount, 10) };
        }
      });
  
      // 2. Obtener los totales almacenados en TotalHostsPorFilial
      const storedRecords = await TotalHostsPorFilial.findAll({ raw: true });
  
      // 3. Comparar los totales por tipo, excluyendo la filial con id = 1 (f0000)
      const wstDifferences = [];
      const cctvDifferences = [];
  
      storedRecords.forEach(record => {
        if (record.filial_id === 1) return; // Excluir la filial f0000
        const current = currentCounts[record.filial_id] || { wst: 0, cctv: 0 };
        if (record.wst_hosts_qty !== current.wst) {
          wstDifferences.push({
            filial_id: record.filial_id,
            stored: record.wst_hosts_qty,
            current: current.wst,
          });
        }
        if (record.cctv_hosts_qty !== current.cctv) {
          cctvDifferences.push({
            filial_id: record.filial_id,
            stored: record.cctv_hosts_qty,
            current: current.cctv,
          });
        }
      });
  
      // 4. Construir el mensaje de notificación
      let message = '';
      if (wstDifferences.length === 0 && cctvDifferences.length === 0) {
        message = 'La cantidad total de hosts por filial no varió.';
      } else {
        if (wstDifferences.length > 0) {
          message += 'La cantidad total de Workstations varió en las siguientes filiales:\n\n';
          for (const diff of wstDifferences) {
            const filial = await Filial.findByPk(diff.filial_id, { raw: true });
            const filialName = filial ? filial.name : `ID ${diff.filial_id}`;
            message += `Filial ${filialName}: almacenado ${diff.stored} vs. actual ${diff.current}\n`;
          }
        }
        if (cctvDifferences.length > 0) {
          message += '\nLa cantidad total de CCTV varió en las siguientes filiales:\n\n';
          for (const diff of cctvDifferences) {
            const filial = await Filial.findByPk(diff.filial_id, { raw: true });
            const filialName = filial ? filial.name : `ID ${diff.filial_id}`;
            message += `Filial ${filialName}: almacenado ${diff.stored} vs. actual ${diff.current}\n`;
          }
        }
      }
  
      // 5. Enviar el mensaje por Telegram
      await sendReportViaTelegram(message);
      console.log('Notificación enviada:', message);
    } catch (error) {
      console.error('Error en notifyTotalHostsComparison:', error.message);
    }
  };