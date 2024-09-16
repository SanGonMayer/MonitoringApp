const express = require('express');
const sequelize = require('./config/database');  // Importa la conexión a la base de datos
const Workstation = require('./models/Workstation');  // Importa el modelo

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