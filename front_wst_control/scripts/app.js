// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Configuración de datos para el gráfico
  const data = {
    labels: ['Bien', 'Pendientes', 'Error'], // Etiquetas para cada barra
    datasets: [{
      label: 'Cantidad de Filiales',
      data: [12, 5, 3], // Reemplaza estos valores con tus datos reales
      backgroundColor: [
        '#28a745', // Color para "Bien"
        '#ffc107', // Color para "Pendientes"
        '#dc3545'  // Color para "Error"
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Configuración del gráfico
  const config = {
    type: 'bar', // Tipo de gráfico
    data: data,
    options: {
      scales: {
          x: {
              grid: {
                display: false // Ocultar las líneas de la cuadrícula del eje x
              }
            },
        y: {
          beginAtZero: true // Comienza el eje y en 0
        }
      }
    }
  };

  // Crear el gráfico
  const myChart = new Chart(
    document.getElementById('myChart'),
    config
  );




/* function buscar(){

  const tipoTerminal = document.getElementById('search').value;
  let inventoryId = 347
  if (tipoTerminal.includes('wst')) {
      inventoryId = 22;
  } else if (tipoTerminal.includes('cctv')) {
      inventoryId = 347;
  }

  // Llamar a fetchFiliales con el nuevo inventoryId
  fetchFiliales(inventoryId);
} */

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
}

// Modificar fetchFiliales para aceptar inventoryId como argumento
async function fetchFiliales(inventoryId) {
  try {

      totalFiliales = 0;
      actualizadas = 0;
      pendientes = 0;
      fallidas = 0;

      console.log(`Llamando a la API para el inventoryId: ${inventoryId}`);
      // Obtener la lista de filiales (grupos)
      const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups`);
      const groups = await response.json();

      // Limpiar el contenedor de filiales (grupos)
      const filialContainer = document.querySelector('#filialContainer');
      filialContainer.innerHTML = '';
      allButtons = [];

      // Crear un botón para cada filial
      groups.forEach(group => {
          const button = document.createElement('button');
          button.textContent = group.name;
          button.classList.add('custom-button'); 
          button.onclick = () => fetchHosts(group.id, inventoryId); // Al hacer clic, obtener los hosts
          filialContainer.appendChild(button);
          allButtons.push(button);
      });

  } catch (error) {
      console.error('Error obteniendo las filiales:', error);
  }
}

//const TEMPLATE_NAME = 'wst_upd_v1.7.19';


// Modificar fetchHosts para aceptar inventoryId como argumento
async function fetchHosts(groupId, inventoryId) {
  try {
      // Obtener la lista de hosts para la filial seleccionada
      const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
      const hosts = await response.json();

      const tableBody = document.querySelector('#workstationsTable tbody');

      // Limpiar el contenido anterior de la tabla
      tableBody.innerHTML = '';

      let hayPendientes = false;
      let hayFallidas = false;
      let todasActualizadas = true;

      // Iterar sobre los hosts y agregar las filas a la tabla
      hosts.forEach(host => {
          const name = host.name || 'Nombre no identificado';
          const id = host.id || 'ID no identificado';
          const descripcion = host.description ? host.description.split(' ')[0] : 'Sin descripción';
          const filial = host.inventory || 'Desconocida';
          const status = host.status || 'No ejecutado';
          const jobNames = host.jobNames.join(', ');

        if (status === 'No ejecutado') {
            hayPendientes = true;
            todasActualizadas = false;
        } else if (status === 'Fallido') {
            hayFallidas = true;
            todasActualizadas = false;
        } else if (status !== 'Actualizado') {
            todasActualizadas = false;
        }


          // Crear la fila para la tabla
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

      totalFiliales++;
      if (hayFallidas) {
          fallidas++;
      } else if (hayPendientes) {
          pendientes++;
      } else if (todasActualizadas) {
          actualizadas++;
      }

      // Calcular y actualizar los porcentajes
      actualizarPorcentajes();

  } catch (error) {
      console.error('Error obteniendo los hosts:', error);
  }
  console.log('Total Filiales:', totalFiliales);
  console.log('Filiales Actualizadas:', actualizadas);
  console.log('Filiales Pendientes:', pendientes);
  console.log('Filiales Fallidas:', fallidas);

}

function actualizarPorcentajes() {
  if (totalFiliales === 0) return; // Evitar divisiones por cero

  const porcentajeActualizadas = Math.round((actualizadas / totalFiliales) * 100);
  const porcentajePendientes = Math.round((pendientes / totalFiliales) * 100);
  const porcentajeFallidas = Math.round((fallidas / totalFiliales) * 100);

  // Verificar que los porcentajes estén siendo calculados
  console.log('Porcentaje Actualizadas:', porcentajeActualizadas);
  console.log('Porcentaje Pendientes:', porcentajePendientes);
  console.log('Porcentaje Fallidas:', porcentajeFallidas);

  // Actualizar los elementos del DOM
  document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${porcentajeActualizadas}%`;
  document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${porcentajePendientes}%`;
  document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${porcentajeFallidas}%`;

  // Verificar que los elementos DOM se están encontrando
  console.log('Actualizado el DOM con los porcentajes');
}

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
// Llamar a la función al cargar la página con el valor por defecto (22)
// window.onload = () => fetchFiliales(347);
});