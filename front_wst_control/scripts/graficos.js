function crearGraficoCircular(canvaId, redirectUrl) {
    const labels = ['Actualizadas', 'Desactualizadas', 'Fallidas'];
    const colors = ['rgb(26,194,23)', 'rgb(255,165,0)', 'rgb(255,0,0)'];
  
    const graph = document.querySelector(canvaId);
  
    /* const data = {
        labels: labels,
        datasets: [{
            data: [267, 19, 2],
            backgroundColor: colors
        }]
    }; */

    /* ------------------------------ */

    const actualizadasWst = window.actualizadas;
    const pendientesWst = window.pendientes;
    const fallidasWst = window.fallidas;

    let data;

    if (canvaId == 'cctv.html') {
        data = { // Asignar el valor a data
            labels: labels,
            datasets: [{
                data: [34, 2, 2],
                backgroundColor: colors
            }]
        };
    } else if (canvaId == 'wst.html') {
        data = { // Asignar el valor a data en el else
            labels: labels,
            datasets: [{
                data: [actualizadasWst, pendientesWst, fallidasWst],
                backgroundColor: colors
            }]
        };
    }

    /* ------------------------------ */
  
    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    enabled: true // Habilita las etiquetas emergentes
                }
            }
        }
    };
  
    // Crear el gráfico
    const chartInstance = new Chart(graph, config);
  
    // Manejar eventos de mouse para escalado
    graph.addEventListener('mousemove', (event) => {
        const chartArea = chartInstance.chartArea;
        const isInsideChart = (
            event.offsetX >= chartArea.left &&
            event.offsetX <= chartArea.right &&
            event.offsetY >= chartArea.top &&
            event.offsetY <= chartArea.bottom
        );
  
        if (isInsideChart) {
            graph.style.transition = 'transform 0.3s ease';
            graph.style.transform = 'scale(0.95)'; // Reduce el tamaño del gráfico
        } else {
            graph.style.transition = 'transform 0.3s ease';
            graph.style.transform = 'scale(1)'; // Volver al tamaño original
        }
    });
  
    graph.addEventListener('mouseleave', () => {
        graph.style.transition = 'transform 0.3s ease';
        graph.style.transform = 'scale(1)'; // Volver al tamaño original
    });
  
    graph.addEventListener('click', (event) => {
        // Redirigir a la URL pasada a la función
        const chartElement = chartInstance.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
        if (chartElement.length) {
            window.location.href = redirectUrl;
        }
    });
}

window.crearGraficoCircular = crearGraficoCircular;

