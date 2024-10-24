async function fetchFilialesFromDB(tipoTerminal) {
    try {
        console.log('Llamando a la API para obtener todas las filiales desde la base de datos');
        
        const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/db/filiales');
        const filiales = await response.json();

        console.log('Fetching filiales from the database:', tipoTerminal);

        clearFilialContainer();

        let filialesFiltradas = [];
        if (tipoTerminal === 'wst.html') {
            filialesFiltradas = filiales.filter(filial => filial.hasWST);
        } else if (tipoTerminal === 'cctv.html') {
            filialesFiltradas = filiales.filter(filial => filial.hasCCTV);
        }

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


window.fetchFilialesFromDB = fetchFilialesFromDB;
