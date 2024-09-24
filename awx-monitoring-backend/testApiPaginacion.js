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

// Verificar que las credenciales estén correctamente cargadas
console.log('AWX User:', username);
console.log('AWX Password:', password);

// URL base para todas las llamadas a la API de AWX
const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2';
const wstApiUrl = `${baseApiUrl}/inventories/22/groups`; // URL para obtener los grupos del inventario 22
const cctvApiUrl = `${baseApiUrl}/inventories/347/groups`; // URL para obtener los grupos del inventario 347
const groupHostsUrl = (groupId) => `${baseApiUrl}/groups/${groupId}/hosts`; // URL para obtener los hosts de un grupo

// Configuración de autenticación
const authConfig = {
    auth: {
        username: username,
        password: password
    }
};

/**
 * Función para obtener todos los resultados paginados de la API de AWX.
 * Si el campo `next` es una URL relativa, la convertimos en una URL absoluta.
 */
async function fetchAllPages(apiUrl, authConfig) {
    let allResults = [];
    let currentPage = apiUrl;

    // Mientras haya una página siguiente, hacemos peticiones
    while (currentPage) {
        try {
            console.log(`Obteniendo datos de la página: ${currentPage}`);
            const response = await axios.get(currentPage, authConfig);

            // Verificar la respuesta
            console.log('Datos recibidos:', response.data);

            // Concatenar los resultados
            allResults = allResults.concat(response.data.results);

            // Verificar si `next` es una URL completa o relativa
            const nextUrl = response.data.next;
            if (nextUrl) {
                // Si `next` es relativa, añadir la URL base
                currentPage = nextUrl.startsWith('http') ? nextUrl : `${baseApiUrl}${nextUrl}`;
            } else {
                currentPage = null; // No hay más páginas
            }
        } catch (error) {
            // Registrar más detalles sobre el error
            console.error(`Error al conectar a la API en la página ${currentPage}:`, error.message);
            if (error.response) {
                console.error('Detalles del error:', error.response.data);
            }
            throw new Error('Error al conectar a la API');
        }
    }

    return allResults;
}

// Ruta para obtener todos los grupos del inventario 22
app.get('/api/awx/inventories/22/groups', async (req, res) => {
    try {
        const allGroups = await fetchAllPages(wstApiUrl, authConfig);

        // Verificar si la respuesta es válida antes de enviar al frontend
        if (!Array.isArray(allGroups)) {
            console.error('Error: la respuesta de grupos no es un array:', allGroups);
            return res.status(500).json({ error: 'La respuesta de grupos no es válida' });
        }

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

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
