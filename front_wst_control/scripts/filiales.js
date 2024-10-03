let totalFiliales = 0;
let actualizadas = 0;
let pendientes = 0;
let fallidas = 0;

let allButtons = [];

// Funciones relacionadas con las filiales
export function inicializarEstados() {
    totalFiliales = 0;
    actualizadas = 0;
    pendientes = 0;
    fallidas = 0;
}

export async function fetchGroupsFromAWX(inventoryId) {
    const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups`);
    return await response.json();
}

export function clearFilialContainer() {
    const filialContainer = document.querySelector('#filialContainer');
    filialContainer.innerHTML = '';
    allButtons = [];
}

export function createFilialButtons(groups, inventoryId, fetchHosts) {
    const filialContainer = document.querySelector('#filialContainer');
  
    groups.forEach(group => {
        const button = document.createElement('button');
        button.textContent = group.name;
        button.classList.add('custom-button');
        button.onclick = () => fetchHosts(group.id, inventoryId); // Asigna el evento de clic para cada botón
        filialContainer.appendChild(button);
        allButtons.push(button);
    });
}

export function handleErrorFiliales(error) {
    console.error('Error obteniendo las filiales:', error);
}

export async function fetchFiliales(inventoryId, fetchHosts) {
    try {
        inicializarEstados(); // Inicializa las variables de estado
        console.log(`Llamando a la API para el inventoryId: ${inventoryId}`);
        
        // Obtener la lista de filiales (grupos)
        const groups = await fetchGroupsFromAWX(inventoryId);
        
        clearFilialContainer(); // Limpia el contenedor de filiales
        createFilialButtons(groups, inventoryId, fetchHosts); // Crea los botones para cada filial

    } catch (error) {
        handleErrorFiliales(error); // Maneja los errores
    }
}

export function buscar(tipoTerminal, fetchFiliales) {
    let inventoryId;
    if (tipoTerminal.includes('wst')) {
        inventoryId = 22;
    } else if (tipoTerminal.includes('cctv')) {
        inventoryId = 347;
    }

    // Llamar a fetchFiliales con el nuevo inventoryId
    fetchFiliales(inventoryId);
}
