const express = require('express');
const cors = require('cors');  // <--- Importa cors
const axios= require('axios');

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'https://sncl7001lx.bancocredicoop.coop/MonitoringAppFront/'
  }));  

const awxApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/'; 

app.get('/api/awx/hosts', async (req, res) => {
    try {
        const awxResponse = await axios.get(awxApiUrl, {
            auth: {
                username: 'segmayer',
                password: 'APACHE03.'
            }
        });

        const limitedHosts = awxResponse.data.results.slice(0, 10);

        res.json(limitedHosts);
    } catch (error) {
        console.error('Error al conectar a la API de AWX: ', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX'});
    }
});

app.listen(PORT, () => {
    console.log('Servidor escuchando');
});
