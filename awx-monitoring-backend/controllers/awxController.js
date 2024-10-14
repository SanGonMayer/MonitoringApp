import { fetchAllPages, getJobSummaries } from '../services/awxService.js';

const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories';
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';

// Obtener grupos de un inventario
export const getGroups = async (req, res) => {
  const inventoryId = req.params.inventoryId;

  try {
    const awxResponse = await fetchAllPages(`${baseApiUrl}/${inventoryId}/groups/`);
    const groups = awxResponse
      .filter(group => group.name.toLowerCase() !== 'wst' && group.name.toLowerCase() !== 'pve')
      .map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        hostsUrl: group.related.hosts,
      }));

    res.json(groups);
  } catch (error) {
    console.error('Error al conectar a la API de AWX:', error.message);
    res.status(500).json({ error: 'Error al conectar a la API de AWX' });
  }
};

// Obtener hosts y su estado
export const getHosts = async (req, res) => {
  const groupId = req.params.groupId;
  const templateName = 'wst_upd_v1.7.19';

  try {
    const awxResponse = await fetchAllPages(`${hostsApiUrl}/${groupId}/hosts/`);
    const enabledHosts = awxResponse.filter(host => host.enabled);

    const hosts = await Promise.all(
      enabledHosts.map(async (host) => await getJobSummaries(host, templateName))
    );

    res.json(hosts);
  } catch (error) {
    console.error('Error al obtener los hosts:', error.message);
    res.status(500).json({ error: 'Error al obtener los hosts' });
  }
};
