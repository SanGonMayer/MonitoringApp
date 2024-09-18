import express from 'express';
import cors from 'cors';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const username = process.env.AWX_USER_TEST;
const password = process.env.AWX_USER_TEST_PASS;


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
                username: username,
                password: password
            }
        });

        const limitedHosts = awxResponse.data.results.slice(0, 50);

        res.json(limitedHosts);
    } catch (error) {
        console.error('Error al conectar a la API de AWX: ', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX' });
    }
});

app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});
