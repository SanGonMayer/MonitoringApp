document.addEventListener('DOMContentLoaded', () => {
    const downloadButton = document.getElementById('report-csv-button');
    if (downloadButton) {
      downloadButton.addEventListener('click', () => {
        window.location.href = '/download-latest-csv';
      });
    }
  });