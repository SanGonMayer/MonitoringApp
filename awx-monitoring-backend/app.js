import express from 'express';
import dotenv from 'dotenv';
import awxRoutes from './routes/awxRoutes.js';
import sequelize from './config/database.js';
import { requestLoggerMiddleware } from './middlewares/solicitudes.js';
import { corsMiddleware } from './middlewares/cors.js';
import './models/index.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(requestLoggerMiddleware());
app.use(corsMiddleware());

app.use(awxRoutes);


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


sequelize.sync({ alter: true })  
  .then(() => {
    console.log('Tablas sincronizadas con éxito');
    startDataSync();  
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error.message);
  });
