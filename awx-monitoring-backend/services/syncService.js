import { fetchAllPages } from './awxService.js';
import Filial from '../models/filiales.js';
import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import JobHostSummary from '../models/jobHostSummary.js';
import Job from '../models/jobs.js';
import Inventory from '../models/inventory.js';

const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories';
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';
const gruposExcluidos = [
  'f0504', 'f0509', 'f0513', 'f0514', 'f0559', 'f0579', 'f0580', 'f0583', 'f0584', 'f0593', 'f0594', 'f0595', 'f0597', 'f0652', 'f0653', 'f0688', 'f0703',
  'f0071', 'f0517', 'f0603', 'f0661', 'f0662', 'f0663', 'f0664', 'f0665', 'f0668',
  'wst', 'pve', 'f0999'
];


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
      await Filial.findOrCreate({
        where: { name: groupData.name },
        defaults: {
          description: groupData.description,
          awx_id_wst: groupData.awx_id_wst,
          awx_id_cctv: groupData.awx_id_cctv,
        }
      });
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
    
      console.log('Inventario CCTV sincronizado.');
  
    try {
      const hostsWST = await fetchAllPages(`${hostsApiUrl}/${filial.awx_id_wst}/hosts/`);
  
      for (const host of hostsWST) {
        await Workstation.upsert({
          id: host.id,
          name: host.name,
          description: host.description,
          inventory_id: 22, 
          filial_id: filial.awx_id_wst, 
        });
        await syncJobHostSummaries(host.id, 22); 
      }
  
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
  
      for (const host of hostsCCTV) {
        await CCTV.upsert({
          id: host.id,
          name: host.name,
          description: host.description,
          inventory_id: 347,  
          filial_id: filial.awx_id_cctv,
        });
        await syncJobHostSummaries(host.id, 347);
      }
  
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
        });
      }
      console.log(`JobHostSummaries del host ${hostId} sincronizados.`);
    } catch (error) {
      console.error(`Error al sincronizar JobHostSummaries del host ${hostId}:`, error.message);
    }
  };
  