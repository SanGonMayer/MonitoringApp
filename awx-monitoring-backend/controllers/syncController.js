import { syncSingleFilial } from '../services/syncService.js';
import axios from 'axios';
import { obtenerIdDeFilial } from '../models/filiales.js';


const username = process.env.AWX_SERVER_USER;
const password = process.env.AWX_SERVER_PASS;

const authConfig = {
  headers: {
    'Authorization': `Basic ${base64.encode(`${username}:${password}`)}`,
  },
};


export const updateSingleFilial = async (req, res) => {
    const { filialId } = req.params;
    try {
        await syncSingleFilial(filialId);
        res.status(200).json({ message: `Filial ${filialId} actualizada correctamente.` });
    } catch (error) {
        console.error('Error al actualizar la filial:', error.message);
        res.status(500).json({ error: 'Error al actualizar la filial' });
    }
};


export const syncDbFilialWithTemplate = async (req, res) => {
    try {
        // Imprimir todo el cuerpo del webhook para ver qué datos llegan
        console.log('Este es todo el body del job finalizado del webhook: ', req.body);

        const { id, limit, inventory} = req.body; // Extrae el jobId y limit del cuerpo

        if (!id) {
            return res.status(400).json({ error: 'El campo "id" es obligatorio en el payload.' });
        }

        console.log(`Job ID recibido: ${id}`);
        console.log(`Limit recibido: ${limit}`);
        console.log(`Inventary recibido: ${inventory}`);

        // Llamar a la función para procesar el limit y actualizar las filiales
        if (limit) {
            await procesarLimit(limit, inventory);  // Llama a la función procesarLimit con el valor de limit
        }

        //io.emit('db-updated', { source: 'Actualizacion template db' });

        res.status(200).json({ message: `Actualizado correctamente.` });
      } catch (error) {
        console.error('Error procesando el webhook:', error);
        res.status(500).json({ error: 'Error procesando el webhook' });
      }
};


const procesarLimit = async (limit, inventory) => {
    const elementos = limit.split(/[: ,]+/);
    let filialesAActualizar = new Set(); // Usamos un Set para eliminar duplicados
  
    for (const elem of elementos) {
        if (esFilial(elem)) {
            console.log('Es un filial: ', elem);
            filialesAActualizar.add(elem);
            
        } else if (esHost(elem)) {
            console.log('Es un host: ', elem);
            const filialDelHost = await obtenerFilialPorHost(elem, inventory); 
            console.log('Su filial es: ', filialDelHost);
            filialesAActualizar.add(filialDelHost);
            
        } 
    }
    await actualizarFiliales(filialesAActualizar);
};
  
const esFilial = (elem) => {
    return /^f\d{4}$/.test(elem);
};
  
const esHost = (elem) => {
    return /^[a-zA-Z0-9\-]+$/.test(elem);
};
  

const obtenerFilialPorHost = async (host,inventory) => {
    try{
        const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories';

        let inventario = ''

        if (inventory === 'wst'){
            inventario = 22;
        } else if ( inventory === 'cctv'){
            inventario = 347;
        }

        console.log('Host:', host, 'Inventario:', inventario);
        console.log('host:',host.trim());

        const response = await axios.get(`${baseApiUrl}/${inventario}/hosts?name=${host}`, authConfig);

        let filialEncontrada = '';
        filialEncontrada = response.data.results[0].summary_fields.groups.results[0].name.trim();

        if (!filialEncontrada.startsWith('f')) {
            filialEncontrada = response.data.results[0].summary_fields.groups.results[1].name.trim();
        }
        console.log('La filial encontrada para este host es: ', filialEncontrada);
        return filialEncontrada; 
    } catch(error){
        console.error('Error al obtener la filial del host:', error);
    }
};
  

const actualizarFiliales = async (filiales) => {
    console.log(`Actualizando las filiales: ${[...filiales]}`);

    // Función para esperar
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const filialName of filiales) {
        try {
            const filialId = await obtenerIdDeFilial(filialName);
            console.log('El id asociado a la filial', filialName, ' es ', filialId);
        
            if (filialId) {
                await syncSingleFilial(filialId);
                console.log(`Filial ${filialName} actualizada con éxito`);
            } else {
                console.log(`No se pudo encontrar el ID para la filial ${filialName}`);
            }
            // Espera de 10 segundos antes de pasar al siguiente elemento
            await wait(10000);
        } catch (error) {
            console.error(`Error al procesar la filial ${filialName}:`, error);
        }
    }
};
  