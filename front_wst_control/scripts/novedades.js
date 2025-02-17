document.addEventListener('DOMContentLoaded', () => {

    const containerAgregadas = document.querySelector('.estadistico--1');
    if (containerAgregadas) {
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/agregados')
        .then(response => response.json())
        .then(data => {
          updateCounter(containerAgregadas, data.length);
          // Configuración para agregadas: mostrar host_id, host_name y status
          const configAgregadas = {
            headers: ['ID', 'Nombre', 'Estado', 'Filial'],
            rowMapper: item => [item.host_id, item.host_name, 
              item.workstation && item.workstation.status 
              ? item.workstation.status 
              : (item.cctv && item.cctv.status ? item.cctv.status : item.status), 
              item.filial && item.filial.name ? item.filial.name : 'N/D']
          };
          generateCustomTable(data, containerAgregadas, configAgregadas);
        })
        .catch(error => console.error('Error al obtener los agregados:', error));
    }
  

    const containerDeshabilitadas = document.querySelector('.estadistico--2');
    if (containerDeshabilitadas) {
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/deshabilitados')
        .then(response => response.json())
        .then(data => {
          updateCounter(containerDeshabilitadas, data.length);
          // Configuración para deshabilitadas: mostrar host_id, host_name y filial
          const configDeshabilitadas = {
            headers: ['ID', 'Nombre', 'Filial'],
            rowMapper: item => [item.host_id, item.host_name, item.filial && item.filial.name ? item.filial.name : 'N/D']
          };
          generateCustomTable(data, containerDeshabilitadas, configDeshabilitadas);
        })
        .catch(error => console.error('Error al obtener los deshabilitados:', error));
    }

    const containerReemplazadas = document.querySelector('.estadistico--3');
    if (containerReemplazadas) {
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/reemplazos')
        .then(response => response.json())
        .then(data => {
          updateCounter(containerReemplazadas, data.length);
          // Configuración para reemplazadas: mostrar host_id, host_name y filial
          const configReemplazadas = {
            headers: ['ID', 'Nombre', 'Estado', 'Filial'],
            rowMapper: item => [item.host_id, item.host_name, item.workstation.status, item.filial && item.filial.name ? item.filial.name : 'N/D']
          };
          generateCustomTable(data, containerReemplazadas, configReemplazadas);
        })
        .catch(error => console.error('Error al obtener los reemplazados:', error));
      }
  });
  
/**
 * Función genérica para generar una tabla a partir de datos y una configuración.
 * @param {Array} data - Array de objetos con la información.
 * @param {HTMLElement} container - Elemento del DOM donde se insertará la tabla.
 * @param {Object} config - Configuración de la tabla.
 *    config.headers: Array de encabezados a mostrar.
 *    config.rowMapper: Función que transforma un objeto de datos en un array de valores.
 */
function generateCustomTable(data, container, config) {
    // Crear la tabla y asignarle una clase para estilos.
    const table = document.createElement('table');
    table.classList.add('data-table');
  
    // Crear el encabezado de la tabla.
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    config.headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Crear el cuerpo de la tabla.
    const tbody = document.createElement('tbody');
    data.forEach(item => {
      const row = document.createElement('tr');
      const cellValues = config.rowMapper(item);
      cellValues.forEach(value => {
        const td = document.createElement('td');
        td.textContent = value;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);


    // Crear un contenedor para la tabla y aplicar el scroll
    const tableContainer = document.createElement('div');
    tableContainer.classList.add('table-container-estadisticos');
    tableContainer.appendChild(table);
  
    // Insertar la tabla en el contenedor.
    container.appendChild(table);
  }
  

  function updateCounter(container, count) {
    const counterElement = document.createElement('div');
    counterElement.classList.add('contador-hoy');
    
    // Crear elementos separados para "Hoy:" y el número
    const textElement = document.createElement('div');
    textElement.textContent = "Hoy:";
    
    const numberElement = document.createElement('div');
    numberElement.classList.add('contador-numero');
    numberElement.textContent = count;

    counterElement.appendChild(textElement);
    counterElement.appendChild(numberElement);
    
    const title = container.querySelector('h2');
    if (title) {
      title.insertAdjacentElement('afterend', counterElement);
    } else {
      container.insertAdjacentElement('afterbegin', counterElement);
    }
}