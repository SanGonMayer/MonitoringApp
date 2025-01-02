import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import HostSnapshot from '../models/hostsSnapshot.js';
import { Op } from 'sequelize';

/**
 * Toma un snapshot diario de los hosts (Workstations y CCTV).
 * Guarda su estado actual en la tabla HostSnapshots.
 */
export const takeDailySnapshot = async () => {
  try {
    console.log('📸 Iniciando snapshot diario de hosts...');

    // 1️⃣ Snapshot de Workstations
    const workstations = await Workstation.findAll();
    console.log(`🔍 Encontrados ${workstations.length} Workstations para snapshot.`);

    for (const workstation of workstations) {
      await handleHostSnapshot(workstation, 'workstation');
    }

    // 2️⃣ Snapshot de CCTV
    const cctvs = await CCTV.findAll();
    console.log(`🔍 Encontrados ${cctvs.length} CCTV para snapshot.`);

    for (const cctv of cctvs) {
      await handleHostSnapshot(cctv, 'cctv');
    }

    console.log('✅ Snapshot diario completado.');
  } catch (error) {
    console.error('❌ Error al tomar snapshot diario:', error.message);
  }
};

/**
 * Maneja el snapshot para un host específico.
 * @param {Object} host - Objeto del host (Workstation o CCTV).
 * @param {string} tipo - Tipo de host ('workstation' o 'cctv').
 */
const handleHostSnapshot = async (host, tipo) => {
  try {
    const { id, name, status, enabled, inventory_id, filial_id } = host;

    console.log(`📝 Procesando snapshot para ${tipo} - ID: ${id}, Nombre: ${name}`);

    // Obtener el snapshot más reciente del host
    const lastSnapshot = await HostSnapshot.findOne({
      where: { host_id: id },
      order: [['snapshot_date', 'DESC']],
    });

    const hasChanges = checkForChanges(lastSnapshot, {
      status,
      enabled,
      inventory_id,
      filial_id,
    });

    if (hasChanges || !lastSnapshot) {
      // 🔄 Si hay cambios o es el primer snapshot, crear uno nuevo
      await HostSnapshot.create({
        host_id: id,
        host_name: name,
        status,
        enabled,
        inventory_id,
        filial_id,
        snapshot_date: new Date(),
      });

      console.log(`✅ Nuevo snapshot creado para ${tipo} ${name} (ID: ${id}).`);

      // 🗑️ Mantener solo los 2 snapshots más recientes
      const snapshots = await HostSnapshot.findAll({
        where: { host_id: id },
        order: [['snapshot_date', 'DESC']],
      });

      if (snapshots.length > 2) {
        const oldestSnapshot = snapshots.slice(2); // Obtener los más antiguos después de los dos primeros
        for (const snapshot of oldestSnapshot) {
          await snapshot.destroy();
          console.log(`🗑️ Snapshot más antiguo eliminado para ${tipo} ${name} (ID: ${id}).`);
        }
      }
    } else {
      console.log(`⚠️ No se detectaron cambios en ${tipo} ${name}. No se creó un nuevo snapshot.`);
    }
  } catch (error) {
    console.error(`❌ Error al manejar snapshot de host (${host.name}):`, error.message);
  }
};

/**
 * Compara el último snapshot con los datos actuales para detectar cambios.
 * @param {Object|null} lastSnapshot - Último snapshot del host.
 * @param {Object} currentData - Datos actuales del host.
 * @returns {boolean} - Verdadero si hay cambios, falso si no.
 */
const checkForChanges = (lastSnapshot, currentData) => {
  if (!lastSnapshot) {
    return true; // Si no hay snapshot previo, siempre hay cambios
  }

  return (
    lastSnapshot.status !== currentData.status ||
    lastSnapshot.enabled !== currentData.enabled ||
    lastSnapshot.inventory_id !== currentData.inventory_id ||
    lastSnapshot.filial_id !== currentData.filial_id
  );
};
