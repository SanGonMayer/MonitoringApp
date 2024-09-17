import express from 'express';
import cors from 'cors';
import { get } from 'axios';
import https from 'https';
import fs from 'fs';

const app = express();
const PORT = 3000;

//cargo certificado ssl
//const options = {
//    key: fs.readFileSync('/etc/nginx/ssl/nginx.key'),
//    cert: fs.readFileSync('/etc/nginx/ssl/sncl7001lx.bancocredicoop.coop.crt')
//};

// iniciar servidor https
//https.createServer(options, app).listen(PORT, () => {
//    console.log('Servidor https escuchando en el ', PORT);
//});

// Configura CORS para aceptar solicitudes de cualquier origen (para pruebas) no hacerlo en produccion
app.use(cors());

const awxApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/'; 

app.get('/api/awx/hosts', async (req, res) => {
    try {
        const awxResponse = await get(awxApiUrl, {
            auth: {
                username: 'segmayer',
                password: 'APACHE03.'
            }
        });

        const hosts = awxResponse.data.results;
        const hostsInWstGroup = [];

        // Iterar sobre los hosts para verificar si están en el grupo "wst"
        for (const host of hosts) {
            const hostId = host.id;

            // Obtener grupos de cada host
            const groupsResponse = await get(`${awxApiUrl}${hostId}/groups/`, {
                auth: {
                    username: 'segmayer',
                    password: 'APACHE03.'
                }
            });
            const groups = groupsResponse.data.results;

            // Verificar si el host pertenece al grupo "wst"
            const isInWstGroup = groups.some(group => group.id === 16108);

            if (isInWstGroup) {
                hostsInWstGroup.push(host);
            }
        }

        // Limitar a los primeros 10 hosts en el grupo "wst" (si es necesario)
        const limitedHostsInWstGroup = hostsInWstGroup.slice(0, 10);

        // Devolver los hosts filtrados al frontend
        res.json(limitedHostsInWstGroup);
    } catch (error) {
        console.error('Error al conectar a la API de AWX: ', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX' });
    }
});

app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});
