export async function fetchHostsFromAPI(groupId, inventoryId) {
    const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
    return await response.json();
}

export function clearTableBody() {
    const tableBody = document.querySelector('#workstationsTable tbody');
    tableBody.innerHTML = '';
}

export function updateTableBody(hosts) {
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

export function calculateStatus(hosts) {
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

    totalFiliales++;
    if (hayFallidas) {
        fallidas++;
    } else if (hayPendientes) {
        pendientes++;
    } else if (todasActualizadas) {
        actualizadas++;
    }

    // Calcular y actualizar los porcentajes
    updatePorcentajes();
}

export function updatePorcentajes() {
    if (totalFiliales === 0) return;

    const porcentajeActualizadas = Math.round((actualizadas / totalFiliales) * 100);
    const porcentajePendientes = Math.round((pendientes / totalFiliales) * 100);
    const porcentajeFallidas = Math.round((fallidas / totalFiliales) * 100);

    document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${porcentajeActualizadas}%`;
    document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${porcentajePendientes}%`;
    document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${porcentajeFallidas}%`;
}

export function handleErrorHosts(error) {
    console.error('Error obteniendo los hosts:', error);
}

export async function fetchHosts(groupId, inventoryId) {
    try {
        const hosts = await fetchHostsFromAPI(groupId, inventoryId);
        
        clearTableBody(); 
        updateTableBody(hosts); 
        calculateStatus(hosts); 

        console.log('Total Filiales:', totalFiliales);
        console.log('Filiales Actualizadas:', actualizadas);
        console.log('Filiales Pendientes:', pendientes);
        console.log('Filiales Fallidas:', fallidas);

    } catch (error) {
        handleErrorHosts(error);
    }
}
