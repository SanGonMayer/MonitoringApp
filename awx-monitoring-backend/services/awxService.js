import axios from 'axios';
import base64 from 'base-64';
import dotenv from 'dotenv';

dotenv.config();

const username = process.env.AWX_USER_TEST;
const password = process.env.AWX_USER_TEST_PASS;

const authConfig = {
  headers: {
    'Authorization': `Basic ${base64.encode(`${username}:${password}`)}`,
  },
};

// Función para manejar la paginación y obtener todas las páginas de una API
export async function fetchAllPages(apiUrl) {
  let page = 1;
  let allData = [];
  let morePages = true;

  while (morePages) {
    try {
      const response = await axios.get(`${apiUrl}?page=${page}`, authConfig);
      if (response.data.detail === 'Página inválida.') {
        morePages = false;
      } else {
        const data = response.data.results;
        allData = allData.concat(data);
        page++;
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error.message);
      morePages = false;
    }
  }

  return allData;
}

// Función para obtener el estado de los trabajos de un host
export async function getJobSummaries(host, templateName) {
  const jobSummariesUrl = `http://sawx0001lx.bancocredicoop.coop/api/v2/hosts/${host.id}/job_host_summaries/`;
  console.log(`Obteniendo trabajos para el host ${host.name} desde: ${jobSummariesUrl}`);

  let status = 'No ejecutado';
  let jobNames = [];

  try {
    // Llamamos a fetchAllPages para obtener los resúmenes de trabajo
    const jobSummaries = await fetchAllPages(jobSummariesUrl);
    jobNames = jobSummaries.map(job => job.summary_fields.job.name);

    // Buscar el trabajo que coincida con la plantilla (templateName)
    const matchingJob = jobSummaries.find(job => job.summary_fields.job.name === templateName);

    if (matchingJob) {
      // Si existe el trabajo, verificamos si falló o no
      status = matchingJob.failed ? 'Fallido' : 'Actualizado';
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
