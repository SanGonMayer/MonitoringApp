import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';
// import JobHostSummary from '../models/jobHostSummary.js';

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
        
      });
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