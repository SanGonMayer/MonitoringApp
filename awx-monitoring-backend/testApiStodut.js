import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { requestLoggerMiddleware } from './middlewares/solicitudes.js';
import { corsMiddleware } from './middlewares/cors.js';
import base64 from 'base-64';  // Para codificar en base64

dotenv.config();

const app = express();
const username = process.env.AWX_USER_TEST;
const password = process.env.AWX_USER_TEST_PASS;
const PORT = process.env.PORT;

const authConfig = {
    headers: {
        'Authorization': `Basic ${base64.encode(`${username}:${password}`)}`
    }
};

app.use(express.json()); 
app.use(requestLoggerMiddleware());
app.use(corsMiddleware())


// URL base para obtener grupos e hosts
const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories'; // Parte base de la URL para los inventarios
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups'; 



async function fetchAllPages(apiUrl) {
  let page = 1;
  let allData = [];
  let morePages = true;

  while (morePages) {
    try {
      // Realizamos la solicitud a la API con el número de página actual
      const response = await axios.get(`${apiUrl}?page=${page}`, authConfig);
      // Evaluamos si la API nos devolvió el error de página inválida en el JSON
      if (response.data.detail === "Página inválida.") {
        morePages = false; // Terminamos el bucle
      } else {
        // los datos están en response.data.results
        const data = response.data.results;
        //console.log(data);
        allData = allData.concat(data); // Agregamos los datos a la lista
        page++; // Pasamos a la siguiente página
      }
    } catch (error) {
      //console.error(`Error fetching page ${page}:`, error.message);
      morePages = false; // Detenemos el bucle por cualquier otro error inesperado
    }
  }
  return allData;
}


app.get('/api/awx/inventories/:inventoryId/groups', async (req, res) => {
    const inventoryId = req.params.inventoryId; // Obtener inventoryId dinámicamente desde la URL

    try {
        // Obtener la lista de grupos para el inventario específico
        const awxResponse = await fetchAllPages(`${baseApiUrl}/${inventoryId}/groups/`)

        const groups = awxResponse.filter(group => group.name.toLowerCase() !== 'wst' && group.name.toLowerCase() !== 'pve')
        .map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            hostsUrl: group.related.hosts // URL para obtener los hosts de este grupo
        }));
        res.json(groups);
    } catch (error) {
        console.error('Error al conectar a la API de AWX:', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX' });
    }
});


async function getJobSummaries(host, templateName) {
    const jobSummariesUrl = `http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/${host.id}/job_host_summaries/`;
    console.log(`Obteniendo trabajos para el host ${host.name} desde: ${jobSummariesUrl}`);

    let status = 'No ejecutado';
    let jobNames = [];

    try {
        const jobSummaries = await fetchAllPages(jobSummariesUrl, authConfig);
        jobNames = jobSummaries.map(job => job.summary_fields.job.name);

        const matchingJob = jobSummaries.find(job => job.summary_fields.job.name === templateName);

        if (matchingJob.failed) {
            status = 'Fallido';
        } else {
            status = 'Actualizado';
        }
    } catch (error) {
        console.error(`Error al obtener trabajos para el host ${host.name}:`, error.message);
    }

    return {
        id: host.id,
        name: host.name,
        description: host.description,
        inventory: host.inventory,
        status: status,
        enabled: host.enabled,
        jobNames: jobNames
    };
}

// Ruta principal: Obtener los hosts y su estado
app.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', async (req, res) => {
    const groupId = req.params.groupId;
    const templateName = 'wst_upd_v1.7.19'; // Plantilla a verificar

    try {
        // Obtener todos los hosts habilitados para el grupo
        const awxResponse = await fetchAllPages(`${hostsApiUrl}/${groupId}/hosts/`);
        const enabledHosts = awxResponse.filter(host => host.enabled);

        // Obtener el estado de cada host
        const hosts = await Promise.all(
            enabledHosts.map(async (host) => await getJobSummaries(host, templateName))
        );

        // Responder con el estado de los hosts
        res.json(hosts);
    } catch (error) {
        console.error('Error al obtener los hosts:', error.message);
        res.status(500).json({ error: 'Error al obtener los hosts' });
    }
});


app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});