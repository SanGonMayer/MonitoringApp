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
  