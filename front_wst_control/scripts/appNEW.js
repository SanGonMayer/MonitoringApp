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


/* function filtrarPorColor(){

    allButtons.forEach(button => {
        // Obtiene el color de fondo actual del botón en formato RGB
        const backgroundColor = window.getComputedStyle(button).backgroundColor;
        // Muestra solo los botones con fondo verde exacto rgb(0, 128, 0)
        button.style.display = (backgroundColor === 'rgb(0, 128, 0)') ? '' : 'none';
    });
} */

/* ------------------------------------- */

/* document.addEventListener('DOMContentLoaded', () => {
    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);

    document.querySelector('.circle').addEventListener('click', filtrarPorColor);
    //document.querySelector('.circle.naranja').addEventListener('click', filtrarPorColor('rgb(255, 193, 7)'));
    //document.querySelector('.circle.rojo').addEventListener('click', filtrarPorColor('rgb(255, 0, 0)'));
}); */


document.addEventListener('DOMContentLoaded', () => {

    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);
    // Seleccionar todos los elementos con la clase 'circle' y agregar un listener a cada uno
    const circles = document.querySelectorAll('.circle');

    circles.forEach(circle => {
        circle.addEventListener('click', () => {
            const color = window.getComputedStyle(circle).backgroundColor; // Obtiene el color de fondo del círculo
            filtrarPorColor(color); // Llama a la función de filtrado con el color
        });
    });


    /* -------------------- */

    const actionButton = document.getElementById("action-button");
    if (actionButton) {
        actionButton.addEventListener("click", buscarFiliales);
    }


});

function filtrarPorColor(selectedColor) {
    // Lógica para filtrar botones
    const table = document.getElementById('workstationsTable');
    const tableBody = document.querySelector('#workstationsTable tbody');
    tableBody.innerHTML = ''; 
    console.log('Mostrando el color por cada click', selectedColor);

    allButtons.forEach(button => {
        const backgroundColor = window.getComputedStyle(button).backgroundColor;
        // Compara el color del botón con el color seleccionado
        button.style.display = (backgroundColor === selectedColor) ? '' : 'none';
    });

    table.style.display = 'none';
}

/* --------------- */

function buscarFiliales(){
    const terminal = window.location.pathname.split('/').pop(); 

    /* const filialContainer = document.getElementById("filialContainer");

    // Limpia el contenedor para eliminar botones anteriores
    if (filialContainer) {
        filialContainer.innerHTML = ""; // Esto asegura que el contenedor esté vacío antes de agregar nuevos botones
    } */

    window.allButtons = 0;
    buscar(terminal);
}



window.buscar = buscar;
window.filtrando = filtrando;