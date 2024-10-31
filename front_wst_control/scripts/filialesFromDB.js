const gruposExcluidos = [
  'f0504', 'f0509', 'f0513', 'f0514', 'f0559', 'f0579', 'f0580', 'f0583', 'f0584', 'f0593', 'f0594', 'f0595', 'f0597', 'f0652', 'f0653', 'f0688', 'f0703',
  'f0071', 'f0517', 'f0603', 'f0661', 'f0662', 'f0663', 'f0664', 'f0665', 'f0668',
  'wst', 'pve','f0999'
];


async function fetchFilialesFromDB(tipoTerminal) {
    try {
      console.log('Fetching filiales from the database:', tipoTerminal);
      const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/db/filiales');
      
      if (!response.ok) {
        throw new Error('Error al obtener filiales desde la base de datos');
      }
  
      const filiales = await response.json();
  
      /* const filialesFiltradas = filiales.filter(filial => {
        return (tipoTerminal === 'wst.html' && filial.hasWST) ||
               (tipoTerminal === 'cctv.html' && filial.hasCCTV);
      }); */

      let filialesFiltradas = []; 

      if (tipoTerminal === 'wst.html') {
        filialesFiltradas = filiales.filter(filial => filial.hasWST && !gruposExcluidos.includes(filial.name.toLowerCase()));
      } else if (tipoTerminal === 'cctv.html') {
        console.log('Estoy evaluando las filiales para cctv')
        filialesFiltradas = filiales.filter(filial => filial.hasCCTV );
      }
  
      console.log('Filiales filtradas:', filialesFiltradas);
      
      clearFilialContainer();

      createFilialButtons(filialesFiltradas, tipoTerminal);

      return filialesFiltradas;
  
    } catch (error) {
      console.error('Error obteniendo las filiales desde la base de datos:', error);
      return [];
    }
  }
  

function clearFilialContainer() {
    const filialContainer = document.querySelector('#filialContainer');
    filialContainer.innerHTML = '';
}

/* function createFilialButtons(filiales, tipoTerminal) {
    const filialContainer = document.querySelector('#filialContainer');
    
    filiales.forEach(filial => {
        const button = document.createElement('button');
        button.textContent = filial.name;
        button.classList.add('custom-button');
        
        button.onclick = async () => {
            const tipo = tipoTerminal === 'wst.html' ? 'wst' : 'cctv';
            const hosts = await fetchHostsFromDB(filial.id, tipo);
            displayHosts(hosts);
        };
        
        filialContainer.appendChild(button);
    });
} */



/* ------------------------------------- */

function inicializarEstadosFiliales() {
  window.totalFiliales = 0;
  window.actualizadas = 0;
  window.pendientes = 0;
  window.fallidas = 0;
}

function inicializarEstadosHosts() {
  window.totalHosts = 0;
  window.hostsActualizados = 0;
  window.hostsPendientes = 0;
  window.hostsFallidos = 0;
}


async function createFilialButtons(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainer');
  inicializarEstadosFiliales(); 
  inicializarEstadosHosts();

  for (const filial of filiales) {
      const button = document.createElement('button');
      button.textContent = filial.name;
      button.classList.add('custom-button');

      const tipo = tipoTerminal === 'wst.html' ? 'wst' : 'cctv';
      // Llamamos a evaluarEstadoHosts y obtenemos también los hosts
      const { color, hosts } = await evaluarEstadoHosts(filial.id, tipo);
      button.style.backgroundColor = color;

      // Asigna los hosts directamente al evento click sin volver a hacer fetch
      button.onclick = () => {
          displayHosts(hosts);
      };

      filialContainer.appendChild(button); // Asegúrate de agregar el botón al contenedor
      window.allButtons.push(button);
  }
  console.log('Mostrando botones de filiales', window.allButtons);
  updateCantidadDeFiliales();
}


async function evaluarEstadoHosts(filialId, tipo) {
  try {
      const hosts = await fetchHostsFromDB(filialId, tipo);
      let hayPendientes = false;
      let hayFallidas = false;
      let todasActualizadas = true;
      let color = '';

      hosts.forEach(host => {
          window.totalHosts++;
          const status = host.status || 'pendiente';

          if (status === 'pendiente') {
              window.hostsPendientes++;
              hayPendientes = true;
              todasActualizadas = false;
          } else if (status === 'fallido') {
              window.hostsFallidos++;
              hayFallidas = true;
              todasActualizadas = false;
          } else if (status !== 'actualizado') {
              window.hostsActualizados++;
              todasActualizadas = false;
          }
      });

      window.totalFiliales++;
      if (hayFallidas) {
          window.fallidas++;
          color = 'red'; 
      } else if (hayPendientes) {
          window.pendientes++;
          color = '#ffc107'; 
      } else if (todasActualizadas) {
          window.actualizadas++;
          color = 'green'; 
      }
      return { color , hosts };
  } catch (error) {
      console.error('Error evaluando los hosts:', error);
      return 'gray'; // Para este caso de error, poder devolver color grey por defecto, o crear otro try catch arriba solo para cuando 
                     // hace fetch de los hosts
  }
}


function updateCantidadDeFiliales(){
  if (window.totalFiliales === 0) return;

  console.log('cantidad de filiales actualizadas', window.actualizadas)
  console.log('cantidad de filiales pendientes', window.pendientes)
  console.log('cantidad de filiales fallidas', window.fallidas)
  
  document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${window.actualizadas}`;
  document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${window.pendientes}`;
  document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${window.fallidas}`;
}



async function evaluarEstadoFiliales(filialId, tipo) {

  inicializarEstadosFiliales(); 
  inicializarEstadosHosts();
  
  try {
      const hosts = await fetchHostsFromDB(filialId, tipo);
      let hayPendientes = false;
      let hayFallidas = false;
      let todasActualizadas = true;

      let filialesActualizadas = 0
      let filialesPendientes = 0
      let filialesFallidas = 0

      hosts.forEach(host => {
          window.totalHosts++;
          const status = host.status || 'pendiente';

          if (status === 'pendiente') {
              window.hostsPendientes++;
              hayPendientes = true;
              todasActualizadas = false;
          } else if (status === 'fallido') {
              window.hostsFallidos++;
              hayFallidas = true;
              todasActualizadas = false;
          } else if (status !== 'actualizado') {
              window.hostsActualizados++;
              todasActualizadas = false;
          }
      });

      if (hayFallidas) {
          window.fallidas++;
      } else if (hayPendientes) {
          window.pendientes++;
      } else if (todasActualizadas) {
          window.actualizadas++;
      }

      filialesActualizadas = window.actualizadas;
      filialesPendientes = window.pendientes;
      filialesFallidas = window.fallidas;
      
      return { filialesActualizadas, filialesPendientes, filialesFallidas};
  } catch (error) {
      console.error('Error evaluando los hosts:', error);
      return 'gray'; // Para este caso de error, poder devolver color grey por defecto, o crear otro try catch arriba solo para cuando 
                     // hace fetch de los hosts
  }
}
/* ------------------------------------- */

window.fetchFilialesFromDB = fetchFilialesFromDB;
window.clearFilialContainer = clearFilialContainer;
window.createFilialButtons = createFilialButtons;
