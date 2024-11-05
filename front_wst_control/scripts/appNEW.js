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
async function buscar(tipoTerminal) {
    if (tipoTerminal === 'cctv.html') {
        //await fetchFilialesFromDB('cctv.html');
        await fetchFilialesConHostsFromDB('cctv.html');
    } else if (tipoTerminal === 'wst.html') {
        await fetchFilialesConHostsFromDB('wst.html');
    } else if (tipoTerminal === ''){
        await crearGraficoCircular('#circularCctv','cctv.html');
        await crearGraficoCircular('#circularWst','wst.html');
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

    // LIMPIANDO LA TABLA CUANDO SE BUSCA
    const tableBody = document.querySelector('#workstationsTable tbody');
    tableBody.innerHTML = ''; 

    const table = document.getElementById('workstationsTable');

    const filial = document.getElementById('search').value.toLowerCase();

    allButtons.forEach(button => {
        const buttonText = button.textContent.toLowerCase();
        button.style.display = buttonText.includes(filial) ? '' : 'none';
    });

    // Oculta la tabla
    table.style.display = 'none';
}


function filtrarPorColor(color) {

    allButtons.forEach(button => {
        // Obtiene el color de fondo actual del botón en formato RGB
        const backgroundColor = window.getComputedStyle(button).backgroundColor;
        // Muestra solo los botones con fondo verde exacto rgb(0, 128, 0)
        button.style.display = (backgroundColor === color) ? '' : 'none';
    });
}

/* ------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);

    document.querySelector('.circle.verde').addEventListener('click', filtrarPorColor('rgb(0, 128, 0)'));
    document.querySelector('.circle.naranja').addEventListener('click', filtrarPorColor('rgb(255, 193, 7)'));
    document.querySelector('.circle.rojo').addEventListener('click', filtrarPorColor('rgb(255, 0, 0)'));
});

window.buscar = buscar;
window.filtrando = filtrando;