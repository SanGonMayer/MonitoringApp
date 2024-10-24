async function fetchFilialesFromDB(tipoTerminal) {
    try {
      console.log('Fetching filiales from the database:', tipoTerminal);
      const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/db/filiales');
      
      if (!response.ok) {
        throw new Error('Error al obtener filiales desde la base de datos');
      }
  
      const filiales = await response.json();
  
      const filialesFiltradas = filiales.filter(filial => {
        return (tipoTerminal === 'wst.html' && filial.hasWST) ||
               (tipoTerminal === 'cctv.html' && filial.hasCCTV);
      });
  
      console.log('Filiales filtradas:', filialesFiltradas);
      
      clearFilialContainer();
      
      createFilialButtons(filialesFiltradas);

      return filialesFiltradas;
  
    } catch (error) {
      console.error('Error obteniendo las filiales desde la base de datos:', error);
      return [];
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
window.clearFilialContainer = clearFilialContainer;
window.createFilialButtons = createFilialButtons;
