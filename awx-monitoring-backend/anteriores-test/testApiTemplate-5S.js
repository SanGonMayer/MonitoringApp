import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { requestLoggerMiddleware } from '../middlewares/solicitudes.js';
import { corsMiddleware } from '../middlewares/cors.js';
import base64 from 'base-64';  // Para codificar en base64
app.set('view engine', 'ejs');

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


// Ruta para obtener las filiales (grupos) de un inventario específico
app.get('/api/awx/inventories/:inventoryId/groups', async (req, res) => {
    const inventoryId = req.params.inventoryId; // Obtener inventoryId dinámicamente desde la URL

    try {
        // Obtener la lista de grupos para el inventario específico
        const awxResponse = await fetchAllPages(`${baseApiUrl}/${inventoryId}/groups/`)
        // Filtrar solo 5 grupos para el test
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


// Funcion para obtener lo de las demas paginas 1,2,3,4,etc
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


// Ruta para obtener los hosts de un grupo específico dentro de un inventario
app.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', async (req, res) => {
    const groupId = req.params.groupId; // Obtener groupId dinámicamente desde la URL
    const templateName = 'wst_upd_v1.7.19'; // Nombre de la plantilla a verificar

    try {
        // Obtener la lista de hosts para el grupo especificado dentro del inventario
        const awxResponse = await fetchAllPages(`${hostsApiUrl}/${groupId}/hosts/`);
        const enabledHosts = awxResponse.filter(host => host.enabled);

        const hosts = await Promise.all(
            enabledHosts.map(async host => {
                // Construir la URL de job_host_summaries para este host
                const jobSummariesUrl = `http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/${host.id}/job_host_summaries/`;
                console.log(`Obteniendo trabajos para el host ${host.name} desde: ${jobSummariesUrl}`); // Depuración

                let status = 'No ejecutado';
                let jobNames = []; 
                try {
                    // Obtener los resúmenes de trabajos desde la URL
                    const jobSummaries = await fetchAllPages(jobSummariesUrl, authConfig);
                    //console.log(`Trabajos obtenidos para ${host.name}:`, JSON.stringify(jobSummaries, null, 2)); // Depuración

                    jobNames = jobSummaries.map(job => job.summary_fields.job.name);

                    // Recorrer todos los trabajos y verificar si alguno coincide con el nombre y estado "successful"
                    const matchingJob = jobSummaries.find(job => {
                        const jobName = job.summary_fields.job.name;
                        const jobStatus = job.summary_fields.job.status;
                        //console.log(`Verificando trabajo: ${jobName}, estado: ${jobStatus}`);
                        return jobName === templateName && jobStatus === 'successful';
                    });

                    // Actualizar el estado si encontramos un trabajo que coincide
                    if (matchingJob) {
                        status = 'Actualizado';
                    } else if (jobSummaries.some(job => job.summary_fields.job.name === templateName)) {
                        status = 'Fallido';
                    }
                } catch (error) {
                    console.error(`Error al obtener trabajos para el host ${host.name}:`, error.message); // Depuración
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
            })
        );

        res.json(hosts);
    } catch (error) {
        console.error('Error al obtener los hosts:', error.message);
        res.status(500).json({ error: 'Error al obtener los hosts' });
    }
});




////////////////////////////////////////////////////////////

app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});