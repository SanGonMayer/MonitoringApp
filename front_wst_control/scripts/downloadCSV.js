document.addEventListener('DOMContentLoaded', () => {
    const downloadButton = document.getElementById('report-csv-button');
    if (downloadButton) {
      downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = 'http://sncl7001lx.bancocredicoop.coop:3000/download-latest-csv';
        link.download = 'Reporte_Desactualizados.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  });