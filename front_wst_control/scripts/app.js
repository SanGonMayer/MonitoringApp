import { fetchFiliales } from './filiales.js';
import { fetchHosts } from './hosts.js';

console.log('El script se está cargando correctamente');

document.addEventListener('DOMContentLoaded', () => {
  window.buscar = buscar;
  window.fetchFiliales = fetchFiliales;
  window.fetchHosts = fetchHosts;
});

function buscar(tipoTerminal) {
  let inventoryId;
  if (tipoTerminal.includes('wst')) {
    inventoryId = 22;
  } else if (tipoTerminal.includes('cctv')) {
    inventoryId = 347;
  }
  fetchFiliales(inventoryId);
}
