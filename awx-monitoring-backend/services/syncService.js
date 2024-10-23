import { fetchAllPages } from './awxService.js';
import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import JobHostSummary from '../models/jobHostSummary.js';
import Job from '../models/jobs.js';
import Inventory from '../models/inventory.js';

const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories';
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';
const gruposExcluidos = ['wst', 'pve', 'cctv'];


export const syncAllData = async () => {
    try {
      console.log('Iniciando la sincronización de datos desde AWX...');
  
      const updatedFiliales = [];
      const updatedHostsWST = [];
      const updatedHostsCCTV = [];
  
      const filiales = await syncFiliales();
      if (!filiales || filiales.length === 0) {
        throw new Error('No se pudieron sincronizar las filiales.');
      }
      updatedFiliales.push(...filiales);
  
      for (const filial of updatedFiliales) {
        const hostsWST = await syncHostsFromInventory22(filial);
        const hostsCCTV = await syncHostsFromInventory347(filial);
  
        if (!hostsWST) {
          throw new Error(`No se pudieron sincronizar los hosts de la filial ${filial.name}.`);
        }
  
        updatedHostsWST.push(...hostsWST);
        updatedHostsCCTV.push(...hostsCCTV);
      }
  
      await Filial.bulkCreate(updatedFiliales, { updateOnDuplicate: ['name', 'description', 'awx_id_wst', 'awx_id_cctv'] });
      await Workstation.bulkCreate(updatedHostsWST, { updateOnDuplicate: ['name', 'description', 'inventory_id', 'filial_id'] });
      await CCTV.bulkCreate(updatedHostsCCTV, { updateOnDuplicate: ['name', 'description', 'inventory_id', 'filial_id'] });
  
      console.log('Sincronización de datos completada.');
    } catch (error) {
      console.error('Error durante la sincronización de datos:', error.message);
      throw error;
      // notif
    }
  };
  

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
    
    const filialesCreadas = [];
    for (const [, groupData] of uniqueGroups) {
        
        if (!groupData.name) {
            console.error('Error: Se ha encontrado un grupo con un nombre nulo o vacío:', groupData);
            continue; // Ignorar el grupo con nombre nulo o vacío
          }
    
          console.log(`Sincronizando filial: ${groupData.name}`);

      const [filial, created] = await Filial.findOrCreate({
        where: { name: groupData.name },
        defaults: {
          description: groupData.description,
          awx_id_wst: groupData.awx_id_wst,
          awx_id_cctv: groupData.awx_id_cctv,
        }
      });
      filialesCreadas.push(filial);
      console.log(`Filial ${groupData.name} sincronizada`);
    }
    
    console.log('Sincronización de filiales completada');
    return filialesCreadas;

  } catch (error) {
    console.error('Error al sincronizar filiales:', error.message);
  }
};

  

export const syncHostsFromInventory22 = async (filial) => {
    if (!filial.awx_id_wst) {
      console.log(`La filial ${filial.name} no tiene un ID de WST asociado.`);
      return [];
    }

    await Inventory.findOrCreate({
        where: { id: 22 },
        defaults: { name: 'WST' }
      });
    
      console.log('Inventario WST sincronizado.');
  
    try {
      const hostsWST = await fetchAllPages(`${hostsApiUrl}/${filial.awx_id_wst}/hosts/`);
      const updatedWST = [];
      for (const host of hostsWST) {
        const [workstation, created] = await Workstation.upsert({
          id: host.id,
          name: host.name,
          description: host.description,
          inventory_id: 22, 
          filial_id: filial.id, 
        });
        updatedWST.push(workstation);
        await syncJobHostSummaries(host.id, 22); 
      }
  
      console.log(`Hosts WST de la filial ${filial.name} sincronizados.`);
      return updatedWST;

    } catch (error) {
      console.error(`Error al sincronizar hosts WST de la filial ${filial.name}:`, error.message);
    }
  };
  

  export const syncHostsFromInventory347 = async (filial) => {
    if (!filial.awx_id_cctv) {
      console.log(`La filial ${filial.name} no tiene un ID de CCTV asociado.`);
      return [];
    }

    await Inventory.findOrCreate({
        where: { id: 347 },
        defaults: { name: 'CCTV' }
      });

     console.log('Inventario CCTV sincronizado.');
  
    try {

      const hostsCCTV = await fetchAllPages(`${hostsApiUrl}/${filial.awx_id_cctv}/hosts/`);
      
      if (hostsCCTV.length === 0) {
        console.log(`La filial ${filial.name} no tiene hosts CCTV. Continuando...`);
        return [];
      }
      const updatedCCTV = [];
  
      for (const host of hostsCCTV) {
        const [cctv, created] = await CCTV.upsert({
          id: host.id,
          name: host.name,
          description: host.description,
          inventory_id: 347,  
          filial_id: filial.id,
        });
        updatedCCTV.push(cctv);
        await syncJobHostSummaries(host.id, 347);
      }
  
      console.log(`Hosts CCTV de la filial ${filial.name} sincronizados.`);
      return updatedCCTV;

    } catch (error) {
      console.error(`Error al sincronizar hosts CCTV de la filial ${filial.name}:`, error.message);
      throw new Error(`Error al sincronizar los hosts de la filial ${filial.name}.`);
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
        });
      }
      console.log(`JobHostSummaries del host ${hostId} sincronizados.`);
    } catch (error) {
      console.error(`Error al sincronizar JobHostSummaries del host ${hostId}:`, error.message);
    }
  };
  