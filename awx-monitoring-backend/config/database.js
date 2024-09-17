import { Sequelize } from 'sequelize';

// Conexión a PostgreSQL
export const sequelize = new Sequelize('nombre_base_de_datos', 'usuario', 'password', {
  host: 'localhost',  // Cambiar dependiendo en dónde este
  dialect: 'postgres',
  logging: false // Deshabilita los logs de SQL en la consola
});

