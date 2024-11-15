async function fetchHostsFromDB(filialId, tipoTerminal) {
    try {
      console.log(`Fetching hosts for filial ${filialId} and tipo ${tipoTerminal}`);
      const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/db/filiales/${filialId}/hosts?tipo=${tipoTerminal}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener hosts desde la base de datos');
      }
  
      const hosts = await response.json();
      console.log('Hosts obtenidos:', hosts);
      return hosts;
    } catch (error) {
      console.error('Error obteniendo los hosts desde la base de datos:', error);
      return [];
    }
  }
  
  function displayHosts(hosts) {
    const tableBody = document.querySelector('#workstationsTable tbody');
    tableBody.innerHTML = ''; 
    
    hosts.forEach((host, index) => {
        //const jobNames = host.jobNames.join(', ');

      const rutaJobsAwx = `http://sawx0001lx.bancocredicoop.coop/#/inventories/inventory/22/hosts/edit/${host.id}/completed_jobs?`
      const jobWolButton = `<button onclick="launchJobWol('${host.name}')">Ejecutar</button>`
      const jobUpdButton = `<button onclick="launchJobUpd('${host.name}')">Ejecutar</button>`

      let descriptionStatus = '';
      if (host.status === 'actualizado') {
          descriptionStatus = 'bg-green';
      } else if (host.status === 'pendiente') {
          descriptionStatus = 'bg-yellow';
      } else if (host.status === 'fallido') {
          descriptionStatus = 'bg-red';
      }
      
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td><a href="${rutaJobsAwx}" target="_blank">${host.name}</a></td>
          <td>${host.id}</td>
          <td>${host.description || 'Sin descripción'}</td>
          <td><span class="${descriptionStatus}">${host.status || 'Desconocido'}</span></td>
          <td>${jobWolButton}</td>
          <td>${jobUpdButton}</td>

        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }

  async function launchJobWol(hostname) {
    try {

      console.log("Iniciando ejecución del job para el host:", hostname);


      const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/awx/launch-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_template_id: 1263,
          hostname: hostname,
        }),
      });

      const responseText = await response.text();

      console.log("Texto completo de la respuesta:", responseText);

      let data;
      try {
          data = JSON.parse(responseText);
      } catch (jsonError) {
          console.error("Error al parsear JSON:", jsonError);
          alert("Error al lanzar el job: Respuesta no válida del servidor.");
          return;
      }
  
      //const data = await response.json();
  
      if (response.ok) {
        alert(`Job lanzado correctamente en el host ${hostname}. ID del job: ${data.job_id}`);
      } else {
        alert(`Error al lanzar el job: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al lanzar el job:', error);
      alert('Error al lanzar el job.');
    }
  }

  async function launchJobUpd(hostname) {
    try {

      console.log("Iniciando ejecución del job para el host:", hostname);


      const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/awx/launch-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_template_id: 1678,
          hostname: hostname,
        }),
      });

      const responseText = await response.text();

      console.log("Texto completo de la respuesta:", responseText);

      let data;
      try {
          data = JSON.parse(responseText);
      } catch (jsonError) {
          console.error("Error al parsear JSON:", jsonError);
          alert("Error al lanzar el job: Respuesta no válida del servidor.");
          return;
      }
  
      //const data = await response.json();
  
      if (response.ok) {
        alert(`Job lanzado correctamente en el host ${hostname}. ID del job: ${data.job_id}`);
      } else {
        alert(`Error al lanzar el job: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al lanzar el job:', error);
      alert('Error al lanzar el job.');
    }
  }
  

async function fetchHostsFromDBSrno(filialId, tipoTerminal) {
  try {
    console.log(`Fetching hosts for filial ${filialId} and tipo ${tipoTerminal}`);
    const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/db/filiales/${filialId}/hosts/srno?tipo=${tipoTerminal}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener hosts desde la base de datos');
    }

    const hosts = await response.json();
    console.log('Hosts obtenidos:', hosts);
    return hosts;
  } catch (error) {
    console.error('Error obteniendo los hosts desde la base de datos:', error);
    return [];
  }
}
  
  window.fetchHostsFromDB = fetchHostsFromDB;
  window.displayHosts = displayHosts;
  window.launchJobWol = launchJobWol;
  window.launchJobUpd = launchJobUpd;

  window.fetchHostsFromDBSrno = fetchHostsFromDBSrno;
  