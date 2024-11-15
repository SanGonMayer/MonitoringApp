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

  //filtrarFilialesPorCards();
  
  // -------------------- AL MOMENTO DE PRESIONAR EL BOTON "RECARGAR FILIALES"

  recargarFilialesHtml();

  // ------------------------ AL MOMENTO DE CLICKEAR EN ALGUNA FILIAL (EL EVENTO CLICK ESTA EN "FILIALES FROM DB")

  mostrarHostsDefilialHtml(); 

  //----------------------- PRUEBAS PARA LA PAGINACION AL MOMENTO FILTRAR ESTADOS DE HOSTS POR CARD
  //nuevoFiltroDeCards();
  //configuracionPaginacion();
  //actualizarRecuperarHosts();

  
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
  const circles = document.querySelectorAll('.circle');
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

  if (filialName) {
      console.log('Ahora ya se encontro una filialName, porque se clickeo en un boton filial')
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
          displayHosts(hosts);
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
              let tipo = '';

              // Selecciona la lista de hosts y el tipo según el color del círculo
              switch (color) {
                  case 'rgb(40, 167, 69)': // Verde
                      hosts = window.hostsActualizados;
                      tipo = 'actualizados';
                      break;
                  case 'rgb(255, 193, 7)': // Amarillo
                      hosts = window.hostsPendientes;
                      tipo = 'pendientes';
                      break;
                  case 'rgb(220, 53, 69)': // Rojo
                      hosts = window.hostsFallidos;
                      tipo = 'fallidos';
                      break;
                  default:
                      console.warn('Color de círculo desconocido:', color);
                      return; // No hace nada si el color es desconocido
              }

              // Almacena los hosts seleccionados en sessionStorage y abre la nueva página
              sessionStorage.setItem('HostsElegidos', JSON.stringify(hosts));
              console.log("Hosts guardados en sessionStorage:", hosts);

              
              window.open(`filial.html?name=${filialName}&from=${tipo}`, '_blank');
          });
      });
  } else {
      console.log("No se encontraron elementos con la clase 'circle' en esta página.");
  }
}


function configuracionPaginacion(){
    // Configuración de paginación
  const hostsPorPagina = 100; // Cambia esto si quieres mostrar más o menos hosts por página
  const hosts = JSON.parse(sessionStorage.getItem('HostsElegidos')); // Recuperamos los hosts de sessionStorage

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
          displayHosts(hostsPagina);

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

function actualizarRecuperarHosts(){
  // Recuperar el tipo de hosts desde la URL y actualizar la interfaz
  const urlParams = new URLSearchParams(window.location.search);
  const hostType = urlParams.get('from');

  if (hostType) {
      const breadcrumb = document.querySelector('.breadcrumb');
      breadcrumb.innerHTML = `
          <a href="/MonitoringAppFront/">Home</a> / 
          <a href="${hostType}.html">${hostType.toUpperCase()}</a> / 
          <span>Hosts - ${hostType.toUpperCase()}</span>
      `;

      const headerText = document.querySelector('header h1');
      headerText.textContent = `Hosts - ${hostType.charAt(0).toUpperCase() + hostType.slice(1)}`;
  } else {
      console.error("No se ha especificado el tipo de hosts en la URL.");
  }
}

window.buscar = buscar;
window.filtrando = filtrando;