import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Workstation from './workstations.js';
import CCTV from './cctv.js';

const Inventory = sequelize.define('Inventory', {
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
  }
});

//Inventory.hasMany(Workstation, { foreignKey: 'inventory_id' });
//Inventory.hasMany(CCTV, { foreignKey: 'inventory_id' });

export default Inventory;
