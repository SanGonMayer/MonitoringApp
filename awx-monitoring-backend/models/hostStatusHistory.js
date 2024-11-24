import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HostStatusHistory = sequelize.define('HostStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  host_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  inventory_id: {
    type: DataTypes.INTEGER,
    allowNull: false, 
  },
  previous_status: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  new_status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  change_reason: {
    type: DataTypes.STRING, 
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.NOW,
  },
});

export default HostStatusHistory;
