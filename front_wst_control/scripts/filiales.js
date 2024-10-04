let allButtons = [];
let totalFiliales = 0;
let actualizadas = 0;
let pendientes = 0;
let fallidas = 0;

function inicializarEstados() {
    totalFiliales = 0;
    actualizadas = 0;
    pendientes = 0;
    fallidas = 0;
}

async function fetchGroupsFromAWX(inventoryId) {
    const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups`);
    return await response.json();
}

function clearFilialContainer() {
    const filialContainer = document.querySelector('#filialContainer');
    filialContainer.innerHTML = '';
    allButtons = [];
}

function createFilialButtons(groups, inventoryId) {
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

    } catch (error) {
        handleErrorFiliales(error); // Maneja los errores
    }
}

// Exportar funciones globales
window.fetchFiliales = fetchFiliales;
window.allButtons = allButtons;
