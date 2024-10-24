async function fetchFilialesFromDB(tipoTerminal) {
    try {
        console.log('Llamando a la API para obtener todas las filiales desde la base de datos');
        
        // Cambiar la URL para tu entorno.
        const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/db/filiales');
        const filiales = await response.json();

        // Limpiar el contenedor de filiales.
        clearFilialContainer();

        // Filtrar las filiales dependiendo de si es WST o CCTV.
        let filialesFiltradas = [];
        if (tipoTerminal === 'wst.html') {
            filialesFiltradas = filiales.filter(filial => filial.hasWST);
        } else if (tipoTerminal === 'cctv.html') {
            filialesFiltradas = filiales.filter(filial => filial.hasCCTV);
        }

        // Crear los botones de filiales filtradas.
        createFilialButtons(filialesFiltradas);
    } catch (error) {
        console.error('Error obteniendo las filiales desde la base de datos:', error);
    }
}

function clearFilialContainer() {
    const filialContainer = document.querySelector('#filialContainer');
    filialContainer.innerHTML = '';
}

function createFilialButtons(filiales) {
    const filialContainer = document.querySelector('#filialContainer');
    
    filiales.forEach(filial => {
        const button = document.createElement('button');
        button.textContent = filial.name;
        button.classList.add('custom-button');
        
        button.onclick = () => console.log(`Filial seleccionada: ${filial.name}`);
        
        filialContainer.appendChild(button);
    });
}

// Exportar la función global para poder usarla desde otros archivos.
window.fetchFilialesFromDB = fetchFilialesFromDB;
