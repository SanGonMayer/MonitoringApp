import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const totalHostsPorFilial = sequelize.define('totalHostsPorFilial', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true, 
    },
    filial_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    wst_hosts_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cctv_hosts_qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
}, {
    freezeTableName: true,
});

export default totalHostsPorFilial;