import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Filial from './filiales.js';
import Inventory from './inventory.js';
import JobHostSummary from './jobHostSummary.js';

const Workstation = sequelize.define('Workstation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false, 
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  filial_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Filial,
      key: 'id',
    }
  },
  inventory_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Inventory,
      key: 'id',
    }
  }
});

//Workstation.hasMany(JobHostSummary, { foreignKey: 'workstation_id' });

export default Workstation;
