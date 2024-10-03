import { fetchFiliales, buscar } from './scripts/filiales.js';
import { fetchHosts } from './scripts/hosts.js';

window.buscar = (tipoTerminal) => buscar(tipoTerminal, fetchFiliales);
window.fetchFiliales = (inventoryId) => fetchFiliales(inventoryId, fetchHosts);
window.fetchHosts = fetchHosts;

document.addEventListener('DOMContentLoaded', () => {
    // Ahora puedes configurar eventos, etc.
});
