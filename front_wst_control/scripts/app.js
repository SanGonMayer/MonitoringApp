console.log('El script se está cargando correctamente');

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {


let allButtons = [];
let totalFiliales = 0;
let actualizadas = 0;
let pendientes = 0;
let fallidas = 0;

function buscar(tipoTerminal){

  if (tipoTerminal.includes('wst')) {
      inventoryId = 22;
  } else if (tipoTerminal.includes('cctv')) {
      inventoryId = 347;
  }

  // Llamar a fetchFiliales con el nuevo inventoryId
  fetchFiliales(inventoryId);
};

function inicializarEstados() {
  totalFiliales = 0;
  actualizadas = 0;
  pendientes = 0;
  fallidas = 0;
}

async function fetchGroupsFromAWX(inventoryId) {
  const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups`);
  return await response.json();
}

function clearFilialContainer() {
  const filialContainer = document.querySelector('#filialContainer');
  filialContainer.innerHTML = '';
  allButtons = [];
}

function createFilialButtons(groups, inventoryId) {
  const filialContainer = document.querySelector('#filialContainer');
  
  groups.forEach(group => {
      const button = document.createElement('button');
      button.textContent = group.name;
      button.classList.add('custom-button');
      button.onclick = () => fetchHosts(group.id, inventoryId); // Asigna el evento de clic para cada botón
      filialContainer.appendChild(button);
      allButtons.push(button);
  });
}

function handleErrorFiliales(error) {
  console.error('Error obteniendo las filiales:', error);
}

// Modificar fetchFiliales para aceptar inventoryId como argumento
async function fetchFiliales(inventoryId) {
  try {
      inicializarEstados(); // Inicializa las variables de estado
      console.log(`Llamando a la API para el inventoryId: ${inventoryId}`);
      
      // Obtener la lista de filiales (grupos)
      const groups = await fetchGroupsFromAWX(inventoryId);
      
      clearFilialContainer(); // Limpia el contenedor de filiales
      createFilialButtons(groups, inventoryId); // Crea los botones para cada filial

  } catch (error) {
      handleErrorFiliales(error); // Maneja los errores
  }
}

//const TEMPLATE_NAME = 'wst_upd_v1.7.19';

async function fetchHostsFromAPI(groupId, inventoryId) {
  const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
  return await response.json();
}

function clearTableBody() {
  const tableBody = document.querySelector('#workstationsTable tbody');
  tableBody.innerHTML = '';
}

function updateTableBody(hosts) {
  const tableBody = document.querySelector('#workstationsTable tbody');
  
  hosts.forEach(host => {
      const name = host.name || 'Nombre no identificado';
      const id = host.id || 'ID no identificado';
      const descripcion = host.description ? host.description.split(' ')[0] : 'Sin descripción';
      const filial = host.inventory || 'Desconocida';
      const status = host.status || 'No ejecutado';
      const jobNames = host.jobNames.join(', ');

      const row = `
          <tr>
              <td>${name}</td>
              <td>${id}</td>
              <td>${descripcion}</td>
              <td>${filial}</td>
              <td>${status}</td>
              <td>${jobNames}</td>
          </tr>
      `;
      tableBody.innerHTML += row;
  });
}

function calculateStatus(hosts) {
  let hayPendientes = false;
  let hayFallidas = false;
  let todasActualizadas = true;

  hosts.forEach(host => {
      const status = host.status || 'No ejecutado';

      if (status === 'No ejecutado') {
          hayPendientes = true;
          todasActualizadas = false;
      } else if (status === 'Fallido') {
          hayFallidas = true;
          todasActualizadas = false;
      } else if (status !== 'Actualizado') {
          todasActualizadas = false;
      }
  });

  totalFiliales++;
  if (hayFallidas) {
      fallidas++;
  } else if (hayPendientes) {
      pendientes++;
  } else if (todasActualizadas) {
      actualizadas++;
  }

  // Calcular y actualizar los porcentajes
  updatePorcentajes();
}

function updatePorcentajes() {
  if (totalFiliales === 0) return; // Evitar divisiones por cero

  const porcentajeActualizadas = Math.round((actualizadas / totalFiliales) * 100);
  const porcentajePendientes = Math.round((pendientes / totalFiliales) * 100);
  const porcentajeFallidas = Math.round((fallidas / totalFiliales) * 100);

  // Actualizar los elementos del DOM
  document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${porcentajeActualizadas}%`;
  document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${porcentajePendientes}%`;
  document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${porcentajeFallidas}%`;
}

function handleErrorHosts(error) {
  console.error('Error obteniendo los hosts:', error);
}

async function fetchHosts(groupId, inventoryId) {
  try {
      const hosts = await fetchHostsFromAPI(groupId, inventoryId);
      
      clearTableBody(); // Limpiar la tabla antes de agregar nuevas filas
      updateTableBody(hosts); // Actualizar la tabla con los hosts
      calculateStatus(hosts); // Evaluar los estados de los hosts

      console.log('Total Filiales:', totalFiliales);
      console.log('Filiales Actualizadas:', actualizadas);
      console.log('Filiales Pendientes:', pendientes);
      console.log('Filiales Fallidas:', fallidas);

  } catch (error) {
      handleErrorHosts(error); // Maneja los errores
  }
}


// Modificar fetchHosts para aceptar inventoryId como argumento

function filtrando() {
  const filial = document.getElementById('search').value;

  allButtons.forEach(button => {
      const buttonText = button.textContent.toLowerCase(); // Obtener el texto del botón
      if (buttonText.includes(filial)) {
          button.style.display = ''; // Mostrar el botón si coincide
      } else {
          button.style.display = 'none'; // Ocultar el botón si no coincide
      }
  });
}

window.buscar = buscar;
window.fetchFiliales = fetchFiliales;
window.fetchHosts = fetchHosts;
// Llamar a la función al cargar la página con el valor por defecto (22)
// window.onload = () => fetchFiliales(347);
});