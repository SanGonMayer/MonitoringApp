document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos el contenedor de la card que corresponde a "Máquinas Retiradas"
    const containerDeshabilitados = document.querySelector('.estadistico--2');
  
    if (!containerDeshabilitados) {
      console.error("No se encontró el contenedor con la clase 'estadistico--2'");
      return;
    }
  
    // Realizamos el fetch al endpoint de deshabilitados
    fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/deshabilitados')
      .then(response => response.json())
      .then(data => {
        generateTable(data, containerDeshabilitados);
      })
      .catch(error => console.error('Error al obtener los deshabilitados:', error));
  });
  
  /**
   * Función para generar una tabla a partir de los datos recibidos
   * @param {Array} data - Array de objetos con la información de deshabilitados
   * @param {HTMLElement} container - Elemento del DOM donde se insertará la tabla
   */
  function generateTable(data, container) {
    // Creamos la tabla y le asignamos la clase para estilos
    const table = document.createElement('table');
    table.classList.add('data-table');
  
    // Creamos el encabezado de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    // Definimos las columnas que queremos mostrar
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha'];
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Creamos el cuerpo de la tabla
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
  
      // Columna para host_id
      const tdId = document.createElement('td');
      tdId.textContent = item.host_id;
      row.appendChild(tdId);
  
      // Columna para host_name
      const tdName = document.createElement('td');
      tdName.textContent = item.host_name;
      row.appendChild(tdName);
  
      // Columna para status
      const tdStatus = document.createElement('td');
      tdStatus.textContent = item.status;
      row.appendChild(tdStatus);
  
      // Columna para snapshot_date, formateando la fecha
      const tdDate = document.createElement('td');
      const fecha = new Date(item.snapshot_date);
      tdDate.textContent = fecha.toLocaleString();
      row.appendChild(tdDate);
  
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
  
    // Insertamos la tabla en el contenedor correspondiente
    container.appendChild(table);
  }
  