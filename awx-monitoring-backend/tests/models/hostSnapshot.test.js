import HostSnapshot from '../../models/hostsSnapshot.js';
import { beforeAll, describe, expect, test } from '@jest/globals';


describe('📊 Modelo HostSnapshot', () => {
  test('Debe crear un snapshot correctamente', async () => {
    const snapshot = await HostSnapshot.create({
      host_id: 1,
      host_name: 'test-host',
      status: 'pendiente',
      enabled: true,
      inventory_id: 22,
      filial_id: 1,
      snapshot_date: new Date(),
    });

    expect(snapshot).toHaveProperty('id');
    expect(snapshot.host_name).toBe('test-host');
    expect(snapshot.status).toBe('pendiente');
  });
});
