import Workstation from '../models/workstations.js';
import CCTV from '../models/cctv.js';

export const getHostsByFilial = async (req, res) => {
  try {
    const { filialId } = req.params;
    const { tipo } = req.query; 

    let hosts;
    if (tipo === 'wst') {
      hosts = await Workstation.findAll({
        where: { filial_id: filialId },
      });
    } else if (tipo === 'cctv') {
      hosts = await CCTV.findAll({
        where: { filial_id: filialId },
      });
    } else {
      return res.status(400).json({ error: 'Tipo de terminal inválido' });
    }

    res.status(200).json(hosts);
  } catch (error) {
    console.error('Error al obtener hosts:', error.message);
    res.status(500).json({ error: 'Error al obtener hosts' });
  }
};
