import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { requestLoggerMiddleware } from './middlewares/solicitudes.js';

dotenv.config();

const app = express();
const username = process.env.AWX_USER_TEST;
const password = process.env.AWX_USER_TEST_PASS;
const PORT = process.env.PORT;

app.use(express.json()); 
app.use(cors());
app.use(requestLoggerMiddleware());

// URL base para obtener grupos e hosts
const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories'; // Parte base de la URL para los inventarios
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';     // Parte base de la URL para los grupos

// Ruta para obtener las filiales (grupos) de un inventario específico
app.get('/api/awx/inventories/:inventoryId/groups', async (req, res) => {
    const inventoryId = req.params.inventoryId; // Obtener inventoryId dinámicamente desde la URL

    try {
        // Obtener la lista de grupos para el inventario específico
        const awxResponse = await axios.get(`${baseApiUrl}/${inventoryId}/groups/`, {
            auth: {
                username: username,
                password: password
            }
        });

        // Filtrar solo 5 grupos para el test
        const groups = awxResponse.data.results.slice(0, 5).map(group => ({
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

// Ruta para obtener los hosts de un grupo específico dentro de un inventario
app.get('/api/awx/inventories/:inventoryId/groups/:groupId/hosts', async (req, res) => {
    const inventoryId = req.params.inventoryId; // Obtener inventoryId dinámicamente desde la URL
    const groupId = req.params.groupId;         // Obtener groupId dinámicamente desde la URL

    try {
        // Obtener la lista de hosts para el grupo especificado dentro del inventario
        const awxResponse = await axios.get(`${hostsApiUrl}/${groupId}/hosts/`, {
            auth: {
                username: username,
                password: password
            }
        });

        const hosts = awxResponse.data.results;

        res.json(hosts);
    } catch (error) {
        console.error('Error al obtener los hosts:', error.message);
        res.status(500).json({ error: 'Error al obtener los hosts' });
    }
});

app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});
