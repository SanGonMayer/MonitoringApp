import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js'; // Importa la conexión a la base de datos

export const Workstation = sequelize.define('Workstation', {
  hostname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastVersionApplied: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'workstations', 
  timestamps: true, 
});


