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

  async function fetchWorkstations() {
    try {
      //  apuntar al backend con la ruta correcta
      const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000//api/awx/inventories/22/groups');
      const data = await response.json();  // Transformar la respuesta en JSON

      console.log(data) //muestro lo que recibe

      const tableBody = document.querySelector('#workstationsTable tbody');

      // Limpiar el contenido anterior de la tabla (por si se actualiza)
      tableBody.innerHTML = '';

      // Iterar sobre los datos y agregarlos a la tabla
      data.forEach(host => {
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
      console.error('Error obteniendo las workstations:', error);
    }
}

// Llamar a la función al cargar la página
window.onload = fetchWorkstations;
