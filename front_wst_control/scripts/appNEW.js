/* function buscar(tipoTerminal) {
    if (tipoTerminal === 'cctv.html') {
        fetchFilialesFromDB('cctv.html');
    } else if (tipoTerminal === 'wst.html') {
        fetchFilialesFromDB('wst.html');
    } else {
        console.log('Página no reconocida.');
    }
}
 */
function buscar(tipoTerminal) {
    if (tipoTerminal === 'cctv.html') {
        fetchFilialesFromDB('cctv.html');
    } else if (tipoTerminal === 'wst.html') {
        fetchFilialesFromDB('wst.html');
    } else if (tipoTerminal === ''){
        crearGraficoCircular('#circularCctv','cctv.html');
        crearGraficoCircular('#circularWst','wst.html');
    } else {
        console.log('Página no reconocida.');
    }
}

/* ------------------------------------- */
// Variables globales para el estado
window.totalFiliales = 0;
window.actualizadas = 0;
window.pendientes = 0;
window.fallidas = 0;
window.allButtons = [];


function filtrando() {
    const filial = document.getElementById('search').value.toLowerCase();

    allButtons.forEach(button => {
        const buttonText = button.textContent.toLowerCase();
        button.style.display = buttonText.includes(filial) ? '' : 'none';
    });
}

windows.filtrando = filtrando;
/* ------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);
});

window.buscar = buscar;
