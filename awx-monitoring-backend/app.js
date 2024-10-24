import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import awxRoutes from './routes/awxRoutes.js';
import sequelize from './config/database.js';
import { requestLoggerMiddleware } from './middlewares/solicitudes.js';
import { corsMiddleware } from './middlewares/cors.js';
import './models/index.js'; 
import Filial from './models/filiales.js';
import cron from 'node-cron';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(requestLoggerMiddleware());
app.use(corsMiddleware());
app.use(express.static(path.join(__dirname, 'front_wst_control')));
app.use(awxRoutes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


const startDataSync = async () => {
  try {
    await syncFiliales(); 

    const filiales = await Filial.findAll();

    for (const filial of filiales) {
      await syncHostsFromInventory22(filial);  
      await syncHostsFromInventory347(filial);  
    }

    console.log('Sincronización de datos completada.');
  } catch (error) {
    console.error('Error durante la sincronización de datos:', error.message);
  }
};


cron.schedule('0 0 * * *', async () => {
  console.log('Ejecutando sincronización de datos programada a las 00:00...');
  await startDataSync();
});


sequelize.sync({ alter: true })  
  .then(() => {
    console.log('Tablas sincronizadas con éxito');
    //startDataSync();  
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error.message);
  });

  export { startDataSync };
