const gruposExcluidos = [
  'f0504', 'f0509', 'f0513', 'f0514', 'f0559', 'f0579', 'f0580', 'f0583', 'f0584', 'f0593', 'f0594', 'f0595', 'f0597', 'f0652', 'f0653', 'f0688', 'f0703',
  'f0071', 'f0517', 'f0603', 'f0661', 'f0662', 'f0663', 'f0664', 'f0665', 'f0668',
  'wst', 'pve','f0999'
];


async function fetchFilialesFromDB(tipoTerminal) {
    try {
      console.log('Fetching filiales from the database:', tipoTerminal);
      const response = await fetch('http://sncl7001lx.bancocredicoop.coop:3000/api/db/filiales');
      
      if (!response.ok) {
        throw new Error('Error al obtener filiales desde la base de datos');
      }
  
      const filiales = await response.json();
  
      /* const filialesFiltradas = filiales.filter(filial => {
        return (tipoTerminal === 'wst.html' && filial.hasWST) ||
               (tipoTerminal === 'cctv.html' && filial.hasCCTV);
      }); */

      let filialesFiltradas = []; 

      if (tipoTerminal === 'wst.html') {
        filialesFiltradas = filiales.filter(filial => filial.hasWST && !gruposExcluidos.includes(filial.name.toLowerCase()));
      } else if (tipoTerminal === 'cctv.html') {
        console.log('Estoy evaluando las filiales para cctv')
        filialesFiltradas = filiales.filter(filial => filial.hasCCTV );
      }
  
      console.log('Filiales filtradas:', filialesFiltradas);
      
      clearFilialContainer();
      
      createFilialButtons(filialesFiltradas, tipoTerminal);

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

function createFilialButtons(filiales, tipoTerminal) {
    const filialContainer = document.querySelector('#filialContainer');
    
    filiales.forEach(filial => {
        const button = document.createElement('button');
        button.textContent = filial.name;
        button.classList.add('custom-button');
        
        button.onclick = async () => {
            const tipo = tipoTerminal === 'wst.html' ? 'wst' : 'cctv';
            const hosts = await fetchHostsFromDB(filial.id, tipo);
            displayHosts(hosts);
        };
        
        filialContainer.appendChild(button);
    });
}


window.fetchFilialesFromDB = fetchFilialesFromDB;
window.clearFilialContainer = clearFilialContainer;
window.createFilialButtons = createFilialButtons;
