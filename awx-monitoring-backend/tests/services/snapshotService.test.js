import assert from 'node:assert';
import { test, beforeEach } from 'node:test';
import { checkForChanges } from '../../services/snapshotService.js';
import { handleHostSnapshot } from '../../services/snapshotService.js';
import SequelizeMock from 'sequelize-mock';


// ===============================
// Tests para checkForChanges
// ===============================

test('checkForChanges - Debe detectar cambios cuando varía el estado', () => {
  const lastSnapshot = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
  const currentData = { status: 'actualizado', enabled: true, inventory_id: 22, filial_id: 1 };

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), true);
});

test('checkForChanges - Debe detectar cambios cuando varía el número de filial', () => {
  const lastSnapshot = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
  const currentData = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 2 };

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), true);
});

test('checkForChanges - Debe detectar cambios cuando enabled cambia de true a false', () => {
  const lastSnapshot = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
  const currentData = { status: 'pendiente', enabled: false, inventory_id: 22, filial_id: 1 };

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), true);
});

test('checkForChanges - Debe detectar cambios cuando enabled cambia de false a true', () => {
    const lastSnapshot = { status: 'pendiente', enabled: false, inventory_id: 22, filial_id: 1 };
    const currentData = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
  
    assert.strictEqual(checkForChanges(lastSnapshot, currentData), true);
  });

test('checkForChanges - No debe detectar cambios cuando todo es igual', () => {
  const lastSnapshot = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
  const currentData = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), false);
});

test('checkForChanges - Debe detectar cambios si no hay snapshot previo', () => {
  const lastSnapshot = null;
  const currentData = { status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), true);
});

// ===============================
// Mock de la base de datos
// ===============================

const dbMock = new SequelizeMock();
const MockHostSnapshot = dbMock.define('HostSnapshot', {
  host_id: 1,
  host_name: 'test-host',
  status: 'pendiente',
  enabled: true,
  inventory_id: 22,
  filial_id: 1,
});

// **Antes de cada prueba, limpia los datos en el mock**
beforeEach(async () => {
  await MockHostSnapshot.destroy({ where: {} });
});


// ===============================
// Tests para handleHostSnapshot
// ===============================

test('handleHostSnapshot - Debe crear un nuevo snapshot si hay cambios', async () => {
  const host = { id: 1, name: 'test-host', status: 'actualizado', enabled: true, inventory_id: 22, filial_id: 1 };

  await handleHostSnapshot(host, 'workstation');

  const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
  assert.strictEqual(snapshots.length, 1);
  assert.strictEqual(snapshots[0].status, 'actualizado');
});

test('handleHostSnapshot - No debe crear un nuevo snapshot si no hay cambios', async () => {
  const host = { id: 1, name: 'test-host', status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };

  await handleHostSnapshot(host, 'workstation');
  await handleHostSnapshot(host, 'workstation'); // Sin cambios

  const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
  assert.strictEqual(snapshots.length, 1);
});

test('handleHostSnapshot - Debe mantener solo los 2 snapshots más recientes', async () => {
  const host = { id: 1, name: 'test-host', status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };

  host.status = 'actualizado';
  await handleHostSnapshot(host, 'workstation');

  host.status = 'fallido';
  await handleHostSnapshot(host, 'workstation');

  host.status = 'pendiente';
  await handleHostSnapshot(host, 'workstation'); // Tercer cambio

  const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 }, order: [['snapshot_date', 'DESC']] });
  assert.strictEqual(snapshots.length, 2);
  assert.strictEqual(snapshots[0].status, 'pendiente');
  assert.strictEqual(snapshots[1].status, 'fallido');
});
