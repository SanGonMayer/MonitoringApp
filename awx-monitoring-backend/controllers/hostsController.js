import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
import JobHostSummary from '../models/jobHostSummary.js';

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
        where: { filial_id: filialIdInt },
        include: [
            {
                model: JobHostSummary,
                as: 'jobSummaries',
                attributes: ['job_name', 'failed'],
                required: false
            }
        ],
      });

      const hostsWithStatus = hosts.map(host => {
        const jobSummaries = host.jobSummaries || [];

        console.log(`Host ${host.id} - ${host.name} tiene ${jobSummaries.length} trabajos.`);

        // Buscar el último "wst_ipa_v"
        const lastIPAIndex = jobSummaries.findIndex(
          summary => summary.job_name.startsWith('wst_ipa_v')
        );
        const hasIPA = lastIPAIndex !== -1;

        // Buscar si hay un "wst_upd_v1.7.19" exitoso posterior al último "wst_ipa_v"
        const successfulUpdateAfterIPA = jobSummaries.slice(0, lastIPAIndex).find(
          summary => summary.job_name === 'wst_upd_v1.7.19' && !summary.failed
        );

        // Si no hay ningún "wst_ipa_v" y hay un "wst_upd_v1.7.19" exitoso
        if (!hasIPA && jobSummaries.some(
          summary => summary.job_name === 'wst_upd_v1.7.19' && !summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} no tiene "wst_ipa_v", pero tiene un "wst_upd_v1.7.19" exitoso. Marcado como actualizado.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            enabled: host.enabled,
          };
        }

        // Si hay un "wst_ipa_v" y al menos un "wst_upd_v1.7.19" exitoso después de él, está actualizado
        if (hasIPA && successfulUpdateAfterIPA) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_upd_v1.7.19" exitoso después del "wst_ipa_v". Marcado como actualizado.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'actualizado',
            enabled: host.enabled,
          };
        }

        // Si hay un "wst_upd_v1.7.19" pero todos fallaron, está fallido
        if (jobSummaries.some(summary => summary.job_name === 'wst_upd_v1.7.19' && summary.failed)) {
          console.log(`Host ${host.id} - ${host.name} tiene un "wst_upd_v1.7.19" fallido. Marcado como fallido.`);
          return {
            id: host.id,
            name: host.name,
            description: host.description,
            status: 'fallido',
            enabled: host.enabled,
          };
        }

        console.log(`Host ${host.id} - ${host.name} está pendiente de un "wst_upd_v1.7.19" después del "wst_ipa_v1.7.10".`);

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
        where: { filial_id: filialIdInt },
        
      });
    } else {
      return res.status(400).json({ error: 'Tipo de terminal inválido' });
    }

    const hostsWithJobs = hosts.map(host => ({
      id: host.id,
      name: host.name,
      description: host.description,
      status: 'Actualizado',  
      enabled: host.enabled,
      
    }));

    res.status(200).json(hostsWithJobs);
  } catch (error) {
    console.error('Error al obtener hosts:', error.message);
    res.status(500).json({ error: 'Error al obtener hosts', details: error });
  }
};