async function fetchMonthlySummaries() {
    // Realizamos las tres peticiones en paralelo
    const [agregadasData, retiradasData, reemplazosData] = await Promise.all([
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/resumen/agregados')
        .then(response => response.json()),
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/resumen/retirados')
        .then(response => response.json()),
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/resumen/reemplazos/novedad')
        .then(response => response.json())
    ]);
  
    // Cada uno se asume que devuelve un objeto con la propiedad "monthly": un array de { month, count }
    const agregadasMonthly = agregadasData.monthly || [];
    const retiradasMonthly = retiradasData.monthly || [];
    const reemplazosMonthly = reemplazosData.monthly || [];
  
    // Obtener la unión de todos los meses (formato "YYYY-MM")
    const allMonthsSet = new Set();
    [agregadasMonthly, retiradasMonthly, reemplazosMonthly].forEach(dataset => {
      dataset.forEach(item => {
        const monthStr = new Date(item.month).toISOString().slice(0, 7);
        allMonthsSet.add(monthStr);
      });
    });
    const allMonths = Array.from(allMonthsSet).sort();
  
    // Para cada mes, obtener el count o 0 si no existe
    const agregadasCounts = allMonths.map(month => {
      const item = agregadasMonthly.find(x => new Date(x.month).toISOString().slice(0,7) === month);
      return item ? parseInt(item.count) : 0;
    });
    const retiradasCounts = allMonths.map(month => {
      const item = retiradasMonthly.find(x => new Date(x.month).toISOString().slice(0,7) === month);
      return item ? parseInt(item.count) : 0;
    });
    const reemplazosCounts = allMonths.map(month => {
      const item = reemplazosMonthly.find(x => new Date(x.month).toISOString().slice(0,7) === month);
      return item ? parseInt(item.count) : 0;
    });
  
    return { months: allMonths, agregadas: agregadasCounts, retiradas: retiradasCounts, reemplazos: reemplazosCounts };
  }
  
  function createBarChart({ months, agregadas, retiradas, reemplazos }) {
    const ctx = document.getElementById('chartSummary').getContext('2d');
    
    // Destruir gráfico previo si existe (para evitar duplicados)
    if (window.myBarChart) {
      window.myBarChart.destroy();
    }
  
    window.myBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Agregadas',
            data: agregadas,
            backgroundColor: 'rgba(81, 81, 250, 0.7)'
          },
          {
            label: 'Retiradas',
            data: retiradas,
            backgroundColor: 'rgba(252, 161, 71, 0.7)'
          },
          /*{
            label: 'Reemplazadas',
            data: reemplazos,
            backgroundColor: 'rgba(220, 91, 183, 0.7)'
          }*/
        ]
      },
      options: {
        /*maintainAspectRatio: false,*/
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Mes'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Resumen Mensual de Máquinas'
          }
        }
      }
    });
  }
  
  async function fetchMonthlySummariesAndDrawChart() {
    try {
      const data = await fetchMonthlySummaries();
      createBarChart(data);
    } catch (error) {
      console.error('Error al generar el gráfico de barras:', error);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    fetchMonthlySummariesAndDrawChart();
  });