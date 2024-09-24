import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const username = process.env.AWX_USER_TEST;
const password = process.env.AWX_USER_TEST_PASS;

const app = express();
const PORT = 3000;

app.use(cors());

// URL base para obtener grupos e hosts
const wstApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories/22';
const cctvApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories/347';
const hostsApiUrl= 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';

// obtener todos los resultados paginados desde la API de AWX
async function fetchAllPages(apiUrl, authConfig) {
    let allResults = [];
    let currentPage = apiUrl;

    // Mientras haya una página siguiente, hago peticiones
    while (currentPage) {
        const response = await axios.get(currentPage, authConfig);
        allResults = allResults.concat(response.data.results); // Agregar los resultados de la página actual
        currentPage = response.data.next; // `next` contiene la URL de la siguiente página, o `null` si no hay más
    }

    return allResults;
}

// obtener todos los grupos del inventario 22
app.get('/api/awx/inventories/22/groups', async (req, res) => {
    try {
        const authConfig = {
            auth: {
                username: username,
                password: password
            }
        };

        // Usar la función para obtener todas las páginas de grupos
        const allGroups = await fetchAllPages(`${wstApiUrl}/groups/`, authConfig);

        // Filtrar y preparar los datos de los grupos
        const groups = allGroups.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            hostsUrl: group.related.hosts // URL para obtener los hosts
        }));

        res.json(groups);
    } catch (error) {
        console.error('Error al conectar a la API de AWX:', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX' });
    }
});

// obtener todos los grupos del inventario 347
app.get('/api/awx/inventories/347/groups', async (req, res) => {
    try {
        const authConfig = {
            auth: {
                username: username,
                password: password
            }
        };

        // Usar la función para obtener todas las páginas de grupos
        const allGroups = await fetchAllPages(`${cctvApiUrl}/groups/`, authConfig);

        // Filtrar y preparar los datos de los grupos
        const groups = allGroups.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            hostsUrl: group.related.hosts // URL para obtener los hosts
        }));

        res.json(groups);
    } catch (error) {
        console.error('Error al conectar a la API de AWX:', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX' });
    }
});


// obtener todos los hosts de un grupo específico en el inventario 22
app.get('/api/awx/inventories/22/groups/:groupId/hosts', async (req, res) => {
    const groupId = req.params.groupId;

    try {
        const authConfig = {
            auth: {
                username: username,
                password: password
            }
        };

        // Usar la función para obtener todas las páginas de hosts
        const allHosts = await fetchAllPages(`${hostsApiUrl}/${groupId}/hosts/`, authConfig);

        res.json(allHosts);
    } catch (error) {
        console.error('Error al obtener los hosts:', error.message);
        res.status(500).json({ error: 'Error al obtener los hosts' });
    }
});

// obtener todos los hosts de un grupo específico en el inventario 347
app.get('/api/awx/inventories/347/groups/:groupId/hosts', async (req, res) => {
    const groupId = req.params.groupId;

    try {
        const authConfig = {
            auth: {
                username: username,
                password: password
            }
        };

        // Usar la función para obtener todas las páginas de hosts
        const allHosts = await fetchAllPages(`${hostsApiUrl}/${groupId}/hosts/`, authConfig);

        res.json(allHosts);
    } catch (error) {
        console.error('Error al obtener los hosts:', error.message);
        res.status(500).json({ error: 'Error al obtener los hosts' });
    }
});

app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});
