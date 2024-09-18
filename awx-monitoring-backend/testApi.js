import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
//import { requestLoggerMiddleware } from './middlewares/solicitudes';

dotenv.config();

const username = process.env.AWX_USER_TEST;
const password = process.env.AWX_USER_TEST_PASS;


const app = express();
const PORT = 3000;

app.use(cors());
app.disable('x-powered-by')
//app.use(requestLoggerMiddleware())

const awxApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/'; 

app.get('/api/awx/hosts', async (req, res) => {
    try {
        const awxResponse = await axios.get(awxApiUrl, {
            auth: {
                username: username,
                password: password
            },
            params:{
                page_size: 50
            }
        });

        //const limitedHosts = awxResponse.data.results.slice(0, 50);

        res.json(awxResponse.data.results);
    } catch (error) {
        console.error('Error al conectar a la API de AWX: ', error.message);
        res.status(500).json({ error: 'Error al conectar a la API de AWX' });
    }
});

app.listen(PORT, () => {
    console.log('Servidor escuchando en el puerto', PORT);
});
