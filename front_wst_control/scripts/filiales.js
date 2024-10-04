export async function fetchFiliales(inventoryId) {
    try {
      totalFiliales = 0;
      actualizadas = 0;
      pendientes = 0;
      fallidas = 0;
  
      console.log(`Llamando a la API para el inventoryId: ${inventoryId}`);
      const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups`);
      const groups = await response.json();
  
      const filialContainer = document.querySelector('#filialContainer');
      filialContainer.innerHTML = '';
      allButtons = [];
  
      groups.forEach(group => {
        const button = document.createElement('button');
        button.textContent = group.name;
        button.classList.add('custom-button');
        button.onclick = () => fetchHosts(group.id, inventoryId);
        filialContainer.appendChild(button);
        allButtons.push(button);
      });
  
    } catch (error) {
      console.error('Error obteniendo las filiales:', error);
    }
  }
  