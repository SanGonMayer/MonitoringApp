import { Op } from 'sequelize';
import { handleHostSnapshot } from '../services/snapshotService.js';

/**
 * Captura el snapshot de los hosts que ya no están presentes en la API y luego los elimina.
 * @param {Model} model - El modelo a trabajar (Workstation o CCTV).
 * @param {number} filialId - ID de la filial.
 * @param {number[]} enabledHostIds - Lista de IDs que vienen de la API.
 * @param {string} type - Tipo de host ('workstation' o 'cctv').
 */
export const captureAndDeleteMissingHosts = async (model, filialId, enabledHostIds, type) => {
  console.log(`Capturando hosts a eliminar para ${type} en filial ${filialId}`);
  // Obtener los hosts que no están en la lista de la API
  const hostsToRemove = await model.findAll({
    where: {
      filial_id: filialId,
      id: { [Op.notIn]: enabledHostIds }
    }
  });
  console.log(`Hosts identificados para eliminación: ${hostsToRemove.length}`);

  // Para cada host a eliminar: actualizar a disabled o forzar y generar snapshot
  for (const host of hostsToRemove) {
    console.log(`Procesando host para eliminación: ID ${host.id}, Nombre: ${host.name}, enabled: ${host.enabled}`);
    if (host.enabled === true || host.enabled === 't') {
      console.log(`Actualizando host ${host.id} (${host.name}) a disabled y generando snapshot`);
      await host.update({ enabled: false });
      // Acá se genera el snapshot, que con la lógica actual debería detectar el cambio de enabled o con el forzado.
      await handleHostSnapshot(host, type);
    }else{
      console.log(`Forzando snapshot para host ${host.id} (${host.name})`);
      await handleHostSnapshot(host, type, true);
    }
  }
  console.log(`Eliminando hosts de la base de datos para ${type}`);
  await model.destroy({
    where: {
      filial_id: filialId,
      id: { [Op.notIn]: enabledHostIds }
    }
  });
  console.log(`Eliminación completada para ${type}`);
};
