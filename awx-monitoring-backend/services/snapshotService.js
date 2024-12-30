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

    console.log(`📝 Intentando crear snapshot para ${tipo} - ID: ${id}, Nombre: ${name}`);

    // Crear un nuevo snapshot
    await HostSnapshot.create({
      host_id: id,
      host_name: name,
      status,
      enabled,
      inventory_id,
      filial_id,
    });

    console.log(`✅ Snapshot creado para ${tipo} ${name} (ID: ${id}).`);

    // Mantener solo los dos snapshots más recientes por host
    const snapshots = await HostSnapshot.findAll({
      where: { host_id: id },
      order: [['snapshot_date', 'DESC']],
    });

    if (snapshots.length > 2) {
      const oldestSnapshot = snapshots[snapshots.length - 1];
      await oldestSnapshot.destroy();
      console.log(`🗑️ Snapshot más antiguo eliminado para ${tipo} ${name} (ID: ${id}).`);
    }
  } catch (error) {
    console.error(`❌ Error al manejar snapshot de host (${host.name}):`, error.message);
  }
};
