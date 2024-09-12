const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Importa la conexión a la base de datos

const Workstation = sequelize.define('Workstation', {
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

module.exports = Workstation;
