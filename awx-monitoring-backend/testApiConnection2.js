import express from 'express';
import cors from 'cors';  // Importa cors
import axios from 'axios';
import https from'https';
import fs from 'fs';
import { group } from 'console';

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
        const awxResponse = await axios.get(awxApiUrl, {
            auth: {
                username: 'segmayer',
                password: 'APACHE03.'
            }
        });
        
        const filteredHosts = awxResponse.data.results.filter(host => 
            host.groups.results.some(group => group.id === 16108)
        )
        const limitedHosts = filteredHosts.slice(0, 10);

        res.json(limitedHosts);
    } catch (error) {
        console.error('Error al conectar a la API de AWX: ', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX' });
    }
});

app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});
