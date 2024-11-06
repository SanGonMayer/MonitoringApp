import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const JobHostSummary = sequelize.define('JobHostSummary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    unique: true, 
  },
  failed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  workstation_id: {
    type: DataTypes.INTEGER,
    allowNull: true, 
  },
  cctv_id: {
    type: DataTypes.INTEGER,
    allowNull: true, 
  },
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  job_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  jobCreationDate: { 
    type: DataTypes.DATE,
    allowNull: false
  }
});


export default JobHostSummary;
