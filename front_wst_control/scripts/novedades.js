document.addEventListener('DOMContentLoaded', () => {

    const containerAgregadas = document.querySelector('.estadistico--1');
    if (containerAgregadas) {
      Promise.all([
        // Endpoint para los registros diarios (por ejemplo, "agregados")
        fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/agregados')
          .then(response => response.json()),
        // Endpoint para el resumen (mensual y anual) de agregados
        fetch('http://sncl1001lx.bancocredicoop.coop:3000/api/hosts/resumen/agregados')
          .then(response => response.json())
      ])
      .then(([dailyData, resumenData]) => {
        // dailyData: Array con los registros diarios; usamos su longitud para "Hoy"
        const dailyCount = dailyData.length;
  
        // resumenData se asume que tiene la estructura: { monthly: [ { month, count }, ... ], annual: <number> }
        // Obtenemos el contador del mes actual:
        const currentMonth = new Date().toISOString().slice(0, 7); // formato "YYYY-MM"
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
  
        // Actualizar el DOM con los contadores
        updateAgregadosCounters(containerAgregadas, dailyCount, monthlyCount, annualCount);
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

/**
 * Crea e inyecta en el container un bloque de contadores con tres items:
 * "Hoy", "Mes" y "Anual (Marzo+)".
 * @param {HTMLElement} container - El contenedor (la card) donde se mostrará el bloque.
 * @param {number} dailyCount - Número de eventos diarios.
 * @param {number} monthlyCount - Número de eventos del mes actual.
 * @param {number} annualCount - Número total de eventos desde marzo.
 */
function updateAgregadosCounters(container, dailyCount, monthlyCount, annualCount) {
  // Eliminar un bloque existente (si existe) para evitar duplicados
  const existing = container.querySelector('.contador-container');
  if (existing) {
    existing.remove();
  }

  // Crear el contenedor principal para los contadores
  const counterContainer = document.createElement('div');
  counterContainer.classList.add('contador-container');

  // Función auxiliar para crear cada contador
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

  // Crear cada uno de los contadores
  const dailyCounter = createCounter("Hoy", dailyCount);
  const monthlyCounter = createCounter("Mes", monthlyCount);
  const annualCounter = createCounter("Anual (Marzo+)", annualCount);

  // Agregar los contadores al contenedor principal
  counterContainer.appendChild(dailyCounter);
  counterContainer.appendChild(monthlyCounter);
  counterContainer.appendChild(annualCounter);

  // Insertar el bloque de contadores justo después del título (h2) de la card
  const h2 = container.querySelector('h2');
  if (h2) {
    h2.insertAdjacentElement('afterend', counterContainer);
  } else {
    container.prepend(counterContainer);
  }
}
