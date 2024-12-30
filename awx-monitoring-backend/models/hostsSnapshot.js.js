import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HostSnapshot = sequelize.define('HostSnapshot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  host_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  host_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  snapshot_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  inventory_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  filial_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default HostSnapshot;
