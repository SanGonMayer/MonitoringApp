function inicializarEstados() {
    window.totalFiliales = 0;
    window.actualizadas = 0;
    window.pendientes = 0;
    window.fallidas = 0;
}

async function fetchGroupsFromAWX(inventoryId) {
    const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups`);
    return await response.json();
}

function clearFilialContainer() {
    const filialContainer = document.querySelector('#filialContainer');
    filialContainer.innerHTML = '';
    window.allButtons = [];
}

async function evaluarEstadoHosts(groupId, inventoryId) {
    try {
        const hosts = await fetchHostsFromAPI(groupId, inventoryId);
        let hayPendientes = false;
        let hayFallidas = false;
        let todasActualizadas = true;

        hosts.forEach(host => {
            const status = host.status || 'No ejecutado';

            if (status === 'No ejecutado') {
                hayPendientes = true;
                todasActualizadas = false;
            } else if (status === 'Fallido') {
                hayFallidas = true;
                todasActualizadas = false;
            } else if (status !== 'Actualizado') {
                todasActualizadas = false;
            }
        });

        window.totalFiliales++;
        if (hayFallidas) {
            window.fallidas++;
            return 'red'; 
        } else if (hayPendientes) {
            window.pendientes++;
            return 'yellow'; 
        } else if (todasActualizadas) {
            window.actualizadas++;
            return 'green'; 
        }
    } catch (error) {
        console.error('Error evaluando los hosts:', error);
        return 'gray'; // En caso de error, devuelve un color por defecto
    }
}

function updatePorcentajes() {
    if (window.totalFiliales === 0) return; // Evitar divisiones por cero

    const porcentajeActualizadas = Math.round((window.actualizadas / window.totalFiliales) * 100);
    const porcentajePendientes = Math.round((window.pendientes / window.totalFiliales) * 100);
    const porcentajeFallidas = Math.round((window.fallidas / window.totalFiliales) * 100);

    // Actualizar los elementos del DOM
    document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${porcentajeActualizadas}%`;
    document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${porcentajePendientes}%`;
    document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${porcentajeFallidas}%`;
}


async function createFilialButtons(groups, inventoryId) {
    const filialContainer = document.querySelector('#filialContainer');
    inicializarEstados(); // Inicializa las variables de estado
    
    for (const group of groups) {
        const button = document.createElement('button');
        button.textContent = group.name;
        button.classList.add('custom-button');

        const color = await evaluarEstadoHosts(group.id, inventoryId);
        button.style.backgroundColor = color;

        button.onclick = () => fetchHosts(group.id, inventoryId); // Asigna el evento de clic para cada botón
        filialContainer.appendChild(button);
        window.allButtons.push(button);
    }

    updatePorcentajes(); // Actualiza los porcentajes en la interfaz
}

function handleErrorFiliales(error) {
    console.error('Error obteniendo las filiales:', error);
}

async function fetchFiliales(inventoryId) {
    try {
        inicializarEstados(); // Inicializa las variables de estado
        console.log(`Llamando a la API para el inventoryId: ${inventoryId}`);
        
        // Obtener la lista de filiales (grupos)
        const groups = await fetchGroupsFromAWX(inventoryId);
        
        clearFilialContainer(); // Limpia el contenedor de filiales
        createFilialButtons(groups, inventoryId); // Crea los botones para cada filial

        console.log('Total Filiales:', window.totalFiliales);
        console.log('Filiales Actualizadas:', window.actualizadas);
        console.log('Filiales Pendientes:', window.pendientes);
        console.log('Filiales Fallidas:', window.fallidas);

    } catch (error) {
        handleErrorFiliales(error); // Maneja los errores
    }
}

// Exportar funciones globales
window.fetchFiliales = fetchFiliales;
