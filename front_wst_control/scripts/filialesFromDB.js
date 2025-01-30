function inicializarEstadosFiliales() {
  window.totalFiliales = 0;
  window.actualizadas = 0;
  window.pendientes = 0;
  window.fallidas = 0;
}


function inicializarEstadosHostsListas(){
  window.hostsActualizados = [];
  window.hostsPendientes = [];
  window.hostsFallidos = [];
}


window.hostsActualizados = [];
window.hostsPendientes = [];
window.hostsFallidos = [];


const gruposExcluidos = [
  'f0000',
  'f0071', 'f0603', 'f0661', 'f0662', 'f0664','f0665', 'f0668', 'f0299',
  'wst', 'pve','f0999'
];


async function fetchFilialesConHostsFromDB(tipoTerminal) {
  try {

      let tipo = '';

      if (tipoTerminal === 'wst.html'){
          tipo = 'WORKSTATION';
      } else if (tipoTerminal === 'cctv.html'){
          tipo = 'CCTV';
      }


      console.log('Fetching filiales from the database:', tipoTerminal);
      const response = await fetch(`http://sncl1001lx.bancocredicoop.coop:3000/api/db/filiales/${tipo}`);
      
      if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(`Error al obtener filiales desde la base de datos: ${errorDetails}`);
      }

      const filiales = await response.json();
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



/* async function createFilialButtons(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainer');
  inicializarEstadosFiliales(); 
  //sinicializarEstadosHosts();
  inicializarEstadosHostsListas();

  const tableElement = document.querySelector('#workstationsTable'); // Seleccionamos la tabla para scroll
  tableElement.style.display = 'none';

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

        const filialName = filial.name; 
        
        sessionStorage.setItem('filialHosts', JSON.stringify(hosts));
        console.log("Hosts guardados en sessionStorage:", JSON.parse(sessionStorage.getItem('filialHosts')));
        window.open(`filial.html?name=${filialName}&from=${tipo}&action=filialHost`, '_blank');
      };

      filialContainer.appendChild(button); // Asegúrate de agregar el botón al contenedor
      window.allButtons.push(button);
  }
  console.log('Mostrando botones de filiales', window.allButtons);
  updateCantidadDeHosts();
  updateCantidadDeFiliales();
} */

async function createFilialButtons(filiales, tipoTerminal) {
    const filialContainer = document.querySelector('#filialContainer');
    inicializarEstadosFiliales(); 
    //sinicializarEstadosHosts();
    inicializarEstadosHostsListas();
  
    const tableElement = document.querySelector('#workstationsTable'); // Seleccionamos la tabla para scroll
    tableElement.style.display = 'none';

    const response = await fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/filiales-con-movimientos')
    console.log('🔍 Respuesta de la API:', response);
    const { filialesConMovimientos } = await response.json();
    console.log('Filiales con movimientos:', filialesConMovimientos);
  
    for (const filial of filiales) {
        const anilloCont = document.createElement('div'); // Contenedor para el anillo
        anilloCont.classList.add('anillo-cont');

        const button = document.createElement('button');
        button.classList.add('custom-button');
    
        const tipo = tipoTerminal === 'wst.html' ? 'wst' : 'cctv';
    
        // Evaluar el estado de los hosts
        const { color, hosts } = await evaluarEstadoHosts(filial.id, tipo);
        button.style.backgroundColor = color;
    
        // Crear los spans para el nombre y la cantidad de hosts
        const nameSpan = document.createElement('span');
        nameSpan.textContent = filial.name;
        nameSpan.classList.add('button-name');
    
        const hostsSpan = document.createElement('span');
        hostsSpan.textContent = `${hosts.length}`;
        hostsSpan.classList.add('button-hosts');
    
        // Agregar los spans al botón
        button.appendChild(nameSpan);
        button.appendChild(hostsSpan);

        console.log('ID de la filial actual:', filial.id);

        // Si la filial tuvo movimientos, agregar la clase de anillo animado
        if (filialesConMovimientos.includes(Number(filial.id))) {
        button.classList.add('anillo-animado');
        }
  
        // Asigna los hosts directamente al evento click sin volver a hacer fetch
        button.onclick = () => {
  
          const filialName = filial.name; 
          
          sessionStorage.setItem('filialHosts', JSON.stringify(hosts));
          console.log("Hosts guardados en sessionStorage:", JSON.parse(sessionStorage.getItem('filialHosts')));
          window.open(`filial.html?name=${filialName}&from=${tipo}&action=filialHost`, '_blank');
        };
        
        anilloCont.appendChild(button); //agregar el botón al contenedor
        filialContainer.appendChild(anilloCont); // Asegúrate de agregar el botón al contenedor
        window.allButtons.push(button);
    }
    console.log('Mostrando botones de filiales', window.allButtons);
    updateCantidadDeHosts();
    updateCantidadDeFiliales();
}


async function evaluarEstadoHosts(filialId, tipo) {
  try {
      const hosts = await fetchHostsFromDB(filialId, tipo); //EN ESTE CASO, SE PODRIA EVALULAR SI QUIERO ESTE O OTRO DEPEDIENDO SI ES PARA SRNO
      let hayPendientes = false;
      let hayFallidas = false;
      let todasActualizadas = true;
      let color = '';

      hosts.forEach(host => {
          window.totalHosts++;
          const status = host.status || 'pendiente';

          if( status === 'actualizado'){
              window.hostsActualizados.push(host);
          } else if (status === 'pendiente') {
              window.hostsPendientes.push(host);
              hayPendientes = true;
              todasActualizadas = false;
          } else if (status === 'fallido') {
              window.hostsFallidos.push(host);
              hayFallidas = true;
              todasActualizadas = false;
          } else if (status !== 'actualizado') {
              wwindow.hostsActualizados.push(host);
              todasActualizadas = false;
          }
      });

      window.totalFiliales++;
      if (hayFallidas) {
          window.fallidas++;
          color = '#dc3545'; 
      } else if (hayPendientes) {
          window.pendientes++;
          color = '#ffc107'; 
      } else if (todasActualizadas) {
          window.actualizadas++;
          color = '#28a745'; //
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
  
  document.querySelector('.main-skills .card:nth-child(1) .circle-filial span').textContent = `${window.actualizadas}`;
  document.querySelector('.main-skills .card:nth-child(2) .circle-filial span').textContent = `${window.pendientes}`;
  document.querySelector('.main-skills .card:nth-child(3) .circle-filial span').textContent = `${window.fallidas}`;
}



async function fetchFilialesGraficoDB(tipoTerminal) {
  try {
    let tipo = '';

    if (tipoTerminal === 'wst.html'){
      tipo = 'WORKSTATION';
    } else if (tipoTerminal === 'cctv.html'){
      tipo = 'CCTV';
    }


    console.log('Fetching filiales from the database:', tipoTerminal);
    const response = await fetch(`http://sncl1001lx.bancocredicoop.coop:3000/api/db/filiales/${tipo}`);
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Error al obtener filiales desde la base de datos: ${errorDetails}`);
    }

    const filiales = await response.json();

    let filialesFiltradas = []; 

    if (tipoTerminal === 'wst.html') {
      filialesFiltradas = filiales.filter(filial => filial.hasWST && !gruposExcluidos.includes(filial.name.toLowerCase()));
    } else if (tipoTerminal === 'cctv.html') {
      console.log('Estoy evaluando las filiales para cctv')
      filialesFiltradas = filiales.filter(filial => filial.hasCCTV );
    }

    console.log('Filiales filtradas:', filialesFiltradas);
    
    
    const { filialesActualizadas, filialesPendientes, filialesFallidas } = await evaluarEstadoFiliales(filialesFiltradas, tipoTerminal);
    return { filialesActualizadas, filialesPendientes, filialesFallidas };

  } catch (error) {
    console.error('Error obteniendo las filiales desde la base de datos:', error);
    return { filialesActualizadas: 0, filialesPendientes: 0, filialesFallidas: 0 };
  }
}



async function evaluarEstadoFiliales(filiales, tipoTerminal) {  // Cambiar filialesId -> filiales

  inicializarEstadosFiliales(); 
  //sinicializarEstadosHosts();
  
  try {
      let filialesActualizadas = 0
      let filialesPendientes = 0
      let filialesFallidas = 0
      const tipo = tipoTerminal === 'wst.html' ? 'wst' : 'cctv';

      for (const filial of filiales){
          
          const hosts = await fetchHostsFromDB(filial.id, tipo);
          let hayPendientes = false;
          let hayFallidas = false;
          let todasActualizadas = true;
  
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
      }
      

      filialesActualizadas = window.actualizadas;
      filialesPendientes = window.pendientes;
      filialesFallidas = window.fallidas;

      return { filialesActualizadas, filialesPendientes, filialesFallidas };
  } catch (error) {
      console.error('Error evaluando los hosts:', error);
      return { filialesActualizadas: 0, filialesPendientes: 0, filialesFallidas: 0 };
  }
}



/* ------------------------------------- */
/* ------------------------------------- */
/* ------------------------------------- */


async function fetchFilialesConHostsSrno(tipoTerminal) {
  try {

    let tipo = '';

    if (tipoTerminal === 'srno.html'){
      tipo = 'WORKSTATION';
    }

    console.log('Fetching filiales from the database:', tipoTerminal);
    const response = await fetch(`http://sncl1001lx.bancocredicoop.coop:3000/api/db/filiales/${tipo}`);
    
    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Error al obtener filiales desde la base de datos: ${errorDetails}`);
    }

    const filiales = await response.json();

    let filialesFiltradas = []; 

    if (tipoTerminal === 'srno.html') {
      filialesFiltradas = filiales.filter(filial => filial.hasWST && !gruposExcluidos.includes(filial.name.toLowerCase()));
    } else if (tipoTerminal === 'cctv.html') {
      console.log('Estoy evaluando las filiales para cctv')
      filialesFiltradas = filiales.filter(filial => filial.hasCCTV );
    }

    console.log('Filiales filtradas:', filialesFiltradas);
    
    clearFilialContainer();

    createFilialButtonsSro(filialesFiltradas, tipoTerminal);

    return filialesFiltradas;

  } catch (error) {
    console.error('Error obteniendo las filiales desde la base de datos:', error);
    return [];
  }
}


async function createFilialButtonsSro(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainer');
  inicializarEstadosFiliales(); 
  //inicializarEstadosHosts();
  inicializarEstadosHostsListas();

  const tableElement = document.querySelector('#workstationsTable'); // Seleccionamos la tabla para scroll
  tableElement.style.display = 'none';

  for (const filial of filiales) {
      const button = document.createElement('button');
      button.classList.add('custom-button');
  
      const tipo = tipoTerminal === 'srno.html' ? 'wst' : 'cctv';
  
      // Evaluar el estado de los hosts
      const { color, hosts } = await evaluarEstadoHostsSrno(filial.id, tipo);
      button.style.backgroundColor = color;
  
      // Crear los spans para el nombre y la cantidad de hosts
      const nameSpan = document.createElement('span');
      nameSpan.textContent = filial.name;
      nameSpan.classList.add('button-name');
  
      const hostsSpan = document.createElement('span');
      hostsSpan.textContent = `${hosts.length}`;
      hostsSpan.classList.add('button-hosts');
  
      // Agregar los spans al botón
      button.appendChild(nameSpan);
      button.appendChild(hostsSpan);


      // Asigna los hosts directamente al evento click sin volver a hacer fetch
      button.onclick = () => {

          const filialName = filial.name;
          
          sessionStorage.setItem('filialHosts', JSON.stringify(hosts));
          console.log("Hosts guardados en sessionStorage:", JSON.parse(sessionStorage.getItem('filialHosts')));
          window.open(`filial.html?name=${filialName}&from=${tipo}&action=filialHost`, '_blank');
      };

      filialContainer.appendChild(button); // Asegúrate de agregar el botón al contenedor
      window.allButtons.push(button);
  }
  console.log('Mostrando botones de filiales', window.allButtons);
  updateCantidadDeHosts();
  updateCantidadDeFiliales();

}


async function evaluarEstadoHostsSrno(filialId, tipo) {
  try {
      const hosts = await fetchHostsFromDBSrno(filialId, tipo);
      let hayPendientes = false;
      let hayFallidas = false;
      let todasActualizadas = true;
      let color = '';

      hosts.forEach(host => {
          window.totalHosts++;
          const status = host.status || 'pendiente';

          if( status === 'actualizado'){
              window.hostsActualizados.push(host);
          } else if (status === 'pendiente') {
              window.hostsPendientes.push(host);
              hayPendientes = true;
              todasActualizadas = false;
          } else if (status === 'fallido') {
              window.hostsFallidos.push(host);
              hayFallidas = true;
              todasActualizadas = false;
          } else if (status !== 'actualizado') {
              wwindow.hostsActualizados.push(host);
              todasActualizadas = false;
          }
      });

      window.totalFiliales++;
      if (hayFallidas) {
          window.fallidas++;
          color = '#dc3545'; 
      } else if (hayPendientes) {
          window.pendientes++;
          color = '#ffc107'; 
      } else if (todasActualizadas) {
          window.actualizadas++;
          color = '#28a745'; //
      }
      return { color , hosts };
  } catch (error) {
      console.error('Error evaluando los hosts:', error);
      return 'gray'; // Para este caso de error, poder devolver color grey por defecto, o crear otro try catch arriba solo para cuando 
                     // hace fetch de los hosts
  }
}


function updateCantidadDeHosts(){
  if (window.totalFiliales === 0) return;

  console.log('cantidad de filiales actualizadas', window.hostsActualizados.length)
  console.log('cantidad de filiales pendientes', window.hostsPendientes.length)
  console.log('cantidad de filiales fallidas', window.hostsFallidos.length)
  
  document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${window.hostsActualizados.length}`;
  document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${window.hostsPendientes.length}`;
  document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${window.hostsFallidos.length}`;
}


window.clearFilialContainer = clearFilialContainer;
window.createFilialButtons = createFilialButtons;
window.fetchFilialesGraficoDB = fetchFilialesGraficoDB;
window.evaluarEstadoFiliales = evaluarEstadoFiliales;
window.fetchFilialesConHostsFromDB = fetchFilialesConHostsFromDB;

window.fetchFilialesConHostsSrno = fetchFilialesConHostsSrno;
window.evaluarEstadoHostsSrno = evaluarEstadoHostsSrno;
window.createFilialButtonsSro = createFilialButtonsSro;

