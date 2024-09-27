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
      // Hacer una solicitud al backend para obtener los grupos
      const response = await fetch(`/api/awx/inventories/${inventoryId}/groups`);
      const groups = await response.json();

      // Obtener el contenedor donde se mostrarán los botones de filiales
      const groupsContainer = document.getElementById('filialContainer');
      groupsContainer.innerHTML = ''; // Limpiar los botones previos

      // Generar los botones de las filiales
      groups.forEach(group => {
          const button = document.createElement('button');
          button.textContent = `${group.name} - ${group.description}`;
          button.addEventListener('click', () => fetchHosts(inventoryId, group.id));
          groupsContainer.appendChild(button);
      });

      // Limpiar la tabla de hosts cuando se cambie de inventario
      const tableBody = document.querySelector('#workstationsTable tbody');
      tableBody.innerHTML = ''; // Limpiar el contenido previo de la tabla
  } catch (error) {
      console.error('Error obteniendo los grupos:', error);
  }
}

// Función para obtener los hosts de un grupo específico
async function fetchHosts(inventoryId, groupId) {
  try {
      // Hacer una solicitud al backend para obtener los hosts del grupo seleccionado
      const response = await fetch(`/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
      const hosts = await response.json();

      // Obtener el cuerpo de la tabla donde se mostrarán los hosts
      const tableBody = document.querySelector('#workstationsTable tbody');
      tableBody.innerHTML = ''; // Limpiar el contenido previo de la tabla

      // Añadir filas a la tabla con los datos de los hosts
      hosts.forEach(host => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${host.name}</td>
              <td>${host.id}</td>
              <td>${host.description || 'Sin descripción'}</td>
              <td>${inventoryId}</td>
              <td>${host.groups ? host.groups.join(', ') : 'Sin grupos'}</td>
          `;
          tableBody.appendChild(row);
      });
  } catch (error) {
      console.error('Error obteniendo los hosts:', error);
  }
}
