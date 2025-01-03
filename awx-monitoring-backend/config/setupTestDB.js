import sequelize from '../config/test.js';
import HostSnapshotModel from '../models/hostSnapshot.js';

export const setupTestDB = async () => {
  const HostSnapshot = HostSnapshotModel(sequelize);
  await sequelize.sync({ force: true }); // Reinicia la base de datos en cada test
  return { HostSnapshot };
};
