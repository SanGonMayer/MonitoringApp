import { handleHostSnapshot, takeDailySnapshot, getLastSnapshot, hasSnapshotChanged, createAndManageSnapshots } from '../../services/snapshotService.js';
import { beforeEach, describe, expect, test } from '@jest/globals';
import { HostSnapshot } from '../../models/index.js';
import sequelize from 'sequelize';
  // ==========================
  // ✅ Tests para hasSnapshotChanged
  // ==========================
  describe('🔄 hasSnapshotChanged', () => {
    test('Debe detectar cambios cuando varía el estado', () => {
      const lastSnapshot = { status: 'pendiente' };
      const currentData = { status: 'actualizado' };

      expect(hasSnapshotChanged(lastSnapshot, currentData)).toBe(true);
    });

    test('Debe detectar cambios cuando varía el número de filial', () => {
      const lastSnapshot = { filial_id: 1 };
      const currentData = { filial_id: 2 };

      expect(hasSnapshotChanged(lastSnapshot, currentData)).toBe(true);
    });

    test('Debe detectar cambios cuando enabled cambia de true a false', () => {
      const lastSnapshot = { enabled: true };
      const currentData = { enabled: false };

      expect(hasSnapshotChanged(lastSnapshot, currentData)).toBe(true);
    });

    test('No debe detectar cambios cuando todo es igual', () => {
      const lastSnapshot = { status: 'pendiente', enabled: true };
      const currentData = { status: 'pendiente', enabled: true };

      expect(hasSnapshotChanged(lastSnapshot, currentData)).toBe(false);
    });

    test('Debe detectar cambios si no hay snapshot previo', () => {
      const lastSnapshot = null;
      const currentData = { status: 'pendiente', enabled: true };

      expect(hasSnapshotChanged(lastSnapshot, currentData)).toBe(true);
    });
  });

  // ==========================
  // ✅ Tests para handleHostSnapshot
  // ==========================
  describe('📝 handleHostSnapshot', () => {
    beforeEach(async () => {
      await HostSnapshot.destroy({ where: {} });
    });
  
    // ✅ 1. Agregar snapshot si no hay registros previos
    test('Debe agregar un snapshot si el host no tiene registros previos', async () => {
      const newHost = {
        id: 999,
        name: 'new-host',
        status: 'pendiente',
        enabled: true,
        inventory_id: 22,
        filial_id: 3,
      };
  
      await handleHostSnapshot(newHost, 'workstation');
      const snapshots = await HostSnapshot.findAll({ where: { host_id: 999 } });
  
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].host_name).toBe('new-host');
      expect(snapshots[0].status).toBe('pendiente');
    });
  
    // ✅ 2. Crear snapshot si cambia la filial
    test('Debe crear un nuevo snapshot si cambia la filial', async () => {
      const initialHost = { id: 999, name: 'test', status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 3 };
      await handleHostSnapshot(initialHost, 'workstation');
  
      const updatedHost = { ...initialHost, filial_id: 2 };
      await handleHostSnapshot(updatedHost, 'workstation');
  
      const snapshots = await HostSnapshot.findAll({ where: { host_id: 999 }, order: [['snapshot_date', 'DESC']] });
  
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].filial_id).toBe(2);
      expect(snapshots[1].filial_id).toBe(3);
    });
  
    // ✅ 3. Crear snapshot si cambia el estado
    test('Debe crear un nuevo snapshot si cambia el estado', async () => {
      const initialHost = { id: 999, name: 'test', status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
      await handleHostSnapshot(initialHost, 'workstation');
  
      const updatedHost = { ...initialHost, status: 'fallido' };
      await handleHostSnapshot(updatedHost, 'workstation');
  
      const snapshots = await HostSnapshot.findAll({ where: { host_id: 999 }, order: [['snapshot_date', 'DESC']] });
  
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].status).toBe('fallido');
      expect(snapshots[1].status).toBe('pendiente');
    });
  
    // ✅ 4. Crear snapshot si cambia enabled
    test('Debe crear un nuevo snapshot si cambia enabled', async () => {
      const initialHost = { id: 1, name: 'test-host', status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
      await handleHostSnapshot(initialHost, 'workstation');
  
      const updatedHost = { ...initialHost, enabled: false };
      await handleHostSnapshot(updatedHost, 'workstation');
  
      const snapshots = await HostSnapshot.findAll({ where: { host_id: 1 } });
  
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].enabled).toBe(false);
    });
  
    // ✅ 5. No crear snapshot si no hay cambios
    test('No debe crear un nuevo snapshot si no hay cambios', async () => {
      const host = { id: 1, name: 'test-host', status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
      await handleHostSnapshot(host, 'workstation');
  
      await handleHostSnapshot(host, 'workstation'); // Sin cambios
  
      const snapshots = await HostSnapshot.findAll({ where: { host_id: 1 } });
  
      expect(snapshots.length).toBe(1);
    });
  
    // ✅ 6. Mantener solo los 2 snapshots más recientes
    test('Debe mantener solo los 2 snapshots más recientes', async () => {
      const host = { id: 1, name: 'test-host', status: 'pendiente', enabled: true, inventory_id: 22, filial_id: 1 };
  
      for (let state of ['pendiente', 'actualizado', 'fallido']) {
        host.status = state;
        await handleHostSnapshot(host, 'workstation');
      }
  
      const snapshots = await HostSnapshot.findAll({ where: { host_id: 1 } });
  
      expect(snapshots.length).toBe(2);
    });
  });