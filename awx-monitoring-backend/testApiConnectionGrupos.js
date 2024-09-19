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
const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories/22';

// Ruta para obtener las filiales (grupos)
app.get('/api/awx/inventories/22/groups', async (req, res) => {
    try {
        // Obtener la lista de grupos
        const awxResponse = await axios.get(`${baseApiUrl}/groups/`, {
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

// Ruta para obtener los hosts de un grupo específico
app.get('/api/awx/inventories/22/groups/:groupId/hosts', async (req, res) => {
    const groupId = req.params.groupId;
    
    try {
        // Obtener la lista de hosts para el grupo especificado
        const awxResponse = await axios.get(`${baseApiUrl}/groups/${groupId}/hosts/`, {
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
