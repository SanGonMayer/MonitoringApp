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

      const rutaJobsAwx = `http://sawx0001lx.bancocredicoop.coop/#/inventories/inventory/22/hosts/edit/${id}/completed_jobs?`
      
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td><a href="${rutaJobsAwx}" target="_blank">${host.name}</a></td>
          <td>${host.id}</td>
          <td>${host.description || 'Sin descripción'}</td>
          <td>${host.status || 'Desconocido'}</td>

        </tr>
      `;
      tableBody.innerHTML += row;
    });
  }
  
  window.fetchHostsFromDB = fetchHostsFromDB;
  window.displayHosts = displayHosts;
  