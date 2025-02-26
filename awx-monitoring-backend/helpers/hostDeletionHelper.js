import { Op } from 'sequelize';
import { handleHostSnapshot } from '../services/snapshotsService.js';

/**
 * Captura el snapshot de los hosts que ya no están presentes en la API y luego los elimina.
 * @param {Model} model - El modelo a trabajar (Workstation o CCTV).
 * @param {number} filialId - ID de la filial.
 * @param {number[]} enabledHostIds - Lista de IDs que vienen de la API.
 * @param {string} type - Tipo de host ('workstation' o 'cctv').
 */
export const captureAndDeleteMissingHosts = async (model, filialId, enabledHostIds, type) => {
  // Obtener los hosts que no están en la lista de la API
  const hostsToRemove = await model.findAll({
    where: {
      filial_id: filialId,
      id: { [Op.notIn]: enabledHostIds }
    }
  });

  // Para cada host a eliminar: actualizar a disabled y generar snapshot
  for (const host of hostsToRemove) {
    if (host.enabled) {
      await host.update({ enabled: false });
      // Aquí se genera el snapshot, que con la lógica actual debería detectar el cambio de enabled
      await handleHostSnapshot(host, type);
    }
  }

  await model.destroy({
    where: {
      filial_id: filialId,
      id: { [Op.notIn]: enabledHostIds }
    }
  });
};
