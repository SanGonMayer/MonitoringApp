document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('filterForm');
    const filterInput = document.getElementById('filterInput');
    const tableContainer = document.getElementById('filteredTableContainer');
  
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();  // Prevenir recarga de página
      const hostName = filterInput.value.trim();
      // Construir los parámetros de consulta
      const params = new URLSearchParams();
      if (hostName) params.append('hostName', hostName);
      console.log('Filtro iniciado');
  
      // Realizar la petición al endpoint de filtrado
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/filter?' + params.toString())
        .then(response => response.json())
        .then(data => {
          renderFilteredTable(data, tableContainer);
        })
        .catch(error => console.error('Error al filtrar:', error));
    });
  });
  
  /**
   * Función para renderizar la tabla filtrada.
   * @param {Array} data - Array de registros devueltos por el endpoint.
   * @param {HTMLElement} container - Elemento donde se insertará la tabla.
   */
  function renderFilteredTable(data, container) {
    // Limpiar contenido anterior
    container.innerHTML = '';
  
    // Crear la tabla
    const table = document.createElement('table');
    table.classList.add('data-table');
  
    // Crear encabezado de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    // Definimos los encabezados; puedes ajustar según lo que necesites
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha'];
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Crear cuerpo de la tabla
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      // Mapear los valores a las columnas
      const fecha = new Date(item.snapshot_date).toLocaleString();
      const cellValues = [item.host_id, item.host_name, item.status, fecha];
      cellValues.forEach(val => {
        const td = document.createElement('td');
        td.textContent = val;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
  
    container.appendChild(table);
  }
  