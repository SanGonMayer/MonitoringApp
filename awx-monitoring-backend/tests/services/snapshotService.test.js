import { checkForChanges } from '../../services/snapshotService.js';
import { handleHostSnapshot } from '../../services/snapshotService.js';
import HostSnapshot from '../../models/hostsSnapshot.js';
import SequelizeMock from 'sequelize-mock';

describe('checkForChanges', () => {
  test('Debe detectar cambios cuando hay diferencias en el estado', () => {
    const lastSnapshot = {
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };

    const currentData = {
      status: 'actualizado',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };

    expect(checkForChanges(lastSnapshot, currentData)).toBe(true);
  });

  test('No debe detectar cambios cuando todo es igual', () => {
    const lastSnapshot = {
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };

    const currentData = {
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };

    expect(checkForChanges(lastSnapshot, currentData)).toBe(false);
  });

  test('Debe detectar cambios si no hay snapshot previo', () => {
    const lastSnapshot = null;

    const currentData = {
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };

    expect(checkForChanges(lastSnapshot, currentData)).toBe(true);
  });
});


// Crear un mock de la base de datos
const dbMock = new SequelizeMock();
const MockHostSnapshot = dbMock.define('HostSnapshot', {
  host_id: 1,
  host_name: 'test-host',
  status: 'pendiente',
  enabled: true,
  inventory_id: 22,
  filial_id: 1,
});

jest.mock('../../models/hostsSnapshot.js', () => MockHostSnapshot);

describe('handleHostSnapshot', () => {
  test('Debe crear un nuevo snapshot si hay cambios', async () => {
    const host = {
      id: 1,
      name: 'test-host',
      status: 'actualizado',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };

    await handleHostSnapshot(host, 'workstation');

    const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
    expect(snapshots.length).toBe(1);
    expect(snapshots[0].status).toBe('actualizado');
  });

  test('No debe crear un nuevo snapshot si no hay cambios', async () => {
    const host = {
      id: 1,
      name: 'test-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };

    await handleHostSnapshot(host, 'workstation');

    const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
    expect(snapshots.length).toBe(1);
  });
});
