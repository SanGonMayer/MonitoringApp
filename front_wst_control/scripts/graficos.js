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

    let filialesActualizadas, filialesPendientes, filialesFallidas;

    if (tipoTerminal === 'wst.html') {
        ({ filialesActualizadas, filialesPendientes, filialesFallidas } = await fetchFilialesGraficoDB(tipoTerminal)); 
        console.log('Filiales actualizadas wst', filialesActualizadas);
        console.log('Filiales actualizadas wst', filialesPendientes);
        console.log('Filiales actualizadas wst', filialesFallidas);

    } else {
        ({ 
            filialesActualizadas, 
            filialesPendientes, 
            filialesFallidas 
        } = { 
            filialesActualizadas: 10, 
            filialesPendientes: 34, 
            filialesFallidas: 2 
        });
        console.log('Filiales actualizadas wst', filialesActualizadas);
        console.log('Filiales actualizadas wst', filialesPendientes);
        console.log('Filiales actualizadas wst', filialesFallidas);
    }
    
    const graph = document.querySelector(canvaId);
  
    const data = {
        labels: labels,
        datasets: [{
            data: [filialesActualizadas, filialesPendientes, filialesFallidas],
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

