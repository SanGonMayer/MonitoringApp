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

// ===============================
// Test: Nuevo Host Sin Registro Previo
// ===============================

test('handleHostSnapshot - Debe agregar un snapshot si el host no tiene registros previos', async () => {
    const newHost = {
      id: 999, // Un host completamente nuevo
      name: 'new-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 55,
      filial_id: 3,
    };
  
    await handleHostSnapshot(newHost, 'workstation');
  
    const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 999 } });
    assert.strictEqual(snapshots.length, 1); // Se debe haber creado un snapshot
    assert.strictEqual(snapshots[0].host_name, 'new-host'); // Validar el nombre correcto
    assert.strictEqual(snapshots[0].status, 'pendiente');
  });
  
  // ===============================
  // Test: Detectar Cambio en Número de Filial
  // ===============================
  
  test('handleHostSnapshot - Debe crear un nuevo snapshot si cambia la filial', async () => {
    // Primer snapshot
    const initialHost = {
      id: 1,
      name: 'test-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };
    await handleHostSnapshot(initialHost, 'workstation');
  
    // Modificación en filial
    const updatedHost = {
      id: 1,
      name: 'test-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 2, // Cambio en filial
    };
    await handleHostSnapshot(updatedHost, 'workstation');
  
    const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
    assert.strictEqual(snapshots.length, 2); // Se debe haber creado un nuevo snapshot
    assert.strictEqual(snapshots[1].filial_id, 2); // Validar el nuevo valor de filial
  });
  
  // ===============================
  // Test: Detectar Cambio en Enabled
  // ===============================
  
  test('handleHostSnapshot - Debe crear un nuevo snapshot si cambia enabled', async () => {
    // Primer snapshot
    const initialHost = {
      id: 1,
      name: 'test-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };
    await handleHostSnapshot(initialHost, 'workstation');
  
    // Modificación en enabled
    const updatedHost = {
      id: 1,
      name: 'test-host',
      status: 'pendiente',
      enabled: false, // Cambio en enabled
      inventory_id: 22,
      filial_id: 1,
    };
    await handleHostSnapshot(updatedHost, 'workstation');
  
    const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
    assert.strictEqual(snapshots.length, 2); // Se debe haber creado un nuevo snapshot
    assert.strictEqual(snapshots[1].enabled, false); // Validar el nuevo valor de enabled
  });
  
  // ===============================
  // Test: Detectar Cambio Real en Datos Generales
  // ===============================
  
  test('handleHostSnapshot - Debe detectar cambios reales y crear un nuevo snapshot', async () => {
    // Primer Snapshot
    const initialHost = {
      id: 1,
      name: 'test-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };
    await handleHostSnapshot(initialHost, 'workstation');
  
    let snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
    assert.strictEqual(snapshots.length, 1); // Primer snapshot creado
  
    // Segundo Snapshot con Cambio Real
    const updatedHost = {
      id: 1,
      name: 'test-host',
      status: 'actualizado',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };
    await handleHostSnapshot(updatedHost, 'workstation');
  
    snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
    assert.strictEqual(snapshots.length, 2); // Segundo snapshot creado
    assert.strictEqual(snapshots[1].status, 'actualizado');
  });
  
  // ===============================
  // Test: Mantener Solo 2 Snapshots Más Recientes
  // ===============================
  
  test('handleHostSnapshot - Debe mantener solo los 2 snapshots más recientes', async () => {
    const host = {
      id: 1,
      name: 'test-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
    };
  
    // Crear tres snapshots con cambios en cada uno
    host.status = 'actualizado';
    await handleHostSnapshot(host, 'workstation');
  
    host.status = 'fallido';
    await handleHostSnapshot(host, 'workstation');
  
    host.status = 'operativo';
    await handleHostSnapshot(host, 'workstation');
  
    const snapshots = await MockHostSnapshot.findAll({
      where: { host_id: 1 },
      order: [['snapshot_date', 'DESC']],
    });
  
    assert.strictEqual(snapshots.length, 2); // Solo deben quedar 2 snapshots
    assert.strictEqual(snapshots[0].status, 'operativo');
    assert.strictEqual(snapshots[1].status, 'fallido');
  });