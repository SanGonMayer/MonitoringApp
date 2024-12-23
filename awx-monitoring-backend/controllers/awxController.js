import { fetchAllPages, getJobSummaries } from '../services/awxService.js';
import axios from 'axios';


const baseApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/inventories';
const hostsApiUrl = 'http://sawx0001lx.bancocredicoop.coop/api/v2/groups';


const gruposExcluidos = ['pve','cctv', 'wst'];


export class GroupHostController{

    static async getGroups (req, res){
        const inventoryId = req.params.inventoryId;

        try {
            const awxResponse = await fetchAllPages(`${baseApiUrl}/${inventoryId}/groups/`);

            if (inventoryId == '22'){
                const groups = awxResponse
                    .filter(group => !gruposExcluidos.includes(group.name.toLowerCase()))
                    .map(group => ({
                        id: group.id,
                        name: group.name,
                        description: group.description,
                        hostsUrl: group.related.hosts,
                    }));
                
                res.json(groups);

            } else if (inventoryId == '347'){
                
                const gruposSinHosts = [];
                console.log('Evaluando existencia de host en filiales para cctv.... ')
                
                for (const group of awxResponse) {
                    const groupId = group.id;
                    let hostDelGrupo = await fetchAllPages(`${hostsApiUrl}/${groupId}/hosts/`);
                    if (hostDelGrupo.length === 0) {
                        gruposSinHosts.push(group.name);
                    }
                }

                gruposExcluidos.push(...gruposSinHosts);

                const groups = awxResponse
                    .filter(group => !gruposExcluidos.includes(group.name.toLowerCase()))
                    .map(group => ({
                        id: group.id,
                        name: group.name,
                        description: group.description,
                        hostsUrl: group.related.hosts,
                    }));
                
                res.json(groups);
            }
        } catch (error) {
            console.error('Error al conectar a la API de AWX:', error.message);
            res.status(500).json({ error: 'Error al conectar a la API de AWX' });
        }
    }


    static async getHosts (req, res){
        const groupId = req.params.groupId;
        const inventoryId = req.params.inventoryId;
      
        try {
          const awxResponse = await fetchAllPages(`${hostsApiUrl}/${groupId}/hosts/`);
          const enabledHosts = awxResponse.filter(host => host.enabled);
      
          const hosts = await Promise.all(
            enabledHosts.map(async (host) => await getJobSummaries(host, inventoryId))
          );
      
          res.json(hosts);
        } catch (error) {
          console.error('Error al obtener los hosts:', error.message);
          res.status(500).json({ error: 'Error al obtener los hosts' });
        }
    }
}


const awxUser = process.env.AWX_USER_TEST;
const awxPass = process.env.AWX_USER_TEST_PASS;

const serviceUser = process.env.AWX_SERVER_USER;
const servicePass = process.env.AWX_SERVER_PASS;

export const launchJob = async (req, res) => {
  console.log("launchJob fue llamado con los datos:", req.body);
  const { job_template_id, hostname, extra_vars = {}, verbosity = 2 } = req.body;


  console.log("Datos recibidos para ejecutar el job:");
  console.log(`job_template_id: ${job_template_id}`);
  console.log(`hostname: ${hostname}`);
  console.log(`extra_vars: ${JSON.stringify(extra_vars)}`);
  console.log(`verbosity: ${verbosity}`);

  try {

    if (!job_template_id || !hostname) {
        return res.status(400).json({ error: "Faltan datos obligatorios (job_template_id o host_id)" });
      }


    console.log('Lanzando job con los siguientes datos:', {
        job_template_id,
        hostname,
        extra_vars,
        verbosity
    });
 
    const response = await axios.post(
      `http://sawx0001lx.bancocredicoop.coop/api/v2/job_templates/${job_template_id}/launch/`,
      {
        limit: hostname,
        extra_vars,
        verbosity,
      },
      {
        auth: {
          username: serviceUser,
          password: servicePass,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Respuesta de AWX:', response.data);

    res.status(200).json({ message: 'Job ejecutado correctamente', job_id: response.data.job });
  } catch (error) {
    console.error('Error al ejecutar el job:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error al ejecutar el job' });
  }
};


//---------------------------------

export const launchJobFilial = async (req, res) => {
  console.log("launchJob fue llamado con los datos:", req.body);
  const { job_template_id, hostsPendientesFallidos, extra_vars = {}, verbosity = 2 } = req.body;  // Cambié 'hostname' por 'filial'

  console.log("Datos recibidos para ejecutar el job:");
  console.log(`job_template_id: ${job_template_id}`);
  console.log(`hosts: ${hostsPendientesFallidos}`);  // Usamos 'hosts' aquí
  console.log(`extra_vars: ${JSON.stringify(extra_vars)}`);
  console.log(`verbosity: ${verbosity}`);

  try {
    if (!job_template_id || !hostsPendientesFallidos) {  // Cambié 'hostname' por 'hostspendientesfallidos'
        return res.status(400).json({ error: "Faltan datos obligatorios (job_template_id o hostsPendientesFallidos)" });
    }

    console.log('Lanzando job con los siguientes datos:', {
        job_template_id,
        hostsPendientesFallidos,  // Usamos 'filial' aquí
        extra_vars,
        verbosity
    });
    
    const response = await axios.post(
      `http://sawx0001lx.bancocredicoop.coop/api/v2/job_templates/${job_template_id}/launch/`,
      {
        limit: hostsPendientesFallidos,  // Usamos 'hostsPendientesFallidos-' como 'limit'
        extra_vars,
        verbosity,
      },
      {
        auth: {
          username: serviceUser,
          password: servicePass,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Respuesta de AWX:', response.data);

    res.status(200).json({ message: 'Job ejecutado correctamente', job_id: response.data.job });
  } catch (error) {
    console.error('Error al ejecutar el job:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error al ejecutar el job' });
  }
};
