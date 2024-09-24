// app.js

// Espera a que el DOM esté completamente cargado
/* document.addEventListener('DOMContentLoaded', () => {
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
}); */


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
          button.onclick = () => fetchHosts(group.id, inventoryId); // Al hacer clic, obtener los hosts
          filialContainer.appendChild(button);
          allButtons.push(button);
      });

  } catch (error) {
      console.error('Error obteniendo las filiales:', error);
  }
}

// Modificar fetchHosts para aceptar inventoryId como argumento
async function fetchHosts(groupId, inventoryId) {
  try {
      // Obtener la lista de hosts para la filial seleccionada
      const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
      const hosts = await response.json();

      const tableBody = document.querySelector('#workstationsTable tbody');

      // Limpiar el contenido anterior de la tabla
      tableBody.innerHTML = '';

      // Iterar sobre los hosts y agregarlos a la tabla
      hosts.forEach(host => {
          const descripcion = host.description.split(' ');
          const hostname = descripcion[0];
          const filial = host.summary_fields.groups.results[0].name;

          console.log(host);

          const row = `
              <tr>
                  <td>${host.name}</td>
                  <td>${host.id}</td>
                  <td>${hostname}</td>
                  <td>${filial}</td>
                  <td>${host.inventory}</td>
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