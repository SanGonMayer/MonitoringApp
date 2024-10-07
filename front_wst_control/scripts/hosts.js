async function fetchHostsFromAPI(groupId, inventoryId) {
    const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts/`);
    return await response.json();
}

function clearTableBody() {
    const tableBody = document.querySelector('#workstationsTable tbody');
    tableBody.innerHTML = '';
}

function updateTableBody(hosts) {
    const tableBody = document.querySelector('#workstationsTable tbody');
    
    hosts.forEach(host => {
        const name = host.name || 'Nombre no identificado';
        const id = host.id || 'ID no identificado';
        const descripcion = host.description ? host.description.split(' ')[0] : 'Sin descripción';
        const filial = host.inventory || 'Desconocida';
        const status = host.status || 'No ejecutado';
        const enabled = host.enabled || 'Desconocido';
        const jobNames = host.jobNames.join(', ');

        const row = `
            <tr>
                <td>${name}</td>
                <td>${id}</td>
                <td>${descripcion}</td>
                <td>${filial}</td>
                <td>${status}</td>
                <td>${enabled}</td>
                <td>${jobNames}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function calculateStatus(hosts) {
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
    } else if (hayPendientes) {
        window.pendientes++;
    } else if (todasActualizadas) {
        window.actualizadas++;
    }

    // Calcular y actualizar los porcentajes
    updatePorcentajes();
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

function handleErrorHosts(error) {
    console.error('Error obteniendo los hosts:', error);
}

async function fetchHosts(groupId, inventoryId) {
    try {
        const filteredHosts = await fetchHostsFromAPI(groupId, inventoryId);
        
        clearTableBody(); // Limpiar la tabla antes de agregar nuevas filas
        updateTableBody(filteredHosts); // Actualizar la tabla con los hosts
        //calculateStatus(filteredHosts); // Evaluar los estados de los hosts

    } catch (error) {
        handleErrorHosts(error); // Maneja los errores
    }
}

// Exportar funciones globales
window.fetchHosts = fetchHosts;
window.fetchHostsFromAPI = fetchHostsFromAPI;
