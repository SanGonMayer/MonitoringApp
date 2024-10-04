async function fetchHostsFromAPI(groupId, inventoryId) {
    const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
    const hosts = await response.json();

    console.log(`Hosts recibidos para el grupo ${groupId}:`, hosts);

    const filteredHosts = hosts.filter(host => {
        console.log(`Host: ${host.name}, Enabled: ${host.hasOwnProperty('enabled') ? host.enabled : 'Propiedad no encontrada'}`);
        return host.enabled === true;
    });

    console.log(`Hosts habilitados en el grupo ${groupId}:`, filteredHosts);
    return filteredHosts;
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
        const jobNames = host.jobNames.join(', ');

        const row = `
            <tr>
                <td>${name}</td>
                <td>${id}</td>
                <td>${descripcion}</td>
                <td>${filial}</td>
                <td>${status}</td>
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
        const hosts = await fetchHostsFromAPI(groupId, inventoryId);
        
        clearTableBody(); // Limpiar la tabla antes de agregar nuevas filas
        updateTableBody(hosts); // Actualizar la tabla con los hosts
        calculateStatus(hosts); // Evaluar los estados de los hosts

        console.log('Total Filiales:', window.totalFiliales);
        console.log('Filiales Actualizadas:', window.actualizadas);
        console.log('Filiales Pendientes:', window.pendientes);
        console.log('Filiales Fallidas:', window.fallidas);

    } catch (error) {
        handleErrorHosts(error); // Maneja los errores
    }
}

// Exportar funciones globales
window.fetchHosts = fetchHosts;
window.fetchHostsFromAPI = fetchHostsFromAPI;
