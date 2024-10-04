export async function fetchHosts(groupId, inventoryId) {
    try {
      const response = await fetch(`http://sncl7001lx.bancocredicoop.coop:3000/api/awx/inventories/${inventoryId}/groups/${groupId}/hosts`);
      const hosts = await response.json();
  
      const tableBody = document.querySelector('#workstationsTable tbody');
      tableBody.innerHTML = '';
  
      let hayPendientes = false;
      let hayFallidas = false;
      let todasActualizadas = true;
  
      hosts.forEach(host => {
        const name = host.name || 'Nombre no identificado';
        const id = host.id || 'ID no identificado';
        const descripcion = host.description ? host.description.split(' ')[0] : 'Sin descripción';
        const filial = host.inventory || 'Desconocida';
        const status = host.status || 'No ejecutado';
        const jobNames = host.jobNames.join(', ');
  
        if (status === 'No ejecutado') {
          hayPendientes = true;
          todasActualizadas = false;
        } else if (status === 'Fallido') {
          hayFallidas = true;
          todasActualizadas = false;
        } else if (status !== 'Actualizado') {
          todasActualizadas = false;
        }
  
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
  
      totalFiliales++;
      if (hayFallidas) {
        fallidas++;
      } else if (hayPendientes) {
        pendientes++;
      } else if (todasActualizadas) {
        actualizadas++;
      }
  
      updatePorcentajes();
  
    } catch (error) {
      console.error('Error obteniendo los hosts:', error);
    }
  }
  
  function updatePorcentajes() {
    if (totalFiliales === 0) return;
  
    const porcentajeActualizadas = Math.round((actualizadas / totalFiliales) * 100);
    const porcentajePendientes = Math.round((pendientes / totalFiliales) * 100);
    const porcentajeFallidas = Math.round((fallidas / totalFiliales) * 100);
  
    document.querySelector('.main-skills .card:nth-child(1) .circle span').textContent = `${porcentajeActualizadas}%`;
    document.querySelector('.main-skills .card:nth-child(2) .circle span').textContent = `${porcentajePendientes}%`;
    document.querySelector('.main-skills .card:nth-child(3) .circle span').textContent = `${porcentajeFallidas}%`;
  }
  