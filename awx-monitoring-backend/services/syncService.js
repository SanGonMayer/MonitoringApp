import { fetchAllPages } from './awxService.js';
import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import JobHostSummary from '../models/jobHostSummary.js';
import Inventory from '../models/inventory.js';
import { Op } from 'sequelize';
import { io } from '../app.js';
import { calculateHostStatus } from '../utils/hostStatus.js';
import { captureAndDeleteMissingHosts } from '../helpers/hostDeletionHelper.js';

const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories';
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';
const gruposExcluidos = ['wst', 'pve', 'cctv'];


export const syncFiliales = async () => {
  try {
    const groupsWST = await fetchAllPages(`${baseApiUrl}/22/groups/`);
    const groupsCCTV = await fetchAllPages(`${baseApiUrl}/347/groups/`);

    const allGroups = [...groupsWST, ...groupsCCTV].filter(
      group => !gruposExcluidos.includes(group.name.toLowerCase())
    );

    const uniqueGroups = new Map();

    allGroups.forEach(group => {
      if (!uniqueGroups.has(group.name)) {
        uniqueGroups.set(group.name, {
          name: group.name,
          description: group.description,
          awx_id_wst: null,
          awx_id_cctv: null,
        });
      }
      
      const filialData = uniqueGroups.get(group.name);
      if (groupsWST.some(g => g.id === group.id)) {
        filialData.awx_id_wst = group.id;
      }
      if (groupsCCTV.some(g => g.id === group.id)) {
        filialData.awx_id_cctv = group.id;
      }
    });

    for (const [, groupData] of uniqueGroups) {
        const [filial, created] = await Filial.findOrCreate({
        where: { name: groupData.name },
        defaults: {
          description: groupData.description,
          awx_id_wst: groupData.awx_id_wst,
          awx_id_cctv: groupData.awx_id_cctv,
        }
      });

      if (!created) {
        await filial.update({
          description: groupData.description,
          awx_id_wst: groupData.awx_id_wst,
          awx_id_cctv: groupData.awx_id_cctv,
        });
      }

      console.log(`Filial ${groupData.name} sincronizada`);
    }

    console.log('Sincronización de filiales completada');
  } catch (error) {
    console.error('Error al sincronizar filiales:', error.message);
  }
};

  

export const syncHostsFromInventory22 = async (filial) => {
    if (!filial.awx_id_wst) {
      console.log(`La filial ${filial.name} no tiene un ID de WST asociado.`);
      return;
    }

    await Inventory.findOrCreate({
        where: { id: 22 },
        defaults: { name: 'WST' }
      });
    
      console.log('Inventario WST sincronizado.');
  
    try {
      const hostsWST = await fetchAllPages(`${hostsApiUrl}/${filial.awx_id_wst}/hosts/`);
      const enabledHostIdsFromAPI = hostsWST.map(host => host.id);
  
      for (const host of hostsWST) {
        const [existingHost] = await Workstation.upsert({
          id: host.id,
          name: host.name,
          description: host.description,
          inventory_id: 22, 
          filial_id: filial.id, 
          enabled: host.enabled
        }, {returning: true});
        await syncJobHostSummaries(host.id, 22); 

        const jobSummaries = await JobHostSummary.findAll({
          where: { workstation_id: host.id }
        });

        const newStatus = calculateHostStatus({...existingHost.get(), jobSummaries}, 'wst');
        console.log(`🔍 Host: ${host.name} | Estado Calculado: ${newStatus}`);

        if (existingHost.status !== newStatus) {
          console.log(`🔄 Estado cambiado: ${existingHost.status} → ${newStatus}`);
          await Workstation.update(
            { status: newStatus },
            { where: { id: existingHost.id } }
          );
          console.log(`✅ Estado actualizado en la base de datos: ${newStatus}`);
        } else {
          console.log(`ℹ️ El estado del host ${host.name} no ha cambiado (${existingHost.status})`);
        }
      }

      /*await Workstation.destroy({
        where: {
          filial_id: filial.id,
          id: { [Op.notIn]: enabledHostIdsFromAPI }  
        }
      });*/

      await captureAndDeleteMissingHosts(Workstation, filial.id, enabledHostIdsFromAPI, 'workstation');

  
      console.log(`Hosts WST de la filial ${filial.name} sincronizados.`);
    } catch (error) {
      console.error(`Error al sincronizar hosts WST de la filial ${filial.name}:`, error.message);
    }
  };
  

  export const syncHostsFromInventory347 = async (filial) => {
    if (!filial.awx_id_cctv) {
      console.log(`La filial ${filial.name} no tiene un ID de CCTV asociado.`);
      return;
    }

    await Inventory.findOrCreate({
        where: { id: 347 },
        defaults: { name: 'CCTV' }
      });

     console.log('Inventario CCTV sincronizado.');
  
    try {

      const hostsCCTV = await fetchAllPages(`${hostsApiUrl}/${filial.awx_id_cctv}/hosts/`);
      const enabledHostIdsFromAPI = hostsCCTV.map(host => host.id);
  
      for (const host of hostsCCTV) {
        const [existingHost] = await CCTV.upsert({
          id: host.id,
          name: host.name,
          description: host.description,
          inventory_id: 347,  
          filial_id: filial.id,
          enabled: host.enabled
        }, { returning: true });
        await syncJobHostSummaries(host.id, 347);

      const jobSummaries = await JobHostSummary.findAll({
        where: { cctv_id: host.id }
      });

      const newStatus = calculateHostStatus({ ...existingHost.get(), jobSummaries }, 'cctv');
      console.log(`🔍 Host: ${host.name} | Estado Calculado: ${newStatus}`);

      if (existingHost.status !== newStatus) {
        console.log(`🔄 Estado cambiado: ${existingHost.status} → ${newStatus}`);
        await CCTV.update(
          { status: newStatus },
          { where: { id: existingHost.id } }
        );
        console.log(`✅ Estado actualizado en la base de datos: ${newStatus}`);
      } else {
        console.log(`ℹ️ El estado del host ${host.name} no ha cambiado (${existingHost.status})`);
      }
      }

      /*await CCTV.destroy({
        where: {
          filial_id: filial.id,
          id: { [Op.notIn]: enabledHostIdsFromAPI }  
        }
      });*/

      await captureAndDeleteMissingHosts(CCTV, filial.id, enabledHostIdsFromAPI, 'cctv');
  
      console.log(`Hosts CCTV de la filial ${filial.name} sincronizados.`);
    } catch (error) {
      console.error(`Error al sincronizar hosts CCTV de la filial ${filial.name}:`, error.message);
    }
  };

  export const syncJobHostSummaries = async (hostId, inventoryId) => {
    const jobSummariesUrl = `http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/${hostId}/job_host_summaries/`;
    try {
      const jobSummaries = await fetchAllPages(jobSummariesUrl);
      for (const summary of jobSummaries) {
        await JobHostSummary.upsert({
          id: summary.id,
          failed: summary.failed,
          workstation_id: inventoryId === 22 ? hostId : null,
          cctv_id: inventoryId === 347 ? hostId : null,
          job_id: summary.summary_fields.job.id,  
          job_name: summary.summary_fields.job.name,
          jobCreationDate: new Date(summary.created)
        });
      }
      console.log(`JobHostSummaries del host ${hostId} sincronizados.`);
    } catch (error) {
      console.error(`Error al sincronizar JobHostSummaries del host ${hostId}:`, error.message);
    }
  };
  

  export const syncSingleFilial = async (filialId) => {
    console.log(`Iniciando sincronización de la filial con ID: ${filialId}`);
    try {
        const filial = await Filial.findByPk(filialId);

        if (!filial) {
            throw new Error(`Filial con ID ${filialId} no encontrada`);
        }
        console.log(`Filial encontrada: ${filial.name}`);

        if (filial.awx_id_wst) {
            console.log(`Procesando hosts WST para la filial ${filial.name}`);
            const hostsWST = await fetchAllPages(`http://sawx0001lx.bancocredicoop.coop/api/v2/groups/${filial.awx_id_wst}/hosts/`);
            const enabledHostIdsFromAPI = hostsWST.filter(host => host.enabled).map(host => host.id);
            console.log(`Hosts WST recibidos: ${hostsWST.length}`);

            for (const host of hostsWST) {
              console.log(`Procesando host WST: ${host.name}`);
                const [existingHost] = await Workstation.upsert({
                    id: host.id,
                    name: host.name,
                    description: host.description,
                    inventory_id: 22,
                    filial_id: filial.id,
                    enabled: host.enabled,
                }, { returning: true });

                await syncJobHostSummaries(host.id, 22);

                const jobSummaries = await JobHostSummary.findAll({
                    where: { workstation_id: host.id }
                });

                const newStatus = calculateHostStatus({ ...existingHost.get(), jobSummaries }, 'wst');
                console.log(`🔍 Host: ${host.name} | Estado Calculado: ${newStatus}`);

                if (existingHost.status !== newStatus) {
                    console.log(`🔄 Estado cambiado: ${existingHost.status} → ${newStatus}`);
                    await Workstation.update(
                        { status: newStatus },
                        { where: { id: existingHost.id } }
                    );
                    console.log(`✅ Estado actualizado en la base de datos: ${newStatus}`);
                } else {
                    console.log(`ℹ️ El estado del host ${host.name} no ha cambiado (${existingHost.status})`);
                }
            }

            /*await Workstation.destroy({
                where: {
                    filial_id: filial.id,
                    id: { [Op.notIn]: enabledHostIdsFromAPI },
                }
            });*/
            console.log(`Ejecutando helper para capturar y eliminar hosts WST que ya no están en la API`);
            await captureAndDeleteMissingHosts(Workstation, filial.id, enabledHostIdsFromAPI, 'workstation');
        }

        if (filial.awx_id_cctv) {
            const hostsCCTV = await fetchAllPages(`http://sawx0001lx.bancocredicoop.coop/api/v2/groups/${filial.awx_id_cctv}/hosts/`);
            const enabledHostIdsFromAPI = hostsCCTV.filter(host => host.enabled).map(host => host.id);

            for (const host of hostsCCTV) {
                const [existingHost] = await CCTV.upsert({
                    id: host.id,
                    name: host.name,
                    description: host.description,
                    inventory_id: 347,
                    filial_id: filial.id,
                    enabled: host.enabled,
                }, { returning: true });

                await syncJobHostSummaries(host.id, 347);

                const jobSummaries = await JobHostSummary.findAll({
                    where: { workstation_id: host.id }
                });

                const newStatus = calculateHostStatus({ ...existingHost.get(), jobSummaries }, 'cctv');
                console.log(`🔍 Host: ${host.name} | Estado Calculado: ${newStatus}`);

                if (existingHost.status !== newStatus) {
                    console.log(`🔄 Estado cambiado: ${existingHost.status} → ${newStatus}`);
                    await CCTV.update(
                        { status: newStatus },
                        { where: { id: existingHost.id } }
                    );
                    console.log(`✅ Estado actualizado en la base de datos: ${newStatus}`);
                } else {
                    console.log(`ℹ️ El estado del host ${host.name} no ha cambiado (${existingHost.status})`);
                }
            }

            /*await CCTV.destroy({
                where: {
                    filial_id: filial.id,
                    id: { [Op.notIn]: enabledHostIdsFromAPI },
                }
            });*/

            await captureAndDeleteMissingHosts(CCTV, filial.id, enabledHostIdsFromAPI, 'cctv');
        }

        io.emit('db-updated', { source: 'Actualizacion template db' });
        console.log(`Filial ${filialId} sincronizada correctamente.`);
    } catch (error) {
        console.error(`Error al sincronizar la filial ${filialId}:`, error.message);
        throw error;
    }
};