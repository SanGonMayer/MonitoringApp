import sequelize from '../config/database.js';

// Importar todos los modelos
import Filial from './filiales.js';
import Inventory from './inventory.js';
import Workstation from './workstations.js';
import CCTV from './cctv.js';
//import Job from './jobs.js';
import JobHostSummary from './jobHostSummary.js';
//import HostStatusHistory from './hostStatusHistory.js';

Filial.hasMany(Workstation, { foreignKey: 'filial_id' });
Workstation.belongsTo(Filial, { foreignKey: 'filial_id' });

Filial.hasMany(CCTV, { foreignKey: 'filial_id' });
CCTV.belongsTo(Filial, { foreignKey: 'filial_id' });

Inventory.hasMany(Workstation, { foreignKey: 'inventory_id' });
Workstation.belongsTo(Inventory, { foreignKey: 'inventory_id' });

Inventory.hasMany(CCTV, { foreignKey: 'inventory_id' });
CCTV.belongsTo(Inventory, { foreignKey: 'inventory_id' });

//Job.hasMany(JobHostSummary, { foreignKey: 'job_id' });
//JobHostSummary.belongsTo(Job, { foreignKey: 'job_id' });

Workstation.hasMany(JobHostSummary, { foreignKey: 'workstation_id', as: 'jobSummaries' });
JobHostSummary.belongsTo(Workstation, { foreignKey: 'workstation_id', as: 'workstation', allowNull: true }); 

CCTV.hasMany(JobHostSummary, { foreignKey: 'cctv_id', as: 'jobSummaries' });
JobHostSummary.belongsTo(CCTV, { foreignKey: 'cctv_id', allowNull: true }); 

//Workstation.hasMany(HostStatusHistory, { foreignKey: 'host_id' });
//HostStatusHistory.belongsTo(Workstation, { foreignKey: 'host_id' });

//CCTV.hasMany(HostStatusHistory, { foreignKey: 'host_id' });
//HostStatusHistory.belongsTo(CCTV, { foreignKey: 'host_id' });


export { sequelize, Filial, Inventory, Workstation, CCTV, JobHostSummary };
