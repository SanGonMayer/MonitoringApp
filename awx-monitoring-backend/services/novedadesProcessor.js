import { Op } from 'sequelize';
import HostSnapshot from '../models/hostsSnapshot.js';
import Novedad from '../models/novedades.js';

// Procesar sólo snapshots a partir del 1/3/2025
const SNAPSHOT_THRESHOLD = new Date('2025-03-01T00:00:00');

export const processNovedades = async () => {
  try {
    // Consultar la fecha máxima ya procesada en Novedades para evitar duplicados
    const lastNovedad = await Novedad.findOne({
      attributes: [[Novedad.sequelize.fn('max', Novedad.sequelize.col('snapshot_date')), 'maxDate']],
      raw: true,
    });
    let lastProcessedDate = lastNovedad.maxDate ? new Date(lastNovedad.maxDate) : null;

    const fromDate =
      lastProcessedDate && lastProcessedDate > SNAPSHOT_THRESHOLD ? lastProcessedDate : SNAPSHOT_THRESHOLD;

    // Obtener nuevos snapshots a procesar (con fecha mayor que fromDate)
    const newSnapshots = await HostSnapshot.findAll({
      where: {
        snapshot_date: {
          [Op.gt]: fromDate,
        },
      },
      order: [['snapshot_date', 'ASC']],
    });

    for (const snapshot of newSnapshots) {
      // Caso 1: Motivo "Modificacion de habilitado a deshabilitado" → Host retirado
      if (snapshot.motivo === 'Modificacion de habilitado a deshabilitado') {
        await Novedad.create({
          host_id: snapshot.host_id,
          host_name: snapshot.host_name,
          status: snapshot.status,
          enabled: snapshot.enabled,
          snapshot_date: snapshot.snapshot_date,
          inventory_id: snapshot.inventory_id,
          filial_id: snapshot.filial_id,
          old_filial_id: snapshot.old_filial_id,
          motivo: 'Host retirado',
        });
        console.log(`Novedad insertada para host ${snapshot.host_id} con motivo: Host retirado`);
      }
      // Caso 2: Motivo "Modificacion de deshabilitado a habilitado" o "Host agregado" → Host agregado
      else if (
        snapshot.motivo === 'Modificacion de deshabilitado a habilitado' ||
        snapshot.motivo === 'Host agregado'
      ) {
        await Novedad.create({
          host_id: snapshot.host_id,
          host_name: snapshot.host_name,
          status: snapshot.status,
          enabled: snapshot.enabled,
          snapshot_date: snapshot.snapshot_date,
          inventory_id: snapshot.inventory_id,
          filial_id: snapshot.filial_id,
          old_filial_id: snapshot.old_filial_id,
          motivo: 'Host agregado',
        });
        console.log(`Novedad insertada para host ${snapshot.host_id} con motivo: Host agregado`);
      }
      // Caso 3: Motivo "Modificacion de filial"
      else if (snapshot.motivo === 'Modificacion de filial') {
        if (snapshot.old_filial_id !== null) {
          // Inserta dos registros:
          // a) Retiro para la filial de origen
          await Novedad.create({
            host_id: snapshot.host_id,
            host_name: snapshot.host_name,
            status: snapshot.status,
            enabled: snapshot.enabled,
            snapshot_date: snapshot.snapshot_date,
            inventory_id: snapshot.inventory_id,
            filial_id: snapshot.old_filial_id,  // Filial de origen
            old_filial_id: snapshot.old_filial_id,
            motivo: 'Host retirado',
          });
          console.log(`Novedad insertada para host ${snapshot.host_id} (retiro de filial ${snapshot.old_filial_id})`);

          // b) Agregado para la filial de destino
          await Novedad.create({
            host_id: snapshot.host_id,
            host_name: snapshot.host_name,
            status: snapshot.status,
            enabled: snapshot.enabled,
            snapshot_date: snapshot.snapshot_date,
            inventory_id: snapshot.inventory_id,
            filial_id: snapshot.filial_id,  // Filial de destino
            old_filial_id: snapshot.old_filial_id,
            motivo: 'Host agregado',
          });
          console.log(`Novedad insertada para host ${snapshot.host_id} (agregado a filial ${snapshot.filial_id})`);
        } else {
          // Si old_filial_id es nulo, se trata como Host agregado
          await Novedad.create({
            host_id: snapshot.host_id,
            host_name: snapshot.host_name,
            status: snapshot.status,
            enabled: snapshot.enabled,
            snapshot_date: snapshot.snapshot_date,
            inventory_id: snapshot.inventory_id,
            filial_id: snapshot.filial_id,
            old_filial_id: snapshot.old_filial_id,
            motivo: 'Host agregado',
          });
          console.log(`Novedad insertada para host ${snapshot.host_id} con motivo: Host agregado`);
        }
      }
      // Si el motivo no coincide con ninguno de los anteriores, se puede omitir.
      else {
        console.log(`Snapshot ${snapshot.host_id} con motivo "${snapshot.motivo}" no se procesa para novedades.`);
        continue;
      }
    }
  } catch (error) {
    console.error('Error procesando novedades:', error);
    throw error;
  }
};
