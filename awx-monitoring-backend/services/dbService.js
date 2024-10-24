import Filial from '../models/filiales.js'; 
import { Op } from 'sequelize'; 


    /**
     * @returns {Promise<Array>}
     */

export const getFiliales = async () => {
    try {
        
        const filiales = await Filial.findAll({
            attributes: ['id', 'name', 'description', 'awx_id_wst', 'awx_id_cctv']
        });

        
        return filiales.map(filial => ({
            id: filial.id,
            name: filial.name,
            description: filial.description,
            hasWST: filial.awx_id_wst !== null, 
            hasCCTV: filial.awx_id_cctv !== null 
        }));
    } catch (error) {
        console.error('Error al obtener las filiales de la base de datos:', error.message);
        throw error; 
    }
};
