/* ----------------------------------------------------- */

/* async function crearGraficoCircular(canvaId, tipoTerminal) {
    const labels = ['Actualizadas', 'Desactualizadas', 'Fallidas'];
    const colors = ['rgb(26,194,23)', 'rgb(255,165,0)', 'rgb(255,0,0)'];
    const redirectUrl = tipoTerminal;

    const { filialesActualizadas, filialesPendientes, filialesFallidas } = await fetchFilialesGraficoDB(tipoTerminal);
    
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
} */

async function crearGraficoCircular(canvaId, tipoTerminal) {
    const labels = ['Actualizadas', 'Pendientes', 'Fallidas'];
    const colors = ['rgb(26,194,23)', 'rgb(255,165,0)', 'rgb(255,0,0)'];
    const redirectUrl = tipoTerminal;

    const { filialesActualizadas, filialesPendientes, filialesFallidas } = await fetchFilialesGraficoDB(tipoTerminal);
    const total = filialesActualizadas + filialesPendientes + filialesFallidas;

    // Solo aumentar visualmente los valores pequeños si no son 0
    let adjustedPendientes = filialesPendientes > 0 && filialesPendientes < total * 0.2 ? total * 0.2 : filialesPendientes;
    let adjustedFallidas = filialesFallidas > 0 && filialesFallidas < total * 0.2 ? total * 0.2 : filialesFallidas;
    let adjustedActualizadas = filialesActualizadas > 0 && filialesActualizadas < total * 0.2 ? total * 0.2 : filialesActualizadas;

    const data = {
        labels: labels,
        datasets: [{
            data: [adjustedActualizadas, adjustedPendientes, adjustedFallidas],  // Usamos los valores ajustados para mostrar en el gráfico
            backgroundColor: colors
        }]
    };

    const graph = document.querySelector(canvaId);
    
    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            // Obtenemos el valor real en lugar del valor ajustado
                            let realValue;
                            if (label === 'Actualizadas') {
                                realValue = filialesActualizadas;
                            } else if (label === 'Pendientes') {
                                realValue = filialesPendientes;
                            } else if (label === 'Fallidas') {
                                realValue = filialesFallidas;
                            }

                            const percentage = ((realValue / total) * 100).toFixed(2);
                            return `${label}: ${realValue}`;  // Mostrar valor real y su porcentaje
                        }
                    }
                },
                datalabels: {
                    display: true,
                    color: '#fff',
                    formatter: (value, context) => {
                        const percentage = ((value / total) * 100).toFixed(2);
                        return `${percentage}%`;
                    }
                }
            }
        }
    };
    
    const chartInstance = new Chart(graph, config);

    // Escalado al pasar el ratón
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
            graph.style.transform = 'scale(0.95)';
        } else {
            graph.style.transition = 'transform 0.3s ease';
            graph.style.transform = 'scale(1)';
        }
    });

    graph.addEventListener('mouseleave', () => {
        graph.style.transition = 'transform 0.3s ease';
        graph.style.transform = 'scale(1)';
    });
    
    // Redirección al hacer clic
    graph.addEventListener('click', (event) => {
        const chartElement = chartInstance.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
        if (chartElement.length) {
            window.location.href = redirectUrl;
        }
    });
}

window.crearGraficoCircular = crearGraficoCircular;

