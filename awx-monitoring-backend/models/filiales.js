import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Filial = sequelize.define('Filial', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  awx_id_wst: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  awx_id_cctv: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});



export default Filial;
