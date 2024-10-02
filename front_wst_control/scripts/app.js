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
});



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
          button.style.flex = '0 1 calc(100% / 15 - 10px)'; 
          button.style.maxWidth = '60px'; 
          button.style.height = '60px'; 
          button.style.borderRadius = '50%';
          button.style.padding = '10px';
          button.style.overflow = 'hidden'; 
          button.style.textOverflow = 'ellipsis';
          button.style.whiteSpace = 'nowrap'; 
          button.style.display = 'flex'; 
          button.style.alignItems = 'center';
          button.style.justifyContent = 'center';
          button.style.fontSize = '10px'; 
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

      // Iterar sobre los hosts y agregar las filas a la tabla
      hosts.forEach(host => {
          const name = host.name || 'Nombre no identificado';
          const id = host.id || 'ID no identificado';
          const descripcion = host.description ? host.description.split(' ')[0] : 'Sin descripción';
          const filial = host.inventory || 'Desconocida';
          const status = host.status || 'No ejecutado';
          const jobNames = host.jobNames.join(', ');


          // Crear la fila para la tabla
          const row = `
              <tr>
                  <td>${name}</td>
                  <td>${id}</td>
                  <td>${descripcion}</td>
                  <td>${filial}</td>
                  <td>${status}</td> <!-- Mostrar el estado de la verificación -->
                  <td>${jobNames}</td> <!-- Mostrar los jobs -->
              </tr>
          `;
          tableBody.innerHTML += row;
      });
  } catch (error) {
      console.error('Error obteniendo los hosts:', error);
  }
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