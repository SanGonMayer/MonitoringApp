import SequelizeMock from 'sequelize-mock';

const dbMock = new SequelizeMock();
global.MockHostSnapshot = dbMock.define('HostSnapshot', {
  host_id: { type: 'INTEGER' },
  host_name: { type: 'STRING' },
  status: { type: 'STRING' },
  enabled: { type: 'BOOLEAN' },
  inventory_id: { type: 'INTEGER' },
  filial_id: { type: 'INTEGER' },
  snapshot_date: { type: 'DATE' },
});

beforeEach(async () => {
  await MockHostSnapshot.destroy({ where: {} });
});
