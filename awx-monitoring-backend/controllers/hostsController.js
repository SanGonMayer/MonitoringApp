import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import JobHostSummary from '../models/jobHostSummary.js';
import Filial from '../models/filiales.js';
import { Op } from 'sequelize';



/* export const getHostsByFilial = async (req, res) => {
  try {
    const { filialId } = req.params;
    const { tipo } = req.query; 

    console.log('Filial ID antes de convertir:', filialId);
    console.log('Tipo de terminal:', tipo);

    const filialIdInt = parseInt(filialId, 10);
    console.log('Filial ID después de convertir a entero:', filialIdInt);

    if (isNaN(filialIdInt)) {
      return res.status(400).json({ error: 'El ID de la filial debe ser un número válido.' });
    }

    let hosts;
    if (tipo === 'wst') {
      hosts = await Workstation.findAll({
        where: { 
          filial_id: filialIdInt, 
          enabled: true, 
          description: { [Op.notILike]: 'HP ProDesk 400%' } 
        },
        include: [
          {
            model: JobHostSummary,
            as: 'jobSummaries',
            attributes: ['job_name', 'failed', 'jobCreationDate'],
            required: false,
          }
        ],
      });

      const hostsWithStatus = hosts.map(host => {
        const jobSummaries = (host.jobSummaries || []).sort((a, b) => new Date(b.jobCreationDate) - new Date(a.jobCreationDate));

        console.log(`Host ${host.id} - ${host.name} tiene ${jobSummaries.length} trabajos ordenados por fecha de creación.`);

        // Buscar el último "wst_ipa_v"
        const lastIPAIndex = jobSummaries.findIndex(summary => summary.job_name.startsWith('wst_ipa_v'));
        const hasIPA = lastIPAIndex !== -1;

        // Buscar si hay un "wst_upd_v1.8.1" exitoso posterior al último "wst_ipa_v"
        const successfulUpdateAfterIPA = jobSummaries.slice(0, lastIPAIndex).find(
          summary => summary.job_name === 'wst_upd_v1.8.1' && !summary.failed
        );

        // Si no hay ningún "wst_ipa_v" y hay un "wst_upd_v1.8.1" exitoso
        if (!hasIPA && jobSummaries.some(summary => summary.job_name === 'wst_upd_v1.8.1' && !summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} no tiene "wst_ipa_v", pero tiene un "wst_upd_v1.8.1" exitoso. Marcado como actualizado.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            enabled: host.enabled,
          };
        }

        // Si hay un "wst_ipa_v" y al menos un "wst_upd_v1.8.1" exitoso después de él, está actualizado
        if (hasIPA && successfulUpdateAfterIPA) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_upd_v1.8.1" exitoso después del "wst_ipa_v". Marcado como actualizado.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            enabled: host.enabled,
          };
        }

        // Si hay un "wst_upd_v1.8.1" pero todos fallaron, está fallido
        if (jobSummaries.some(summary => summary.job_name === 'wst_upd_v1.8.1' && summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_upd_v1.8.1" fallido. Marcado como fallido.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'fallido',
            enabled: host.enabled,
          };
        }

        console.log(`Host ${host.id} - ${host.name} está pendiente de un "wst_upd_v1.8.1" después del "wst_ipa_v1.7.10".`);

        return {
          id: host.id,
          name: host.name,
          description: host.description,
          status: 'pendiente',  
        };
      });

      return res.status(200).json(hostsWithStatus);

    } else if (tipo === 'cctv') {
      hosts = await CCTV.findAll({
        where: { 
            filial_id: filialIdInt, 
            enabled: true 
            //description: { [Op.notILike]: 'HP ProDesk 400%' } 
          },
        include: [
          {
            model: JobHostSummary,
            as: 'jobSummaries',
            attributes: ['job_name', 'failed', 'jobCreationDate'],
            required: false
          }
        ],
      });
    
      const hostsWithStatus = hosts.map(host => {
        const jobSummaries = (host.jobSummaries || []).sort((a, b) => new Date(b.jobCreationDate) - new Date(a.jobCreationDate));
        console.log(`Host ${host.id} - ${host.name} tiene ${jobSummaries.length} trabajos ordenados por fecha de creación.`);
    
        // Verificar si hay un "ctv_upd_v0.2.0" exitoso
        const successfulUpdate = jobSummaries.find(
          summary => summary.job_name === 'ctv_upd_v0.2.0' && !summary.failed
        );
    
        // Si existe un "ctv_upd_v0.2.0" exitoso, el host está actualizado
        if (successfulUpdate) {
          console.log(`Host ${host.id} - ${host.name} tiene un "ctv_upd_v0.2.0" exitoso. Marcado como actualizado.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            enabled: host.enabled,
          };
        }
    
        // Si hay un "ctv_upd_v0.2.0" pero todos fallaron, el host está fallido
        if (jobSummaries.some(summary => summary.job_name === 'ctv_upd_v0.2.0' && summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} tiene un "ctv_upd_v0.2.0" fallido. Marcado como fallido.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'fallido',
            enabled: host.enabled,
          };
        }
    
        // Si no hay un "ctv_upd_v0.2.0" exitoso ni fallido, está pendiente
        console.log(`Host ${host.id} - ${host.name} está pendiente de un "ctv_upd_v0.2.0".`);
    
        return {
          id: host.id,
          name: host.name,
          description: host.description,
          status: 'pendiente',
          enabled: host.enabled,
        };
      });
    
      return res.status(200).json(hostsWithStatus);
    } else {
      return res.status(400).json({ error: 'Tipo de terminal inválido' });
    }
    
  } catch (error) {
    console.error('Error al obtener hosts:', error.message);
    res.status(500).json({ error: 'Error al obtener hosts', details: error });
  }
}; */

export const getHostsByFilial = async (req, res) => {
  try {
    const { filialId } = req.params;
    const { tipo } = req.query; 

    console.log('Filial ID antes de convertir:', filialId);
    console.log('Tipo de terminal:', tipo);

    const filialIdInt = parseInt(filialId, 10);
    console.log('Filial ID después de convertir a entero:', filialIdInt);

    if (isNaN(filialIdInt)) {
      return res.status(400).json({ error: 'El ID de la filial debe ser un número válido.' });
    }

    let hosts;
    if (tipo === 'wst') {
      hosts = await Workstation.findAll({
        where: { 
          filial_id: filialIdInt, 
          enabled: true, 
          description: { [Op.notILike]: 'HP ProDesk 400%' } 
        },
        include: [
          {
            model: JobHostSummary,
            as: 'jobSummaries',
            attributes: ['job_name', 'failed', 'jobCreationDate'],
            required: false,
          }
        ],
      });

      const hostsWithStatus = hosts.map(host => {
        const jobSummaries = (host.jobSummaries || []).sort((a, b) => new Date(b.jobCreationDate) - new Date(a.jobCreationDate));

        console.log(`Host ${host.id} - ${host.name} tiene ${jobSummaries.length} trabajos ordenados por fecha de creación.`);

        // Buscar el último "wst_ipa_v"
        const lastIPAIndex = jobSummaries.findIndex(summary => summary.job_name.startsWith('wst_ipa_v'));
        const hasIPA = lastIPAIndex !== -1;

        // Filtrar la lista de trabajos si existe un "wst_ipa_v"
        const filteredSummaries = hasIPA ? jobSummaries.slice(0, lastIPAIndex) : jobSummaries;
        const succesfulUpdates = filteredSummaries.filter(
          summary => summary.job_name === 'wst_upd_v1.8.1' && !summary.failed
        );

        // Si no hay ningún "wst_ipa_v" y hay un "wst_upd_v1.8.1" exitoso
        if (!hasIPA && succesfulUpdates.length > 0) {
          console.log(`Host ${host.id} - ${host.name} no tiene "wst_ipa_v", pero tiene un "wst_upd_v1.8.1" exitoso. Marcado como actualizado.`);

          const oldestSuccessfulUpdate = succesfulUpdates.reduce((oldest, current) =>
            new Date(current.jobCreationDate) < new Date(oldest.jobCreationDate) ? current : oldest
          );
          const rawDate = new Date(oldestSuccessfulUpdate.jobCreationDate);
          const formattedDate = rawDate.toISOString().split('T')[0].replace(/-/g, '/');

          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            dateSuccesful: formattedDate,
            enabled: host.enabled,
          };
        }

        // Si hay un "wst_ipa_v" y al menos un "wst_upd_v1.8.1" exitoso después de él, está actualizado
        if (hasIPA && succesfulUpdates.length > 0) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_upd_v1.8.1" exitoso después del "wst_ipa_v". Marcado como actualizado.`);

          const oldestSuccessfulUpdate = succesfulUpdates.reduce((oldest, current) =>
            new Date(current.jobCreationDate) < new Date(oldest.jobCreationDate) ? current : oldest
          );
          const rawDate = new Date(oldestSuccessfulUpdate.jobCreationDate);
          const formattedDate = rawDate.toISOString().split('T')[0].replace(/-/g, '/');

          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            dateSuccesful: formattedDate,
            enabled: host.enabled,
          };
        }

        // Si hay un "wst_upd_v1.8.1" pero todos fallaron, está fallido
        if (jobSummaries.some(summary => summary.job_name === 'wst_upd_v1.8.1' && summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_upd_v1.8.1" fallido. Marcado como fallido.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'fallido',
            enabled: host.enabled,
          };
        }

        console.log(`Host ${host.id} - ${host.name} está pendiente de un "wst_upd_v1.8.1" después del "wst_ipa_v1.7.10".`);

        return {
          id: host.id,
          name: host.name,
          description: host.description,
          status: 'pendiente',  
        };
      });

      return res.status(200).json(hostsWithStatus);

    } else if (tipo === 'cctv') {
      hosts = await CCTV.findAll({
        where: { 
            filial_id: filialIdInt, 
            enabled: true 
            //description: { [Op.notILike]: 'HP ProDesk 400%' } 
          },
        include: [
          {
            model: JobHostSummary,
            as: 'jobSummaries',
            attributes: ['job_name', 'failed', 'jobCreationDate'],
            required: false
          }
        ],
      });
    
      const hostsWithStatus = hosts.map(host => {
        const jobSummaries = (host.jobSummaries || []).sort((a, b) => new Date(b.jobCreationDate) - new Date(a.jobCreationDate));
        console.log(`Host ${host.id} - ${host.name} tiene ${jobSummaries.length} trabajos ordenados por fecha de creación.`);
    
        // Filtrar todos los "ctv_upd_v0.2.0" exitosos
        const succesfulUpdates = jobSummaries.filter(
          summary => summary.job_name === 'ctv_upd_v0.2.0' && !summary.failed
        );

    
        // Si existe un "ctv_upd_v0.2.0" exitoso, el host está actualizado
        if (succesfulUpdates.length > 0) {
          const oldestSuccessfulUpdate = succesfulUpdates.reduce((oldest, current) =>
            new Date(current.jobCreationDate) < new Date(oldest.jobCreationDate) ? current : oldest
          );
      
          console.log(`Host ${host.id} - ${host.name} tiene un "ctv_upd_v0.2.0" exitoso más antiguo. Marcado como actualizado.`);
      
          const rawDate = new Date(oldestSuccessfulUpdate.jobCreationDate);
          const formattedDate = rawDate.toISOString().split('T')[0].replace(/-/g, '/');
      
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            dateSuccesful: formattedDate,
            enabled: host.enabled,
          };
        }
    
        // Si hay un "ctv_upd_v0.2.0" pero todos fallaron, el host está fallido
        if (jobSummaries.some(summary => summary.job_name === 'ctv_upd_v0.2.0' && summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} tiene un "ctv_upd_v0.2.0" fallido. Marcado como fallido.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'fallido',
            enabled: host.enabled,
          };
        }
    
        // Si no hay un "ctv_upd_v0.2.0" exitoso ni fallido, está pendiente
        console.log(`Host ${host.id} - ${host.name} está pendiente de un "ctv_upd_v0.2.0".`);
    
        return {
          id: host.id,
          name: host.name,
          description: host.description,
          status: 'pendiente',
          enabled: host.enabled,
        };
      });
    
      return res.status(200).json(hostsWithStatus);
    } else {
      return res.status(400).json({ error: 'Tipo de terminal inválido' });
    }
    
  } catch (error) {
    console.error('Error al obtener hosts:', error.message);
    res.status(500).json({ error: 'Error al obtener hosts', details: error });
  }
};

export const getHostsByFilialSNRO = async (req, res) => {
  try {
    const { filialId } = req.params;
    const { tipo } = req.query; 

    console.log('Filial ID antes de convertir:', filialId);
    console.log('Tipo de terminal:', tipo);

    const filialIdInt = parseInt(filialId, 10);
    console.log('Filial ID después de convertir a entero:', filialIdInt);

    if (isNaN(filialIdInt)) {
      return res.status(400).json({ error: 'El ID de la filial debe ser un número válido.' });
    }

    let hosts;
    

    if (tipo === 'wst') {
      hosts = await Workstation.findAll({
        where: { 
            filial_id: filialIdInt, 
            enabled: true 
            //description: { [Op.notILike]: 'HP ProDesk 400%' } 
          },
        include: [
          {
            model: JobHostSummary,
            as: 'jobSummaries',
            attributes: ['job_name', 'failed', 'jobCreationDate'],
            required: false
          }
        ],
      });
    
      const hostsWithStatus = hosts.map(host => {
        const jobSummaries = (host.jobSummaries || [])
          .filter(summary => new Date(summary.jobCreationDate) >= new Date('2024-11-11')) // Filtrar trabajos a partir del 11/11/2024
          .sort((a, b) => new Date(b.jobCreationDate) - new Date(a.jobCreationDate));
    
        console.log(`Host ${host.id} - ${host.name} tiene ${jobSummaries.length} trabajos ordenados por fecha de creación.`);
    
        // Verificar si hay un "wst_crn_off_v1.4.7" exitoso
        const successfulUpdate = jobSummaries.find(
          summary => summary.job_name === 'wst_crn_off_v1.4.7' && !summary.failed
        );
    
        // Si existe un "wst_crn_off_v1.4.7" exitoso, el host está actualizado
        if (successfulUpdate) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_crn_off_v1.4.7" exitoso. Marcado como actualizado.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            enabled: host.enabled,
          };
        }
    
        // Si hay un "wst_crn_off_v1.4.7" pero todos fallaron, el host está fallido
        if (jobSummaries.some(summary => summary.job_name === 'wst_crn_off_v1.4.7' && summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_crn_off_v1.4.7" fallido. Marcado como fallido.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'fallido',
            enabled: host.enabled,
          };
        }
    
        // Si no hay un "wst_crn_off_v1.4.7" exitoso ni fallido, está pendiente
        console.log(`Host ${host.id} - ${host.name} está pendiente de un "wst_crn_off_v1.4.7".`);
    
        return {
          id: host.id,
          name: host.name,
          description: host.description,
          status: 'pendiente',
          enabled: host.enabled,
        };
      });
    
      return res.status(200).json(hostsWithStatus);
    } else {
      return res.status(400).json({ error: 'Tipo de terminal inválido' });
    }
    
  } catch (error) {
    console.error('Error al obtener hosts:', error.message);
    res.status(500).json({ error: 'Error al obtener hosts', details: error });
  }
};