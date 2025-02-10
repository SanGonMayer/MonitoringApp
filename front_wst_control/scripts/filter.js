document.addEventListener('DOMContentLoaded', () => {
    console.log('El script de filtro se ha cargado correctamente.');
    
    // Referencia al formulario y al contenedor de la tabla
    const filterForm = document.getElementById('filterForm');
    const tableContainer = document.getElementById('filteredTableContainer');
    
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Evita la recarga de la página
      console.log('Evento submit capturado.');
      
      // Recoger los valores de los nuevos campos del formulario
      const hostId = document.getElementById('filterHostID').value.trim();
      const hostName = document.getElementById('filterHostName').value.trim();
      const motivo = document.getElementById('filterMotivo').value;
      const startDate = document.getElementById('filterStartDate').value;
      const endDate = document.getElementById('filterEndDate').value;
      
      console.log('Valores del formulario:', { hostId, hostName, motivo, startDate, endDate });
      
      // Construir la query string con URLSearchParams
      const params = new URLSearchParams();
      if (hostId) params.append('host_id', hostId);
      if (hostName) params.append('host_name', hostName);
      if (motivo) params.append('motivo', motivo);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      console.log('Parámetros de consulta:', params.toString());
      
      // Realizar la petición al endpoint de filtrado
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/filter?' + params.toString())
        .then(response => {
          console.log('Respuesta recibida del servidor');
          return response.json();
        })
        .then(data => {
          console.log('Datos recibidos:', data);
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
    
    // Crear la tabla y asignarle la clase para estilos
    const table = document.createElement('table');
    table.classList.add('data-table-filtro-busqueda');
    
    // Crear el encabezado de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    // Definir los encabezados; aquí mostramos ID, Nombre, Estado, Fecha y Motivo
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha', 'Motivo'];
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Crear el cuerpo de la tabla
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      // Convertir la fecha a un formato legible
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
    
    // Insertar la tabla en el contenedor
    container.appendChild(table);
  }
  