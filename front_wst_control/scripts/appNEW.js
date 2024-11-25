/* ------------------------------------- */
// Variables globales para el estado

window.totalFiliales = 0;
window.actualizadas = 0;
window.pendientes = 0;
window.fallidas = 0;
window.allButtons = [];


document.addEventListener('DOMContentLoaded', () => {

  const terminal = window.location.pathname.split('/').pop(); 
  buscar(terminal);

  // -------------------- AL CLICKEAR ALGUNA CARD DE LAS 3 QUE HAY EN LA PAGINA

  filtrarFilialesPorCards();
  
  // -------------------- AL MOMENTO DE PRESIONAR EL BOTON "RECARGAR FILIALES"

  recargarFilialesHtml();

  // ------------------------ AL MOMENTO DE CLICKEAR EN ALGUNA FILIAL (EL EVENTO CLICK ESTA EN "FILIALES FROM DB")

  mostrarHostsDefilialHtml(); 

  //----------------------- PRUEBAS PARA LA PAGINACION AL MOMENTO FILTRAR ESTADOS DE HOSTS POR CARD
  nuevoFiltroDeCards();
  //configuracionPaginacion();
  actualizarRecuperarHosts();

  
});


async function buscar(tipoTerminal) {
  if (tipoTerminal === 'cctv.html') {
      //await fetchFilialesFromDB('cctv.html');
      await fetchFilialesConHostsFromDB('cctv.html');
  } else if (tipoTerminal === 'wst.html') {
      await fetchFilialesConHostsFromDB('wst.html');
  } else if(tipoTerminal === 'srno.html'){
      await fetchFilialesConHostsSrno('srno.html');
  } else if (tipoTerminal === ''){
      await crearGraficoCircular('#circularCctv','cctv.html');
      await crearGraficoCircular('#circularWst','wst.html');
  } else {
      console.log('Página no reconocida.');
  }
}


function filtrando() {

  // LIMPIANDO LA TABLA CUANDO SE BUSCA
  const tableBody = document.querySelector('#workstationsTable tbody');
  tableBody.innerHTML = ''; 

  const table = document.getElementById('workstationsTable');

  const filial = document.getElementById('search').value.toLowerCase();

  allButtons.forEach(button => {
      const buttonText = button.textContent.toLowerCase();
      button.style.display = buttonText.includes(filial) ? '' : 'none';
  });

  // Oculta la tabla
  table.style.display = 'none';
}


function filtrarFilialesPorCards(){
  const circles = document.querySelectorAll('.circle-filial');
  if (circles.length > 0) {
      circles.forEach(circle => {
          circle.addEventListener('click', () => {
              const color = window.getComputedStyle(circle).backgroundColor;
              filtrarPorColor(color);
          });
      });
  } else {
      console.log("No se encontraron elementos con la clase 'circle' en esta página.");
  }
}


function filtrarPorColor(selectedColor) {
  // Lógica para filtrar botones
  const table = document.getElementById('workstationsTable');
  const tableBody = document.querySelector('#workstationsTable tbody');
  tableBody.innerHTML = ''; 
  console.log('Mostrando el color por cada click', selectedColor);

  allButtons.forEach(button => {
      const backgroundColor = window.getComputedStyle(button).backgroundColor;
      // Compara el color del botón con el color seleccionado
      button.style.display = (backgroundColor === selectedColor) ? '' : 'none';
  });

  table.style.display = 'none';
}


function recargarFilialesHtml(){
  const actionButton = document.querySelector('#action-button');
  if (actionButton) {
      actionButton.addEventListener('click', () => {
          const filialContainer = document.querySelector('#filialContainer');
          filialContainer.innerHTML = '';

          const cards = document.querySelectorAll('.main-skills .card .circle span');
          cards.forEach(card => {
              card.textContent = '';
          });

          const cardsFilial = document.querySelectorAll('.main-skills .card .circle-filial span');
          cardsFilial.forEach(card => {
              card.textContent = '';
          });

          const terminal = window.location.pathname.split('/').pop();
          buscar(terminal);
      });
  } else {
      console.log("El botón actionButton no está presente en esta página, se omite el eventListener.");
  }
}


function mostrarHostsDefilialHtml(){
  const params = new URLSearchParams(window.location.search);
  const filialName = params.get('name');
  const fromPage = params.get('from');
  const action = params.get('action');  

  console.log('URL actual:', window.location.href);
  console.log('Parámetro action:', action);

  if (action == 'filialHost' && filialName) {
      console.log('Ahora ya se encontro una filialName, porque se clickeo en un boton filial')

      const actionButton = document.getElementById('action-upd-filial');
      if (actionButton) {
        if (fromPage === 'wst') {
            actionButton.textContent = 'Aplicar wst_upd_v1.8.1';
        } else if (fromPage === 'cctv') {
            actionButton.textContent = 'Aplicar ctv_upd_v0.2.0';
        } else {
            actionButton.textContent = 'Aplicar actualización genérica';
        }
      }

      // Recuperar los hosts desde sessionStorage y mostrar los datos si existen
      const hosts = JSON.parse(sessionStorage.getItem('filialHosts'));

      const breadcrumb = document.querySelector('.breadcrumb');
      breadcrumb.innerHTML = `
          <a href="/MonitoringAppFront/">Home</a> / 
          <a href="${fromPage}.html">${fromPage.toUpperCase()}</a> / 
          <a href="filial.html?name=${filialName}&from=${fromPage}">${filialName}</a>
      `;

      const headerText = document.querySelector('header h1');
      headerText.textContent += ` ${filialName}`;

      if (hosts) {
          
          const statsContainer = document.querySelector('.stats-container');
          

          
          // Limpiar el contenedor de estadísticas antes de agregar los nuevos divs
          statsContainer.innerHTML = '';

          // Contar los diferentes tipos de hosts
          const total = hosts.length;
          const actualizados = hosts.filter(host => host.status === 'actualizado').length;
          const pendientes = hosts.filter(host => host.status === 'pendiente').length;
          const fallidos = hosts.filter(host => host.status === 'fallido').length;

          const statsData = [
            { class: 'total', label: 'Total', value: total },
            { class: 'actualizadas', label: 'Actualizadas', value: actualizados },
            { class: 'pendientes', label: 'Pendientes', value: pendientes },
            { class: 'fallidos', label: 'Fallidos', value: fallidos }
          ];

          statsData.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.classList.add('stat', stat.class);
            statDiv.innerHTML = `${stat.label}: <span class="value">${stat.value}</span>`;
            statsContainer.appendChild(statDiv);
          });

          displayHosts(hosts, fromPage);

          //-----

          const hostsPendientesFallidos = hosts
            .filter(host => host.status === 'pendiente' || host.status === 'fallido') // Filtra los hosts
            .map(host => host.name) // Extrae solo los nombres
            .join(":");

          //-----
          actualizarFilialConUpd(hostsPendientesFallidos,fromPage);
      } else {
          console.error('No se encontraron datos de hosts en sessionStorage');
      }
  } else {
      console.error("No se ha pasado el nombre de la filial en la URL.");
  } 
}




//--------------------------------------------

function nuevoFiltroDeCards(){
    let filialName = "wst"; 
  
    const circles = document.querySelectorAll('.circle');
    if (circles.length > 0) {
        circles.forEach(circle => {
            circle.addEventListener('click', () => {
                const color = window.getComputedStyle(circle).backgroundColor;
                let hosts = [];
                let estado = '';
  
                // Selecciona la lista de hosts y el tipo según el color del círculo
                switch (color) {
                    case 'rgb(40, 167, 69)': // Verde
                        hosts = window.hostsActualizados;
                        estado = 'actualizados';
                        break;
                    case 'rgb(255, 193, 7)': // Amarillo
                        hosts = window.hostsPendientes;
                        estado = 'pendientes';
                        break;
                    case 'rgb(220, 53, 69)': // Rojo
                        hosts = window.hostsFallidos;
                        estado = 'fallidos';
                        break;
                    default:
                        console.warn('Color de círculo desconocido:', color);
                        return; // No hace nada si el color es desconocido
                }
  
                // Almacena los hosts seleccionados en sessionStorage y abre la nueva página
                sessionStorage.setItem('hostsElegidos', JSON.stringify(hosts));
                console.log("Hosts guardados en sessionStorage:", hosts);
  
                const terminal = window.location.pathname.split('/').pop(); 
                let tipo = '';
                if (terminal === 'wst.html'){
                    tipo = 'wst';
                }else if (terminal === 'cctv.html'){
                    tipo = 'cctv'
                }
  
                window.open(`filial.html?from=${tipo}&estado=${estado}&action=estadosHost`, '_blank');
                
            });
        });
    } else {
        console.log("No se encontraron elementos con la clase 'circle' en esta página.");
    }
}


function actualizarRecuperarHosts(){
    // Recuperar el tipo de hosts desde la URL y actualizar la interfaz
    const urlParams = new URLSearchParams(window.location.search);
    const fromPage = urlParams.get('from')
    const hostType = urlParams.get('estado');  // antes era actualizado, pendientes o fallido
    const action = urlParams.get('action'); 
  
    if (action == 'estadosHost' && hostType) {
  
        const actionButton = document.getElementById('action-upd-filial');
        if (actionButton) {
          if (fromPage === 'wst') {
              actionButton.textContent = 'Aplicar wst_upd_v1.8.1';
          } else if (fromPage === 'cctv') {
              actionButton.textContent = 'Aplicar ctv_upd_v0.2.0';
          } else {
              actionButton.textContent = 'Aplicar actualización genérica';
          }
        }
  
        const hosts = JSON.parse(sessionStorage.getItem('hostsElegidos'));
        let hostsPendientesFallidos = '';
        if (hostType === 'pendientes' || hostType === 'fallidos'){
          hostsPendientesFallidos = hosts
              .map(host => host.name) // Extrae solo los nombres
              .join(":");
  
          actualizarFilialConUpd(hostsPendientesFallidos,fromPage);
        }
  
        configuracionPaginacion(fromPage);
        const breadcrumb = document.querySelector('.breadcrumb');
        breadcrumb.innerHTML = `
            <a href="/MonitoringAppFront/">Home</a> / 
            <a href="${fromPage}.html">${fromPage.toUpperCase()}</a> / 
            <a href="filial.html?from=${fromPage}&estado=${hostType}&action=${action}">Hosts - ${hostType.toUpperCase()}</a>
            
        `;
  
        const headerText = document.querySelector('header h1');
        headerText.textContent = `Hosts - ${hostType.charAt(0).toUpperCase() + hostType.slice(1)}`;
    } else {
        console.error("No se ha especificado el tipo de hosts en la URL.");
    }
}


function configuracionPaginacion(fromPage){
    // Configuración de paginación
  const hostsPorPagina = 100; // Cambia esto si quieres mostrar más o menos hosts por página
  const hosts = JSON.parse(sessionStorage.getItem('hostsElegidos')); // Recuperamos los hosts de sessionStorage

  if (hosts) {
      const totalPaginas = Math.ceil(hosts.length / hostsPorPagina); // Calcula el número total de páginas

      // Función para mostrar los hosts de la página seleccionada
      function mostrarPagina(pagina) {
          if (pagina < 1 || pagina > totalPaginas) return; // Verifica si la página es válida

          // Calcula los hosts a mostrar para la página actual
          const inicio = (pagina - 1) * hostsPorPagina;
          const fin = inicio + hostsPorPagina;
          const hostsPagina = hosts.slice(inicio, fin);

          // Muestra los hosts de la página actual
          displayHostsPorEstados(hostsPagina,inicio,fromPage);

          // Actualiza la barra de navegación de páginas
          actualizarBarraDeNavegacion(pagina);
      }

      // Función para actualizar la barra de navegación de páginas
      function actualizarBarraDeNavegacion(paginaActual) {
          const barraNavegacion = document.querySelector('.barra-navegacion');
          barraNavegacion.innerHTML = ''; // Limpiar la barra de navegación

          // Agregar botones para cada página
          for (let i = 1; i <= totalPaginas; i++) {
              const boton = document.createElement('button');
              boton.textContent = i;
              boton.addEventListener('click', () => mostrarPagina(i));

              // Resalta el botón de la página actual
              if (i === paginaActual) {
                  boton.classList.add('pagina-actual');
              }

              barraNavegacion.appendChild(boton);
          }
      }

      // Mostrar la primera página por defecto
      mostrarPagina(1);
  } else {
      console.error('No se encontraron datos de hosts en sessionStorage');
  }
}

function displayHostsPorEstados(hosts, startIndex,fromPage) {
    const tableBody = document.querySelector('#workstationsTable tbody');
    tableBody.innerHTML = ''; 
    
    hosts.forEach((host, index) => {
        const globalIndex = startIndex + index + 1; // Calcula el índice global
        
        const rutaJobsAwx = `http://sawx0001lx.bancocredicoop.coop/#/inventories/inventory/22/hosts/edit/${host.id}/completed_jobs?`;
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
        
        const row = `
            <tr>
              <td>${globalIndex}</td>
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


//-----------------------------

function actualizarFilialConUpd(hostsPendientesFallidos,fromPage) {   // Host pendientes y fallidos
    const buttonContainer = document.querySelector(".button-container-upd");
    buttonContainer.style.display = "block"; // Cambia display a block para mostrar el div
    const actionButton = document.querySelector('#action-upd-filial');
    if (actionButton) {
        actionButton.addEventListener('click', () => {

            // Validación antes de mostrar el diálogo
            if (!hostsPendientesFallidos || hostsPendientesFallidos.trim() === '') {
                alert("El campo de hosts está vacío. Todo esta actualizado.");
                return;  // No se llama a mostrarDialogoConfirmacion si hostsPendientesFallidos está vacío
            }
            
            // Si hostsPendientesFallidos no está vacío, mostrar el diálogo de confirmación
            mostrarDialogoConfirmacion(hostsPendientesFallidos,fromPage);
        });
    } else {
        console.log("El botón actionUpdFilial no está presente en esta página, se omite el eventListener.");
    }
}

function mostrarDialogoConfirmacion(hostsPendientesFallidos,fromPage) {
    const dialog = document.querySelector('#custom-dialog');
    const confirmAccept = document.querySelector('#confirm-accept');
    const confirmCancel = document.querySelector('#confirm-cancel');

    dialog.classList.remove('hidden');

    const aceptar = () => {
        launchJobUpdFilial(hostsPendientesFallidos,fromPage);
        cerrarDialogo();
    };

    const cancelar = () => {
        console.log("El usuario canceló la operación.");
        cerrarDialogo();
    };

    confirmAccept.addEventListener('click', aceptar, { once: true });
    confirmCancel.addEventListener('click', cancelar, { once: true });

    function cerrarDialogo() {
        dialog.classList.add('hidden');
    }
}

async function launchJobUpdFilial(hostsPendientesFallidos,fromPage) {  // 'hostname' cambiado a 'filial'
    try {

      console.log("Iniciando ejecución del job para la filial:", hostsPendientesFallidos);

      let template_id = 0;
      if ( fromPage === 'wst'){
        template_id = 1678;
        console.log("fromPage recibido:", fromPage);
      } else if (fromPage === 'cctv'){
        template_id = 1613;
        console.log("fromPage recibido:", fromPage);
      }

      const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/awx/launch-job-filial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_template_id: template_id,
          hostsPendientesFallidos: hostsPendientesFallidos,  // Usamos 'filial' en lugar de 'hostname'
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
  
      if (response.ok) {
        alert(`Job lanzado correctamente para los hosts ${hostsPendientesFallidos}. ID del job: ${data.job_id}`);
      } else {
        alert(`Error al lanzar el job: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al lanzar el job:', error);
      alert('Error al lanzar el job.');
    }
}


window.buscar = buscar;
window.filtrando = filtrando;