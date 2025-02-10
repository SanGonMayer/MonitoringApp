document.addEventListener('DOMContentLoaded', () => {
    console.log('El script de filtro se ha cargado correctamente.');
    const filterForm = document.getElementById('filterForm');
    const filterInput = document.getElementById('filterInput');
    const tableContainer = document.getElementById('filteredTableContainer');
  
    filterForm.addEventListener('submit', function(e) {
        console.log('Evento submit capturado.');
        e.preventDefault();  // Esto evita que la página se recargue
        const hostName = document.getElementById('filterInput').value.trim();
        console.log('Valor del input:', hostName);
      
        const params = new URLSearchParams();
        if (hostName) params.append('hostName', hostName);
        console.log('Parámetros de consulta:', params.toString());
      
        fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/filter?' + params.toString())
          .then(response => {
            console.log('Respuesta recibida del servidor');
            return response.json();
          })
          .then(data => {
            console.log('Datos recibidos:', data);
            renderFilteredTable(data, document.getElementById('filteredTableContainer'));
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
      const cellValues = [item.host_id, item.host_name, item.status, fecha, item.motivo];
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
  