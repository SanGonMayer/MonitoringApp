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

async function fetchFiliales() {
    try {
        // Obtener la lista de filiales (grupos)
        const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/22/groups');
        const groups = await response.json();

        // Limpiar el contenedor de filiales (grupos)
        const filialContainer = document.querySelector('#filialContainer');
        filialContainer.innerHTML = '';

        // Crear un botón para cada filial
        groups.forEach(group => {
            const button = document.createElement('button');
            button.textContent = group.name;
            button.onclick = () => fetchHosts(group.id); // Al hacer clic, obtener los hosts
            filialContainer.appendChild(button);
        });

    } catch (error) {
        console.error('Error obteniendo las filiales:', error);
    }
}

async function fetchHosts(groupId) {
    try {
        // Obtener la lista de hosts para la filial seleccionada
        const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/22/groups/${groupId}/hosts`);
        const hosts = await response.json();

        const tableBody = document.querySelector('#workstationsTable tbody');

        // Limpiar el contenido anterior de la tabla
        tableBody.innerHTML = '';

        // Iterar sobre los hosts y agregarlos a la tabla
        hosts.forEach(host => {
            const row = `
                <tr>
                    <td>${host.name}</td>
                    <td>${host.id}</td>
                    <td>${host.description}</td>
                    <td>${host.inventory}</td>
                    <td>${host.groups}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error('Error obteniendo los hosts:', error);
    }
}

// Llamar a la función al cargar la página
window.onload = fetchFiliales;
