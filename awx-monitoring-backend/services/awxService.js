import axios from 'axios';
import base64 from 'base-64';
import dotenv from 'dotenv';

dotenv.config();

const username = process.env.AWX_SERVER_USER;
const password = process.env.AWX_SERVER_PASS;

const authConfig = {
  headers: {
    'Authorization': `Basic ${base64.encode(`${username}:${password}`)}`,
  },
};

export async function fetchAllPages(apiUrl) {
  let page = 1;
  let allData = [];
  let morePages = true;

  while (morePages) {
    try {
      const response = await axios.get(`${apiUrl}?page=${page}`, authConfig);

      if (response.status === 200 && response.data.results.length > 0) {
        const data = response.data.results;
        allData = allData.concat(data);
        page++;
      } else {
        morePages = false;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`Página ${page} no encontrada, finalizando la búsqueda.`);
        morePages = false;
      } else {
        console.error(`Error fetching page ${page}:`, error.message);
        morePages = false;
      }
    }
  }

  return allData;
}


// Función para obtener el estado de los trabajos de un host
export async function getJobSummaries(host, inventory) {
  const jobSummariesUrl = `http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/${host.id}/job_host_summaries/`;
  console.log(`Obteniendo trabajos para el host ${host.name} desde: ${jobSummariesUrl}`);

  let status = 'No ejecutado';
  let jobNames = [];
  let templateName = '';
  let ipa = '';
  let jobNamesIpa = [];
  let jobsIndexFromIpa = -1

  try {
      const jobSummaries = await fetchAllPages(jobSummariesUrl, authConfig);
      jobNames = jobSummaries.map(job => job.summary_fields.job.name);
      let listaEvaluada = [];

      if (inventory == '22'){
          templateName = 'wst_upd_v1.7.19';
          ipa = "wst_ipa_v";
          jobsIndexFromIpa = jobNames.findIndex(nombre => nombre.startsWith(ipa))
          if (jobsIndexFromIpa !== -1) {
            listaEvaluada = jobSummaries.slice(0,jobsIndexFromIpa);
          }else {
              listaEvaluada = jobSummaries;
          }
      }else if(inventory == '347'){
          templateName = 'wst_cctv_x11_vnc_v0.1.1';
          listaEvaluada = jobSummaries;
      }

      jobNamesIpa = listaEvaluada.map(job => job.summary_fields.job.name);
      console.log('Lista para cctv a trabajar', jobNamesIpa);


      const matchingJob = listaEvaluada.find(job => {
          const jobName = job.summary_fields.job.name;
          const jobStatus = job.failed;
          return jobName === templateName && !jobStatus;
      });

      if (matchingJob) {
          status = 'Actualizado';
      } else if (jobSummaries.some(job => job.summary_fields.job.name === templateName)) {
          status = 'Fallido';
      }
  } catch (error) {
      console.error(`Error al obtener trabajos para el host ${host.name}:`, error.message);
  }

  return {
      id: host.id,
      name: host.name,
      description: host.description,
      inventory: host.inventory,
      status: status,
      enabled: host.enabled,
      jobNames: jobNames,

  };
}