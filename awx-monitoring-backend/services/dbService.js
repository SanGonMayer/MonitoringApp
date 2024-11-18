import Filial from '../models/filiales.js'; 
import { Op } from 'sequelize'; 
import CCTV from '../models/cctv.js';
import Workstation from '../models/workstations.js';



    /**
     * @returns {Promise<Array>}
     */

export const getFilialesFromDB = async () => {
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



/* ------------ NUEVAS PRUEBAS */

/* 
export const getFilialesConHosts = async (tipoTerminal) => {
    try {
        const modelo = tipoTerminal === 'WORKSTATION' ? Workstation : CCTV;
        // Consulta para obtener solo las filiales que tienen al menos un host en la tabla CCTV
        const filiales = await Filial.findAll({
            attributes: ['id', 'name', 'description', 'awx_id_wst', 'awx_id_cctv'],
            include: [
                {
                    model: modelo,
                    required: true, // Solo incluye filiales que tienen al menos un registro en CCTV
                    where: {
                        filial_id: { [Op.col]: 'Filial.id' } // Verifica que CCTV.filial_id coincida con Filial.id
                    },
                    attributes: [] // No necesitas datos de CCTV, solo verificar la existencia
                },
            ],
        });

        // Mapeo de las filiales para incluir los atributos requeridos
        return filiales.map(filial => ({
            id: filial.id,
            name: filial.name,
            description: filial.description,
            hasWST: filial.awx_id_wst !== null,
            hasCCTV: filial.awx_id_cctv !== null,
        }));
    } catch (error) {
        console.error('Error al obtener las filiales de la base de datos:', error.message);
        throw error;
    }
}; */

export const getFilialesConHosts = async (tipoTerminal) => {
    try {
        const modelo = tipoTerminal === 'WORKSTATION' ? Workstation : CCTV;
        // Consulta para obtener solo las filiales que tienen al menos un host en la tabla CCTV
        const filiales = await Filial.findAll({
            attributes: ['id', 'name', 'description', 'awx_id_wst', 'awx_id_cctv'],
            include: [
                {
                    model: modelo,
                    required: true, // Solo incluye filiales que tienen al menos un registro en CCTV
                    where: {
                        filial_id: { [Op.col]: 'Filial.id' } // Verifica que CCTV.filial_id coincida con Filial.id
                    },
                    attributes: [] // No necesitas datos de CCTV, solo verificar la existencia
                },
            ],
        });

        const extractNumber = (filialName) => {
            const match = filialName.match(/\d+/); // Buscar números en el nombre
            return match ? parseInt(match[0], 10) : NaN; // Devolver el número encontrado, o NaN si no hay
        };

        // Ordenar las filiales según el número extraído
        const filialesOrdenadas = filiales.sort((a, b) => extractNumber(a.name) - extractNumber(b.name));
        //console.log('Filiales con hosts ordenadas:', filialesOrdenadas.map(filial => filial.name));

        // Loguear cada filial individualmente
        filialesOrdenadas.forEach(filial => {
            console.log('Filial:', filial.name);  // Esto mostrará el nombre de cada filial
        });

        // Mapeo de las filiales para incluir los atributos requeridos
        return filialesOrdenadas.map(filial => ({
            id: filial.id,
            name: filial.name,
            description: filial.description,
            hasWST: filial.awx_id_wst !== null,
            hasCCTV: filial.awx_id_cctv !== null,
        }));
    } catch (error) {
        console.error('Error al obtener las filiales de la base de datos:', error.message);
        throw error;
    }
};