import express, { json } from 'express';
import { sequelize } from './config/database.js';        // Importa la conexión a la base de datos
import Workstation from './models/Workstation';       // Importa el modelo
import { requestLoggerMiddleware } from './middlewares/solicitudes.js';


app.disable('x-powered-by')
//app.use(corsMiddleware())
app.use(requestLoggerMiddleware())


const app = express();
app.use(express.json());  // Middleware para trabajar con JSON




// Sincroniza los modelos con la base de datos
sequelize.sync({ force: false })  // force: true -> reinicia las tablas cada vez que inicias la app (para desarrollo)
  .then(() => {
    console.log('Conexión y sincronización con la base de datos exitosa');
  })
  .catch((err) => {
    console.error('Error al conectar a la base de datos:', err);
  });

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API funcionando');
});

// Levanta el servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});


//Rutas
app.use('/api', workstationRoutes);

app.listen(3000, () => { console.log('Servidor corriendo en http://localhost:3000');});