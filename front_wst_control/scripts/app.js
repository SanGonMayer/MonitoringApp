import { fetchFiliales, buscar } from './filiales.js';
import { fetchHosts } from './hosts.js';

window.buscar = (tipoTerminal) => buscar(tipoTerminal, fetchFiliales);
window.fetchFiliales = (inventoryId) => fetchFiliales(inventoryId, fetchHosts);
window.fetchHosts = fetchHosts;

document.addEventListener('DOMContentLoaded', () => {
    // Ahora puedes configurar eventos, etc.
});
