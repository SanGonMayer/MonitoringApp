import { handleHostSnapshot, checkForChanges } from '../../services/snapshotService.js';
import { beforeEach, describe, expect, test } from '@jest/globals';
  // ==========================
  // ✅ Tests para checkForChanges
  // ==========================
  describe('🔄 checkForChanges', () => {
    test('Debe detectar cambios cuando varía el estado', () => {
      const lastSnapshot = { status: 'pendiente' };
      const currentData = { status: 'actualizado' };

      expect(checkForChanges(lastSnapshot, currentData)).toBe(true);
    });

    test('Debe detectar cambios cuando varía el número de filial', () => {
      const lastSnapshot = { filial_id: 1 };
      const currentData = { filial_id: 2 };

      expect(checkForChanges(lastSnapshot, currentData)).toBe(true);
    });

    test('Debe detectar cambios cuando enabled cambia de true a false', () => {
      const lastSnapshot = { enabled: true };
      const currentData = { enabled: false };

      expect(checkForChanges(lastSnapshot, currentData)).toBe(true);
    });

    test('No debe detectar cambios cuando todo es igual', () => {
      const lastSnapshot = { status: 'pendiente', enabled: true };
      const currentData = { status: 'pendiente', enabled: true };

      expect(checkForChanges(lastSnapshot, currentData)).toBe(false);
    });

    test('Debe detectar cambios si no hay snapshot previo', () => {
      const lastSnapshot = null;
      const currentData = { status: 'pendiente', enabled: true };

      expect(checkForChanges(lastSnapshot, currentData)).toBe(true);
    });
  });

  // ==========================
  // ✅ Tests para handleHostSnapshot
  // ==========================
  describe('📝 handleHostSnapshot', () => {
    beforeEach(async () => {
      await MockHostSnapshot.destroy({ where: {} });
    });
  
    // ==============================
    // ✅ Test: Host sin registros previos
    // ==============================
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
      const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 999 } });
  
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].dataValues.host_name).toBe('new-host');
      expect(snapshots[0].dataValues.status).toBe('pendiente');
    });
  
    // ==============================
    // ✅ Test: Cambio en filial
    // ==============================
    test('Debe crear un nuevo snapshot si cambia la filial', async () => {
      const initialHost = {
        id: 999,
        name: 'new-host',
        status: 'pendiente',
        enabled: true,
        inventory_id: 22,
        filial_id: 3,
      };
  
      await handleHostSnapshot(initialHost, 'workstation');
  
      const updatedHost = {
        id: 999,
        name: 'new-host',
        status: 'pendiente',
        enabled: true,
        inventory_id: 22,
        filial_id: 2,
      };
  
      await handleHostSnapshot(updatedHost, 'workstation');
      const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 999 } });
  
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].dataValues.filial_id).toBe(2);
      expect(snapshots[1].dataValues.filial_id).toBe(3);
    });
  
    // ==============================
    // ✅ Test: Cambio en enabled
    // ==============================
    test('Debe crear un nuevo snapshot si cambia enabled', async () => {
      const initialHost = {
        id: 1,
        name: 'test-host',
        status: 'pendiente',
        enabled: true,
        inventory_id: 22,
        filial_id: 1,
      };
  
      await handleHostSnapshot(initialHost, 'workstation');
  
      const updatedHost = {
        id: 1,
        name: 'test-host',
        status: 'pendiente',
        enabled: false,
        inventory_id: 22,
        filial_id: 1,
      };
  
      await handleHostSnapshot(updatedHost, 'workstation');
      const snapshots = await MockHostSnapshot.findAll({ where: { host_id: 1 } });
  
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].dataValues.enabled).toBe(false);
    });
  
    // ==============================
    // ✅ Test: Mantener solo 2 snapshots más recientes
    // ==============================
    test('Debe mantener solo los 2 snapshots más recientes', async () => {
      const host = {
        id: 1,
        name: 'test-host',
        status: 'pendiente',
        enabled: true,
        inventory_id: 22,
        filial_id: 1,
      };
  
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
  
      expect(snapshots.length).toBe(2);
      expect(snapshots[0].dataValues.status).toBe('operativo');
      expect(snapshots[1].dataValues.status).toBe('fallido');
    });
  });