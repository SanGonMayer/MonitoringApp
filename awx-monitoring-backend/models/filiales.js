import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Workstation from './workstation.js';
import CCTV from './cctv.js';

const Filial = sequelize.define('Filial', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: flase,
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

Filial.hasMany(Workstation, { foreignKey: 'filial_id' });
Filial.hasMany(CCTV, { foreignKey: 'filial_id' });

export default Filial;
