import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import HostSnapshot from '../models/hostsSnapshot.js';
import { Op } from 'sequelize';

const modifiedHosts = [];

/**
 * Toma un snapshot diario de los hosts (Workstations y CCTV).
 * Guarda su estado actual en la tabla HostSnapshots.
 */
export const takeDailySnapshot = async () => {
  try {
    console.log('📸 Iniciando snapshot diario de hosts...');

    // Snapshot de Workstations
    const workstations = await Workstation.findAll();
    console.log(`🔍 Encontrados ${workstations.length} Workstations para snapshot.`);

    for (const workstation of workstations) {
      await handleHostSnapshot(workstation, 'workstation');
    }

    // Snapshot de CCTV
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
 * Obtiene el último snapshot de un host.
 */
export const getLastSnapshot = async (hostId) => {
    return await HostSnapshot.findOne({
      where: { host_id: hostId },
      order: [['snapshot_date', 'DESC']],
    });
  };

  const determineChangeReason = (lastSnapshot, currentData) => {
    if (!lastSnapshot) return 'Host agregado';
  
    if (lastSnapshot.status !== currentData.status) {
      if (lastSnapshot.status === 'pendiente' && currentData.status === 'actualizado') {
        return 'Modificacion de estado pendiente a actualizado';
      } else if (lastSnapshot.status === 'pendiente' && currentData.status === 'fallido') {
        return 'Modificacion de estado pendiente a fallido';
      } else if (lastSnapshot.status === 'fallido' && currentData.status === 'actualizado') {
        return 'Modificacion de estado fallido a actualizado';
      } else {
        return `Modificacion de estado ${lastSnapshot.status} a ${currentData.status}`;
      }
    }
    if (lastSnapshot.inventory_id !== currentData.inventory_id) {
      return 'Modificacion de inventario';
    }
    if (lastSnapshot.filial_id !== currentData.filial_id) {
      return 'Modificacion de filial';
    }
    if (lastSnapshot.enabled !== currentData.enabled) {
      return lastSnapshot.enabled
        ? 'Modificacion de habilitado a deshabilitado'
        : 'Modificacion de deshabilitado a habilitado';
    }
  
    return 'Otro cambio';
  };

/**
 * Compara el último snapshot con los datos actuales.
 */
export const hasSnapshotChanged = (lastSnapshot, currentData) => {
    if (!lastSnapshot) return true;
    return (
      lastSnapshot.status !== currentData.status ||
      lastSnapshot.enabled !== currentData.enabled ||
      lastSnapshot.inventory_id !== currentData.inventory_id ||
      lastSnapshot.filial_id !== currentData.filial_id
    );
  };

/**
 * Crea un nuevo snapshot y asegura que solo existan los dos más recientes.
 */
export const createAndManageSnapshots = async (snapshotData) => {
    await HostSnapshot.create({
      ...snapshotData,
      snapshot_date: new Date(),
    });
    console.log(`✅ Nuevo snapshot creado para host ID: ${snapshotData.host_id}`);
  
    // Mantener solo los 2 snapshots más recientes
    /*const snapshots = await HostSnapshot.findAll({
      where: { host_id: snapshotData.host_id },
      order: [['snapshot_date', 'DESC']],
    });*/
    /*while (snapshots.length > 2) {
      const oldestSnapshot = snapshots.pop(); // Elimina el último snapshot de la lista ordenada
      await oldestSnapshot.destroy();
      console.log(`🗑️ Snapshot más antiguo eliminado para host ID: ${snapshotData.host_id}`);
    }*/

    const snapshotCount = await HostSnapshot.count({
      where: { host_id: snapshotData.host_id },
    });

    if (snapshotCount > 4) {
      const oldestSnapshot = await HostSnapshot.findOne({
        where: { host_id: snapshotData.host_id },
        order: [['snapshot_date', 'ASC']], // Obtener el más antiguo
      });
  
      if (oldestSnapshot) {
        await oldestSnapshot.destroy();
        console.log(`🗑️ Snapshot más antiguo eliminado para host ID: ${snapshotData.host_id}`);
      }
    }
  };

/**
 * Maneja el snapshot para un host específico.
 */
export const handleHostSnapshot = async (host, tipo) => {
    try {
      const { id, name, status, enabled, inventory_id, filial_id } = host;
      console.log(`📝 Procesando snapshot para ${tipo} - ID: ${id}, Nombre: ${name}`);
  
      const lastSnapshot = await getLastSnapshot(id);
      const hasChanges = hasSnapshotChanged(lastSnapshot, {
        status,
        enabled,
        inventory_id,
        filial_id,
      });
  
      if (!lastSnapshot || hasChanges) {

        const motivo = determineChangeReason(lastSnapshot, {
          status,
          enabled,
          inventory_id,
          filial_id,
        });

        console.log(`📝 Datos del snapshot que se van a crear:`, {
          id,
          name,
          status,
          enabled,
          inventory_id,
          filial_id,
          motivo,
        });
        
        await createAndManageSnapshots({
          host_id: id,
          host_name: name,
          status,
          enabled,
          inventory_id,
          filial_id,
          motivo,
        });

        modifiedHosts.push({
          id,
          name,
          status,
          enabled,
          inventory_id,
          filial_id,
          tipo,
          snapshot_date: new Date(),
          motivo,
      });

      } else {
        console.log(`⚠️ No se detectaron cambios en ${tipo} ${name}. No se creó un nuevo snapshot.`);
      }
    } catch (error) {
      console.error(`❌ Error al manejar snapshot de host (${host.name}):`, error.message);
      throw error;
    }
  };

  const getModifiedHostsReport = () => {
    return modifiedHosts;
};

export const clearModifiedHosts = () => {
  modifiedHosts.length = 0;
};
