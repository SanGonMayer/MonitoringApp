import HostStatusHistory from '../models/hostStatusHistory.js';

export const logStatusChange = async (host, inventoryId, previousStatus, newStatus) => {
  try {
    await HostStatusHistory.create({
      host_id: host.id,
      inventory_id: inventoryId,
      previous_status: previousStatus,
      new_status: newStatus,
      change_reason: 'Sincronización',
      updated_at: new Date(),
    });

    console.log(`Historial registrado para el host ${host.name} (${host.id}): ${previousStatus} -> ${newStatus}`);
  } catch (error) {
    console.error(`Error al registrar historial para el host ${host.name} (${host.id}):`, error.message);
  }
};
