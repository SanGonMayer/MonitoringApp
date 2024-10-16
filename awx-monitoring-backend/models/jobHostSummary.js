import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Workstation from './workstations.js';
import CCTV from './cctv.js';
import Job from './jobs.js';

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
    references: {
      model: Workstation,
      key: 'id',
    },
  },
  cctv_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: CCTV,
      key: 'id',
    },
  },
  job_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Job,
      key: 'id',
    },
  }
});

//JobHostSummary.belongsTo(Workstation, { foreignKey: 'workstation_id' });
//JobHostSummary.belongsTo(CCTV, { foreignKey: 'cctv_id' });
//JobHostSummary.belongsTo(Job, { foreignKey: 'job_id' });

export default JobHostSummary;
