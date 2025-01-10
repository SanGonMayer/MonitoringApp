async function fetchHostsFromDB(filialId, tipoTerminal) {
    try {
      console.log(`Fetching hosts for filial ${filialId} and tipo ${tipoTerminal}`);
      const response = await fetch(`http://sncl1001lx.bancocredicoop.coop:3000/api/db/filiales/${filialId}/hosts?tipo=${tipoTerminal}`);
      
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
  
  function displayHosts(hosts, fromPage) {
    const tableBody = document.querySelector('#workstationsTable tbody');
    tableBody.innerHTML = ''; 
    
    hosts.forEach((host, index) => {
        //const jobNames = host.jobNames.join(', ');

      const rutaJobsAwx = `http://sawx0001lx.bancocredicoop.coop/#/inventories/inventory/22/hosts/edit/${host.id}/completed_jobs?`
      const jobWolButton = `<button onclick="launchJobWol('${host.name}', '${fromPage}')">Ejecutar</button>`;
      const jobUpdButton = `<button onclick="launchJobUpd('${host.name}', '${fromPage}')">Ejecutar</button>`;

      let descriptionStatus = '';
      if (host.status === 'actualizado') {
          descriptionStatus = 'bg-green';
      } else if (host.status === 'pendiente') {
          descriptionStatus = 'bg-yellow';
      } else if (host.status === 'fallido') {
          descriptionStatus = 'bg-red';
      }

      console.log('fecha del host', host.dateSuccesful);
      
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td><a href="${rutaJobsAwx}" target="_blank">${host.name}</a></td>
          <td>${host.id}</td>
          <td>${host.description || 'Sin descripción'}</td>
          <td>
            <span 
              class="status ${descriptionStatus}" 
              data-status="${host.status || 'Desconocido'}" 
              data-date="${host.dateSuccesful || 'Sin fecha'}">
              ${host.status || 'Desconocido'}
            </span>
          </td>
          <td>${jobWolButton}</td>
          <td>${jobUpdButton}</td>

        </tr>
      `;
      tableBody.innerHTML += row;
    });

    // Agregar eventos para todos los spans
    const statusSpans = tableBody.querySelectorAll('.status');
    statusSpans.forEach(span => {
        span.addEventListener('mouseenter', function() {
            this.textContent = this.getAttribute('data-date');
        });
        span.addEventListener('mouseleave', function() {
            this.textContent = this.getAttribute('data-status');
        });
    });
  }

  async function launchJobWol(hostname,fromPage) {
    try {

    // Validar credenciales
    const credentials = await validateCredentials();
    if (!credentials) {

      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: "No se pudo validar las credenciales",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Credenciales aceptadas",
      text: `Usuario: ${credentials.username}`,
    });

      console.log("Iniciando ejecución del job para el host:", hostname);

      let template_id = 0;
      if ( fromPage === 'wst'){
        template_id = 1263;
        console.log("fromPage recibido:", fromPage);
      } else if (fromPage === 'cctv'){
        template_id = 1565;
        console.log("fromPage recibido:", fromPage);
      }

      const response = await fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/awx/launch-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_template_id: template_id,
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

  async function launchJobUpd(hostname, fromPage) {
    try {

      console.log("Iniciando ejecución del job para el host:", hostname);

      let template_id = 0;
      if ( fromPage === 'wst'){
        template_id = 1678;
        console.log("fromPage recibido:", fromPage);
      } else if (fromPage === 'cctv'){
        template_id = 1613;
        console.log("fromPage recibido:", fromPage);
      }

      const response = await fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/awx/launch-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_template_id: template_id,
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
    const response = await fetch(`http://sncl1001lx.bancocredicoop.coop:3000/api/db/filiales/${filialId}/hosts/srno?tipo=${tipoTerminal}`);
    
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

export async function validateCredentials() {
  return new Promise((resolve) => {
    Swal.fire({
      title: "Ingrese sus credenciales",
      html:
        '<input id="swal-username" class="swal2-input" placeholder="Usuario">' +
        '<input id="swal-password" class="swal2-input" placeholder="Contraseña" type="password">',
      focusConfirm: false,
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonText: "Aceptar",
      preConfirm: async () => {
        const username = document.getElementById("swal-username").value;
        const password = document.getElementById("swal-password").value;

        const response = await fetch("http://localhost:3000/validate-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (!result.success) {
          Swal.showValidationMessage("Credenciales incorrectas");
          return null;
        }

        return { username, password };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        resolve(result.value); // Si las credenciales son válidas, las devuelve
      } else {
        resolve(null); // Si se cancela, devuelve null
      }
    });
  });
}



  
  window.fetchHostsFromDB = fetchHostsFromDB;
  window.displayHosts = displayHosts;
  window.launchJobWol = launchJobWol;
  window.launchJobUpd = launchJobUpd;

  window.fetchHostsFromDBSrno = fetchHostsFromDBSrno;
  