import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import awxRoutes from './routes/awxRoutes.js';
import sequelize from './config/database.js';
import { requestLoggerMiddleware } from './middlewares/solicitudes.js';
import { corsMiddleware } from './middlewares/cors.js';
import './models/index.js'; 
import { syncAllData } from './services/syncService.js';
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

cron.schedule('0 0 * * 0', () => {
  console.log('Ejecutando cron job de sincronización...');
  startDataSync();
});


sequelize.sync({ alter: true })  
  .then(() => {
    console.log('Tablas sincronizadas con éxito');
    syncAllData(); 
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error.message);
  });
