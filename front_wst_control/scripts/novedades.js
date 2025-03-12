document.addEventListener('DOMContentLoaded', () => {

  const containerAgregadas = document.querySelector('.estadistico--1');
  if (containerAgregadas) {
    Promise.all([
      // Obtener datos diarios de agregados
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/agregados')
        .then(response => response.json()),
      // Obtener el resumen mensual y anual de agregados
      fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/resumen/agregados')
        .then(response => response.json())
    ])
    .then(([dailyData, resumenData]) => {
      const dailyCount = dailyData.length;

      // Suponemos que resumenData tiene: { monthly: [ { month, count } ], annual: <number> }
      const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      let monthlyCount = 0;
      if (resumenData.monthly && Array.isArray(resumenData.monthly)) {
        resumenData.monthly.forEach(item => {
          const itemMonth = new Date(item.month).toISOString().slice(0, 7);
          if (itemMonth === currentMonth) {
            monthlyCount = parseInt(item.count);
          }
        });
      }
      const annualCount = resumenData.annual || 0;

      // Actualizar el bloque de contadores usando nuestro contenedor dedicado
      updateAgregadosCounters(dailyCount, monthlyCount, annualCount);
    })
    .catch(error => console.error('Error al actualizar contadores agregados:', error));
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
            headers: ['ID', 'Nombre', 'Filial'],
            rowMapper: item => [item.host_id, item.host_name, item.filial && item.filial.name ? item.filial.name : 'N/D']
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

function updateAgregadosCounters(dailyCount, monthlyCount, annualCount) {
  const counterWrapper = document.getElementById('contador-agregados');
  if (!counterWrapper) return; // Si no existe, no hacer nada

  // Limpiar contenido previo
  counterWrapper.innerHTML = '';

  const counterContainer = document.createElement('div');
  counterContainer.classList.add('contador-container');

  function createCounter(labelText, count) {
    const item = document.createElement('div');
    item.classList.add('contador-item');
    const label = document.createElement('div');
    label.classList.add('contador-label');
    label.textContent = labelText;
    const number = document.createElement('div');
    number.classList.add('contador-numero');
    number.textContent = count;
    item.appendChild(label);
    item.appendChild(number);
    return item;
  }

  const dailyCounter = createCounter("Hoy", dailyCount);
  const monthlyCounter = createCounter("Mes", monthlyCount);
  const annualCounter = createCounter("Anual (Marzo+)", annualCount);

  counterContainer.appendChild(dailyCounter);
  counterContainer.appendChild(monthlyCounter);
  counterContainer.appendChild(annualCounter);

  counterWrapper.appendChild(counterContainer);
}
