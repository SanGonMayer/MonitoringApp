import sequelize from '../config/database.js';

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
  },
  inventory_id: {
    type: DataTypes.INTEGER,
  },
  enabled: { 
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
});


export default Workstation;
