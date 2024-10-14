import { fetchAllPages, getJobSummaries } from '../services/awxService.js';

const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories';
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';
const gruposExcluidos = [
  'f0504', 'f0509', 'f0513', 'f0514', 'f0559', 'f0579', 'f0580', 'f0583', 'f0584', 'f0593', 'f0594', 'f0595', 'f0597', 'f0652', 'f0653', 'f0688', 'f0703',
  'f0071', 'f0517', 'f0603', 'f0661', 'f0662', 'f0663', 'f0664', 'f0665', 'f0668',
  'wst', 'pve','f0999'
];

// Obtener grupos de un inventario
export const getGroups = async (req, res) => {
  const inventoryId = req.params.inventoryId;

  try {
    const awxResponse = await fetchAllPages(`${baseApiUrl}/${inventoryId}/groups/`);
    const groups = awxResponse
      .filter(group => !gruposExcluidos.includes(group.name.toLowerCase()))
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
