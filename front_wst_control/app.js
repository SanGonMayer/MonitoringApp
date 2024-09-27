// app.js

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

// Manejador de eventos para obtener grupos de CCTV (Inventario 347)
document.getElementById('cctvButton').addEventListener('click', async () => {
  await fetchGroups(347);
});

// Manejador de eventos para obtener grupos de WST (Inventario 22)
document.getElementById('wstButton').addEventListener('click', async () => {
  await fetchGroups(22);
});

// Función para obtener los grupos (filiales) según el inventario
async function fetchGroups(inventoryId) {
  try {
      const response = await fetch(`/api/awx/inventories/${inventoryId}/groups`);
      const groups = await response.json();

      // Mostrar las filiales en el contenedor
      const groupsContainer = document.getElementById('groupsContainer');
      groupsContainer.innerHTML = ''; // Limpiar contenido previo
      groups.forEach(group => {
          const groupElement = document.createElement('div');
          groupElement.innerHTML = `
              <button onclick="fetchHosts(${inventoryId}, ${group.id})">
                  ${group.name} - ${group.description}
              </button>
          `;
          groupsContainer.appendChild(groupElement);
      });
  } catch (error) {
      console.error('Error obteniendo los grupos:', error);
  }
}

// Función para obtener los hosts de un grupo específico
async function fetchHosts(inventoryId, groupId) {
  try {
      const response = await fetch(`/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
      const hosts = await response.json();

      // Mostrar los hosts en el contenedor
      const hostsContainer = document.getElementById('hostsContainer');
      hostsContainer.innerHTML = ''; // Limpiar contenido previo
      hosts.forEach(host => {
          const hostElement = document.createElement('div');
          hostElement.textContent = `Host: ${host.name}`;
          hostsContainer.appendChild(hostElement);
      });
  } catch (error) {
      console.error('Error obteniendo los hosts:', error);
  }
}

// Llamar a la función al cargar la página
window.onload = fetchFiliales;
