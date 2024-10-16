import express from 'express';
import dotenv from 'dotenv';
import awxRoutes from './routes/awxRoutes.js';
import sequelize from './config/database.js';
import { requestLoggerMiddleware } from './middlewares/solicitudes.js';
import { corsMiddleware } from './middlewares/cors.js';
import Filial from './models/filiales.js';
import Inventory from './models/inventory.js';
import Workstation from './models/workstations.js';
import CCTV from './models/cctv.js';
import Job from './models/jobs.js';
import JobHostSummary from './models/jobHostSummary.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(requestLoggerMiddleware());
app.use(corsMiddleware());

app.use(awxRoutes);

sequelize.sync({ alter: true }) 
  .then(() => {
    console.log('Tablas sincronizadas con éxito');
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error.message);
  });
