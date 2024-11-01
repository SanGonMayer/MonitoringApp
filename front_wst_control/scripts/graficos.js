/* function crearGraficoCircular(canvaId, tipoTerminal) {
    const labels = ['Actualizadas', 'Desactualizadas', 'Fallidas'];
    const colors = ['rgb(26,194,23)', 'rgb(255,165,0)', 'rgb(255,0,0)'];
    const redirectUrl = tipoTerminal;
    
    const graph = document.querySelector(canvaId);
  
    const data = {
        labels: labels,
        datasets: [{
            data: [267, 19, 2],
            backgroundColor: colors
        }]
    };

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
} */

/* ----------------------------------------------------- */

async function crearGraficoCircular(canvaId, tipoTerminal) {
    const labels = ['Actualizadas', 'Desactualizadas', 'Fallidas'];
    const colors = ['rgb(26,194,23)', 'rgb(255,165,0)', 'rgb(255,0,0)'];
    const redirectUrl = tipoTerminal;

    let fGActualizadas, fGPendientes, fGFallidas;

    if (tipoTerminal === 'wst.html') {
        ({ fGActualizadas, fGPendientes, fGFallidas } = await fetchFilialesGraficoDB(tipoTerminal)); 
        console.log('Filiales actualizadas wst', fGActualizadas);
        console.log('Filiales pendientes wst', fGPendientes);
        console.log('Filiales fallidas wst', fGFallidas);

    } else {
        ({ 
            fGActualizadas, 
            fGPendientes, 
            fGFallidas 
        } = { 
            fGActualizadas: 34, 
            fGPendientes: 2, 
            fGFallidas: 2 
        });
        console.log('Filiales actualizadas cctv', fGActualizadas);
        console.log('Filiales pendientes cctv', fGPendientes);
        console.log('Filiales fallidas cctv', fGFallidas);
    }
    
    const graph = document.querySelector(canvaId);
  
    const data = {
        labels: labels,
        datasets: [{
            data: [fGActualizadas, fGPendientes, fGFallidas],
            backgroundColor: colors
        }]
    };

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

