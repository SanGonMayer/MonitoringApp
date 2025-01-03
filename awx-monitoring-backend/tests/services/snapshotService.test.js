import assert from 'node:assert';
import { test, beforeEach } from 'node:test';
import { checkForChanges } from '../../services/snapshotService.js';
import { handleHostSnapshot } from '../../services/snapshotService.js';
import SequelizeMock from 'sequelize-mock';


test('checkForChanges - Debe detectar cambios cuando hay diferencias en el estado', () => {
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

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), true);
});

test('checkForChanges - No debe detectar cambios cuando todo es igual', () => {
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

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), false);
});

test('checkForChanges - Debe detectar cambios si no hay snapshot previo', () => {
  const lastSnapshot = null;

  const currentData = {
    status: 'pendiente',
    enabled: true,
    inventory_id: 22,
    filial_id: 1,
  };

  assert.strictEqual(checkForChanges(lastSnapshot, currentData), true);
});


// **Mock de la base de datos**
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

// **Tests para handleHostSnapshot**

test('handleHostSnapshot - Debe crear un nuevo snapshot si hay cambios', async () => {
  const host = {
    id: 1,
    name: 'test-host',
    status: 'actualizado', // Cambio en el estado
    enabled: true,
    inventory_id: 22,
    filial_id: 1,
  };

  // Primer snapshot
  await handleHostSnapshot(host, 'workstation');

  const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
  assert.strictEqual(snapshots.length, 1); // Se ha creado un snapshot
  assert.strictEqual(snapshots[0].status, 'actualizado'); // Validar el estado
});

test('handleHostSnapshot - No debe crear un nuevo snapshot si no hay cambios', async () => {
  const host = {
    id: 1,
    name: 'test-host',
    status: 'pendiente',
    enabled: true,
    inventory_id: 22,
    filial_id: 1,
  };

  // Primer snapshot
  await handleHostSnapshot(host, 'workstation');

  // Segundo snapshot (sin cambios)
  await handleHostSnapshot(host, 'workstation');

  const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
  assert.strictEqual(snapshots.length, 1); // No debe haberse creado un nuevo snapshot
});

test('handleHostSnapshot - Debe mantener solo los 2 snapshots más recientes', async () => {
  const host = {
    id: 1,
    name: 'test-host',
    status: 'pendiente',
    enabled: true,
    inventory_id: 22,
    filial_id: 1,
  };

  // 🔄 Crear tres snapshots con cambios en cada uno
  host.status = 'actualizado';
  await handleHostSnapshot(host, 'workstation');
  
  host.status = 'pendiente';
  await handleHostSnapshot(host, 'workstation');
  
  host.status = 'fallido';
  await handleHostSnapshot(host, 'workstation');

  const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
  assert.strictEqual(snapshots.length, 2); // Solo deben quedar 2 snapshots

  // Validar que los estados sean los más recientes
  assert.strictEqual(snapshots[0].status, 'fallido');
  assert.strictEqual(snapshots[1].status, 'pendiente');
});