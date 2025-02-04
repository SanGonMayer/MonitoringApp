document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos el contenedor para "Máquinas Agregadas"
    const containerAgregados = document.querySelector('.estadistico--1');
    if (containerAgregados) {
      fetch('http://sncl1001lx.bancocredicoop.coop:3000api/hosts/agregados')
        .then(response => response.json())
        .then(data => {
          generateTable(data, containerAgregados);
        })
        .catch(error => console.error('Error al obtener los agregados:', error));
    }
  
    // Ya tienes la lógica para "deshabilitados" en la card de máquinas retiradas (estadistico--2)
    const containerDeshabilitados = document.querySelector('.estadistico--2');
    if (containerDeshabilitados) {
      fetch('http://sncl1001lx.bancocredicoop.coop:3000api/hosts/deshabilitados')
        .then(response => response.json())
        .then(data => {
          generateTable(data, containerDeshabilitados);
        })
        .catch(error => console.error('Error al obtener los deshabilitados:', error));
    }
  });
  
  /**
   * Función para generar una tabla a partir de los datos recibidos
   * @param {Array} data - Array de objetos con la información
   * @param {HTMLElement} container - Elemento del DOM donde se insertará la tabla
   */
  function generateTable(data, container) {
    // Crear la tabla y asignarle una clase para estilos
    const table = document.createElement('table');
    table.classList.add('data-table');
  
    // Encabezado de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha'];
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Cuerpo de la tabla
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
  
      // Columna para snapshot_date con fecha formateada
      const tdDate = document.createElement('td');
      const fecha = new Date(item.snapshot_date);
      tdDate.textContent = fecha.toLocaleString();
      row.appendChild(tdDate);
  
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
  
    // Agregamos la tabla al contenedor correspondiente
    container.appendChild(table);
  }
  