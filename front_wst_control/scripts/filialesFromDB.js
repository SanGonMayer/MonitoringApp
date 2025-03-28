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
  'f0071', 'f0603', 'f0661', 'f0663', 'f0664', 'f0662','f0665', 'f0668', 'f0299', 'f0676',
  'wst', 'pve','f0999',
];


const gruposTesting = [
  'f0603', 'f0676',
];


const gruposCajas = [
  'f0504', 'f0509', 'f0513', 'f0514', 'f0559', 'f0579', 'f0580', 'f0583', 'f0584', 'f0593',
  'f0594', 'f0595', 'f0597', 'f0652', 'f0688', 'f0703',
];


//////////////////////7

const gruposExcluidosSrno = [
  'f0000',
  'f0071', 'f0603', 'f0661', 'f0663', 'f0664', 'f0662','f0665', 'f0668', 'f0299', 'f0676',
  'wst', 'pve','f0999',
  'f0036','f0174','f0344','f0346',
];


const gruposObras = [
  'f0036','f0174','f0344','f0346',
];

////////////////////////////


async function fetchFilialesConHostsFromDB(tipoTerminal) {
  try {
    let tipo = '';

    if (tipoTerminal === 'wst.html') {
      tipo = 'WORKSTATION';
    } else if (tipoTerminal === 'cctv.html') {
      tipo = 'CCTV';
    }

      console.log('Fetching filiales from the database:', tipoTerminal);
      const response = await fetch(`http://sncl1001lx.bancocredicoop.coop:3000/api/db/filiales/${tipo}`);
      
      if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(`Error al obtener filiales desde la base de datos: ${errorDetails}`);
      }

    const filiales = await response.json();

    console.log("Filiales traidas", filiales);
    //

    //
    const { filialesFiltradas, filialesTesting, filialesCajas } = filtrarFiliales(filiales, tipoTerminal);

    console.log('Filiales filtradas:', filialesFiltradas);
    console.log('Filiales en testing:', filialesTesting);
    console.log('Filiales de caja:', filialesCajas);

    inicializarEstadosFiliales(); 
    //sinicializarEstadosHosts();
    inicializarEstadosHostsListas();

    clearFilialContainer();
    createFilialButtons(filialesFiltradas, tipoTerminal);
    createFilialButtonsComercial(filialesCajas, tipoTerminal);
    createFilialButtonsTesting(filialesTesting, tipoTerminal);


    console.log('cantidad de filiales actualizadas', window.actualizadas)
    console.log('cantidad de filiales pendientes', window.pendientes)
    console.log('cantidad de filiales fallidas', window.fallidas)

    //updateCantidadDeHosts();
    //updateCantidadDeFiliales();

  } catch (error) {
    console.error('Error obteniendo las filiales desde la base de datos:', error);
  }
}
  


function clearFilialContainer() {
  const filialContainer = document.querySelector('#filialContainer');
  filialContainer.innerHTML = '';
}



function filtrarFiliales(filiales, tipoTerminal) {
  const filialesFiltradas = [];
  const filialesTesting = [];
  const filialesCajas = [];

  filiales.forEach(filial => {
    const isExcluded = gruposExcluidos.includes(filial.name.toLowerCase());
    const isTesting = gruposTesting.includes(filial.name.toLowerCase());
    const isCaja = gruposCajas.includes(filial.name.toLowerCase());

    if (tipoTerminal === 'wst.html' && filial.hasWST) {
      if (!isExcluded && !isCaja) filialesFiltradas.push(filial); // NO debe ser caja
      if (isTesting) filialesTesting.push(filial);
      if (isCaja) filialesCajas.push(filial);
    } else if (tipoTerminal === 'cctv.html' && filial.hasCCTV) {
      if (!isExcluded && !isCaja) filialesFiltradas.push(filial); // NO debe ser caja
      if (isTesting) filialesTesting.push(filial);
      if (isCaja) filialesCajas.push(filial);
    }
  });

  console.log("Motrar las filailes operativas", filialesFiltradas);
  console.log("Motrar las filailes comerciales", filialesCajas);
  console.log("Motrar las filailes testing", filialesTesting);

  return { filialesFiltradas, filialesTesting, filialesCajas };
}



async function createFilialButtons(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainer');

  const tableElement = document.querySelector('#workstationsTable'); // Seleccionamos la tabla para scroll
  tableElement.style.display = 'none';

  for (const filial of filiales) {
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



async function createFilialButtonsComercial(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainerComercial');

  const tableElement = document.querySelector('#workstationsTable'); // Seleccionamos la tabla para scroll
  tableElement.style.display = 'none';

  for (const filial of filiales) {
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
  //updateCantidadDeHosts();
  //updateCantidadDeFiliales();
}



async function createFilialButtonsTesting(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainerTesting');
  //inicializarEstadosFiliales(); 
  //inicializarEstadosHostsListas();

  const tableElement = document.querySelector('#workstationsTable'); // Seleccionamos la tabla para scroll
  tableElement.style.display = 'none';

  for (const filial of filiales) {
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



function updateCantidadDeHosts(){
  if (window.totalFiliales === 0) return;

  console.log('cantidad de filiales actualizadas', window.hostsActualizados.length)
  console.log('cantidad de filiales pendientes', window.hostsPendientes.length)
  console.log('cantidad de filiales fallidas', window.hostsFallidos.length)
  
  document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${window.hostsActualizados.length}`;
  document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${window.hostsPendientes.length}`;
  document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${window.hostsFallidos.length}`;
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



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// PARA GRAFICO DE TIPO TORTA


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
        filialesFiltradas = filiales.filter(filial => filial.hasCCTV && !gruposExcluidos.includes(filial.name.toLowerCase()));
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



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/// PARA EL SRNOFF 

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

    const { filialesFiltradas, filialesObras, filialesCajas } = filtrarFilialesSrno(filiales, tipoTerminal);

    console.log('Filiales filtradas:', filialesFiltradas);
    console.log('Filiales en obras:', filialesObras);
    console.log('Filiales de caja:', filialesCajas);

    inicializarEstadosFiliales(); 
    //sinicializarEstadosHosts();
    inicializarEstadosHostsListas();

    clearFilialContainer();
    createFilialButtonsSro(filialesFiltradas, tipoTerminal);
    createFilialButtonsComercialSrno(filialesCajas, tipoTerminal);
    createFilialButtonsObrasSrno(filialesObras, tipoTerminal);


    console.log('cantidad de filiales actualizadas', window.actualizadas)
    console.log('cantidad de filiales pendientes', window.pendientes)
    console.log('cantidad de filiales fallidas', window.fallidas)


  } catch (error) {
    console.error('Error obteniendo las filiales desde la base de datos:', error);
    return [];
  }
}


async function createFilialButtonsSro(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainer');
  inicializarEstadosFiliales(); 
  inicializarEstadosHostsListas();
  
  const tableElement = document.querySelector('#workstationsTable');
  tableElement.style.display = 'none';

  // Aquí agregas la detección del nombre de la página
  const pageName = window.location.pathname.split('/').pop();
  console.log('pageName (SRO):', pageName);
  const isSrnoPage = pageName === 'srno.html';

  for (const filial of filiales) {
    const button = document.createElement('button');
    button.classList.add('custom-button');

    // Ajustar el "tipo"
    const tipo = tipoTerminal === 'srno.html' ? 'wst' : 'cctv';

    const { color, hosts } = await evaluarEstadoHostsSrno(filial.id, tipo);
    button.style.backgroundColor = color;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = filial.name;
    nameSpan.classList.add('button-name');

    const hostsSpan = document.createElement('span');

    // Si es srno.html, contar solo pendientes/fallidos
    if (isSrnoPage) {
      const pendientesOFallidos = hosts.filter(
        h => h.status === 'fallido' || h.status === 'pendiente'
      );
      hostsSpan.textContent = pendientesOFallidos.length;
    } else {
      hostsSpan.textContent = hosts.length;
    }
    hostsSpan.classList.add('button-hosts');

        // Agregar los spans al botón
        button.appendChild(nameSpan);
        button.appendChild(hostsSpan);

        console.log('ID de la filial actual:', filial.id);
  
        // Asigna los hosts directamente al evento click sin volver a hacer fetch
        button.onclick = () => {
            const filialName = filial.name; 
            sessionStorage.setItem('filialHosts', JSON.stringify(hosts));
            console.log("Hosts guardados en sessionStorage:", JSON.parse(sessionStorage.getItem('filialHosts')));
            window.open(`filial.html?name=${filialName}&from=${tipo}&action=filialHost`, '_blank');
        };
        
        // Agregar el botón directamente al contenedor principal
        filialContainer.appendChild(button);
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


async function createFilialButtonsComercialSrno(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainerComercial');

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
  //updateCantidadDeHosts();
  //updateCantidadDeFiliales();
}


async function createFilialButtonsObrasSrno(filiales, tipoTerminal) {
  const filialContainer = document.querySelector('#filialContainerTesting');
  //inicializarEstadosFiliales(); 
  //inicializarEstadosHostsListas();

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
}



function filtrarFilialesSrno(filiales, tipoTerminal) {
  const filialesFiltradas = [];
  const filialesObras = [];
  const filialesCajas = [];

  filiales.forEach(filial => {
    const isExcluded = gruposExcluidosSrno.includes(filial.name.toLowerCase());
    const isObra = gruposObras.includes(filial.name.toLowerCase());
    const isCaja = gruposCajas.includes(filial.name.toLowerCase());

    if (tipoTerminal === 'srno.html' && filial.hasWST) {
      if (!isExcluded && !isCaja) filialesFiltradas.push(filial); // NO debe ser caja
      if (isObra) filialesObras.push(filial);
      if (isCaja) filialesCajas.push(filial);
    } else if (tipoTerminal === 'cctv.html' && filial.hasCCTV) {
      if (!isExcluded && !isCaja) filialesFiltradas.push(filial); // NO debe ser caja
      if (isObra) filialesObras.push(filial);
      if (isCaja) filialesCajas.push(filial);
    }
  });

  console.log("Motrar las filailes operativas", filialesFiltradas);
  console.log("Motrar las filailes comerciales", filialesCajas);
  console.log("Motrar las filailes obras", filialesObras);

  return { filialesFiltradas, filialesObras, filialesCajas };
}



window.clearFilialContainer = clearFilialContainer;
window.createFilialButtons = createFilialButtons;
window.fetchFilialesGraficoDB = fetchFilialesGraficoDB;
window.evaluarEstadoFiliales = evaluarEstadoFiliales;
window.fetchFilialesConHostsFromDB = fetchFilialesConHostsFromDB;

window.fetchFilialesConHostsSrno = fetchFilialesConHostsSrno;
window.evaluarEstadoHostsSrno = evaluarEstadoHostsSrno;
window.createFilialButtonsSro = createFilialButtonsSro;

