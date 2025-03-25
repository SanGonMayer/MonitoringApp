import { Router } from 'express';
import HostSnapshot from '../models/hostsSnapshot.js';
import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { processNovedades } from '../services/novedadesProcessor.js';
import Novedad from '../models/novedades.js';
import TotalHostsPorFilial from '../models/totalHostsPorFilial.js';
import { notifyTotalHostsComparison } from '../services/compareHostCounts.js';


const router = Router();

// Ruta para obtener los registros con motivo "Host agregado"
router.get('/agregados', async (req, res) => {
  try {
    // Definir el inicio y fin del día de hoy
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const agregados = await HostSnapshot.findAll({
      where: {
        motivo: {
          [Op.in]: ['Host agregado', 'Modificacion de deshabilitado a habilitado', 'Modificacion de filial']
        },
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
        host_name: { [Op.notLike]: 'cctv-%' },
        filial_id: { [Op.not]: [62, 304, 305, 299, 1]},
      },
      attributes: ['host_id', 'host_name', 'snapshot_date'],
      include: [
        {
          model: Filial,
          as: 'filial',
          attributes: ['name']
        },
        {
          model: Workstation,
          as:'workstation',
          attributes: ['status']
        },
        {
          model: CCTV,
          as: 'cctv',
          attributes: ['status']
        }
      ]
    });
    res.json(agregados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de Host agregado' });
  }
});

// Ruta para obtener los registros con motivo "Modificacion de habilitado a deshabilitado"
router.get('/deshabilitados', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const deshabilitados = await HostSnapshot.findAll({
      where: { 
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        }, 
        host_name: { [Op.notLike]: 'cctv-%' },
        filial_id: { [Op.not]: [62, 304, 305, 299, 1]},     
        [Op.or]: [
          { motivo: 'Modificacion de habilitado a deshabilitado' },

          // Caso de movimiento: se modifica la filial y se registra old_filial_id (es decir, la máquina sale de la filial de origen)
          {
            [Op.and]: [
              { motivo: 'Modificacion de filial' },
              { old_filial_id: { [Op.ne]: null } }
            ]
          }
        ]
      },
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date'],
      include: [
        {
          model: Filial,
          as: 'filial',
          attributes: ['name']
        }
      ]
    });
    res.json(deshabilitados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de deshabilitados' });
  }
});

router.get('/filter', async (req, res) => {
  const { host_id, host_name, motivo, startDate, endDate } = req.query;
  const whereClause = {};
  
  if (host_id) {
    // Convertir host_id a número, si es necesario
    whereClause.host_id = host_id;
  }
  
  if (host_name) {
    whereClause.host_name = { [Op.like]: `%${host_name}%` };
  }
  
  if (motivo) {
    whereClause.motivo = motivo; // Asumiendo coincidencia exacta
  }
  
  if (startDate && endDate) {
    whereClause.snapshot_date = {
      [Op.gte]: new Date(startDate),
      [Op.lte]: new Date(endDate)
    };
  } else if (startDate) {
    // Si solo se proporciona la fecha de inicio, filtrar por ese día
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setHours(23, 59, 59, 999);
    whereClause.snapshot_date = {
      [Op.gte]: start,
      [Op.lte]: end
    };
  }
  
  try {
    const results = await HostSnapshot.findAll({
      where: whereClause,
      attributes: ['host_id', 'host_name', 'status', 'snapshot_date', 'motivo'],
    });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al filtrar los datos' });
  }
});

router.get('/reemplazos', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Obtener las filiales en las que se registró una baja hoy.
    // Se consideran bajas:
    //   a) Directa: motivo "Modificacion de habilitado a deshabilitado"
    //   b) Por movimiento: motivo "Modificacion de filial" y old_filial_id no nulo
    const bajas = await HostSnapshot.findAll({
      attributes: [
        [
          sequelize.literal(`
            CASE 
              WHEN "motivo" = 'Modificacion de filial' AND "old_filial_id" IS NOT NULL 
              THEN "old_filial_id" 
              ELSE "filial_id" 
            END
          `),
          'bajaFilialId'
        ]
      ],
      where: {
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
        [Op.or]: [
          { motivo: 'Modificacion de habilitado a deshabilitado' },
          {
            [Op.and]: [
              { motivo: 'Modificacion de filial' },
              { old_filial_id: { [Op.ne]: null } }
            ]
          }
        ]
      },
      group: ['bajaFilialId']
    });
    const filialIdsConBaja = bajas.map(registro => registro.get('bajaFilialId'));

    // 2. Consultar los eventos de entrada, ya sea por "Host agregado" o "Modificacion de filial",
    // que se consideran reemplazo únicamente si la filial de ingreso está en la lista de filiales donde se registró baja.
    const reemplazos = await HostSnapshot.findAll({
      attributes: ['host_id', 'host_name', 'status'],
      where: {
        snapshot_date: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday,
        },
        motivo: { [Op.in]: ['Host agregado', 'Modificacion de filial'] },
        // Únicamente se clasifica como reemplazo si la filial de ingreso tuvo baja
        filial_id: { [Op.in]: filialIdsConBaja }
      },
      include: [
        {
          model: Filial,
          as: 'filial',
          attributes: ['name']
        },
        {
          model: Workstation,
          as: 'workstation',
          attributes: ['status']
        }
      ]
    });

    res.json(reemplazos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los registros de reemplazos' });
  }
});

router.get('/test-novedades', async (req, res) => {
  try {
    const novedades = await Novedad.findAll({
      order: [['snapshot_date', 'DESC']],
    });
    res.json(novedades);
  } catch (error) {
    console.error('Error obteniendo novedades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para forzar el procesamiento de novedades
router.get('/procesar-novedades', async (req, res) => {
  try {
    await processNovedades();

    // Luego de procesar, devolvemos los registros de novedades de hoy (o a partir del umbral)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const novedades = await Novedad.findAll({
      where: {
        snapshot_date: {
          [Op.gte]: startOfToday,
        },
      },
      order: [['snapshot_date', 'DESC']],
    });
    
    res.json({
      message: 'Proceso de novedades ejecutado',
      registros: novedades,
    });
  } catch (error) {
    console.error('Error procesando novedades:', error);
    res.status(500).json({ error: 'Error interno al procesar novedades' });
  }
});

// Resumen de host agregados: acumulado mensual y anual (desde 1/3/2025)
router.get('/resumen/agregados', async (req, res) => {
  try {
    const threshold = new Date('2025-03-01T00:00:00');
    // Agrupar por mes usando date_trunc de Postgres
    const monthly = await Novedad.findAll({
      attributes: [
        [Novedad.sequelize.fn('date_trunc', 'month', Novedad.sequelize.col('snapshot_date')), 'month'],
        [Novedad.sequelize.fn('COUNT', Novedad.sequelize.col('id')), 'count']
      ],
      where: {
        motivo: 'Host agregado',
        snapshot_date: { [Op.gte]: threshold },
        host_name: { [Op.notLike]: 'cctv-%' },
        filial_id: { [Op.not]: [62, 304, 305, 299, 1]},
      },
      group: [Novedad.sequelize.fn('date_trunc', 'month', Novedad.sequelize.col('snapshot_date'))],
      order: [[Novedad.sequelize.fn('date_trunc', 'month', Novedad.sequelize.col('snapshot_date')), 'ASC']],
      raw: true
    });
    // Conteo anual: total desde el 1 de marzo
    const annual = await Novedad.count({
      where: {
        motivo: 'Host agregado',
        snapshot_date: { [Op.gte]: threshold },
        host_name: { [Op.notLike]: 'cctv-%' },
        filial_id: { [Op.not]: [62, 304, 305, 299, 1]},
      }
    });

    res.json({ monthly, annual });
  } catch (error) {
    console.error('Error en resumen agregados:', error);
    res.status(500).json({ error: 'Error al obtener resumen de host agregados' });
  }
});

// Resumen de host retirados: acumulado mensual y anual (desde 1/3/2025)
router.get('/resumen/retirados', async (req, res) => {
  try {
    const threshold = new Date('2025-03-01T00:00:00');
    const monthly = await Novedad.findAll({
      attributes: [
        [Novedad.sequelize.fn('date_trunc', 'month', Novedad.sequelize.col('snapshot_date')), 'month'],
        [Novedad.sequelize.fn('COUNT', Novedad.sequelize.col('id')), 'count']
      ],
      where: {
        motivo: 'Host retirado',
        snapshot_date: { [Op.gte]: threshold },
        host_name: { [Op.notLike]: 'cctv-%' },
        filial_id: { [Op.not]: [62, 304, 305, 299, 1]},
      },
      group: [Novedad.sequelize.fn('date_trunc', 'month', Novedad.sequelize.col('snapshot_date'))],
      order: [[Novedad.sequelize.fn('date_trunc', 'month', Novedad.sequelize.col('snapshot_date')), 'ASC']],
      raw: true
    });
    const annual = await Novedad.count({
      where: {
        motivo: 'Host retirado',
        snapshot_date: { [Op.gte]: threshold },
        host_name: { [Op.notLike]: 'cctv-%' },
        filial_id: { [Op.not]: [62, 304, 305, 299, 1]},
      }
    });

    res.json({ monthly, annual });
  } catch (error) {
    console.error('Error en resumen retirados:', error);
    res.status(500).json({ error: 'Error al obtener resumen de host retirados' });
  }
});

router.get('/resumen/reemplazos/novedad', async (req, res) => {
  try {
    // --- Cálculo Diario ---
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Para el resumen diario, se agrupa por (filial_id, inventory_id, día) y se calcula el mínimo entre 
    // los eventos de "Host agregado" y "Host retirado". Luego se suma para obtener el total del día.
    const dailyQuery = `
      SELECT SUM(replacements) AS "dailyCount" FROM (
        SELECT LEAST(
          COUNT(CASE WHEN "motivo" = 'Host agregado' THEN 1 END),
          COUNT(CASE WHEN "motivo" = 'Host retirado' THEN 1 END)
        ) AS replacements,
        date_trunc('day', "snapshot_date") AS day
        FROM "Novedades"
        WHERE "snapshot_date" BETWEEN :startOfToday AND :endOfToday
          AND "motivo" IN ('Host agregado', 'Host retirado')
        GROUP BY "filial_id", "inventory_id", day
      ) AS sub;
    `;
    const [dailyResult] = await sequelize.query(dailyQuery, {
      replacements: { startOfToday, endOfToday },
      type: sequelize.QueryTypes.SELECT
    });
    const dailyCount = dailyResult.dailyCount ? parseInt(dailyResult.dailyCount) : 0;

    // --- Cálculo Mensual ---
    // Se consideran registros desde el 1 de marzo de 2025.
    const threshold = new Date('2025-03-01T00:00:00');
    const monthlyQuery = `
      SELECT date_trunc('month', day) AS "month", SUM(replacements) AS "count" FROM (
        SELECT LEAST(
          COUNT(CASE WHEN "motivo" = 'Host agregado' THEN 1 END),
          COUNT(CASE WHEN "motivo" = 'Host retirado' THEN 1 END)
        ) AS replacements,
        date_trunc('day', "snapshot_date") AS day
        FROM "Novedades"
        WHERE "snapshot_date" >= :threshold
          AND "motivo" IN ('Host agregado', 'Host retirado')
        GROUP BY "filial_id", "inventory_id", day
      ) AS dailyData
      GROUP BY date_trunc('month', day)
      ORDER BY date_trunc('month', day) ASC;
    `;
    const monthlyResults = await sequelize.query(monthlyQuery, {
      replacements: { threshold },
      type: sequelize.QueryTypes.SELECT
    });

    // Calcular el total anual como la suma de todos los meses.
    let annualCount = 0;
    monthlyResults.forEach(item => {
      annualCount += parseInt(item.count);
    });

    res.json({ daily: dailyCount, monthly: monthlyResults, annual: annualCount });
  } catch (error) {
    console.error('Error en resumen reemplazos (Novedad):', error);
    res.status(500).json({ error: 'Error al obtener resumen de reemplazos' });
  }
});

router.get('/update-host-counts', async (req, res) => {
  try {

    const wstCounts = await Workstation.findAll({
      attributes: [
        'filial_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['filial_id']
    });


    const cctvCounts = await CCTV.findAll({
      attributes: [
        'filial_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['filial_id']
    });


    const hostCountsMap = new Map();

    wstCounts.forEach(record => {
      const filialId = record.filial_id;
      hostCountsMap.set(filialId, { 
        wst_hosts_qty: parseInt(record.dataValues.count), 
        cctv_hosts_qty: 0 
      });
    });

    cctvCounts.forEach(record => {
      const filialId = record.filial_id;
      if (hostCountsMap.has(filialId)) {
        const existing = hostCountsMap.get(filialId);
        existing.cctv_hosts_qty = parseInt(record.dataValues.count);
      } else {
        hostCountsMap.set(filialId, { 
          wst_hosts_qty: 0, 
          cctv_hosts_qty: parseInt(record.dataValues.count) 
        });
      }
    });


    await TotalHostsPorFilial.destroy({ truncate: true });


    const recordsToInsert = [];
    for (const [filial_id, counts] of hostCountsMap) {
      recordsToInsert.push({
        filial_id,
        wst_hosts_qty: counts.wst_hosts_qty,
        cctv_hosts_qty: counts.cctv_hosts_qty
      });
    }


    await TotalHostsPorFilial.bulkCreate(recordsToInsert);

    res.status(200).json({
      message: 'Tabla totalHostsPorFilial actualizada correctamente',
      data: recordsToInsert
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la tabla de conteo de hosts' });
  }
});

router.get('/notify-host-count-comparison', async (req, res) => {
  try {
    await notifyTotalHostsComparison();
    res.json({ message: 'Notificación enviada correctamente.' });
  } catch (error) {
    console.error('Error en la ruta de comparación:', error.message);
    res.status(500).json({ error: 'Error al enviar la notificación', details: error.message });
  }
});

export default router;
