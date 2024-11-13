
async function buscar(tipoTerminal) {
    if (tipoTerminal === 'cctv.html') {
        //await fetchFilialesFromDB('cctv.html');
        await fetchFilialesConHostsFromDB('cctv.html');
    } else if (tipoTerminal === 'wst.html') {
        await fetchFilialesConHostsFromDB('wst.html');
    } else if(tipoTerminal === 'srno.html'){
        await fetchFilialesConHostsFromDB('srno.html');
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


/* ------------------------------------- */



/* document.addEventListener('DOMContentLoaded', () => {

    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);

    // -------------------- 
    // Seleccionar todos los elementos con la clase 'circle' y agregar un listener a cada uno

    const circles = document.querySelectorAll('.circle');

    circles.forEach(circle => {
        circle.addEventListener('click', () => {
            const color = window.getComputedStyle(circle).backgroundColor; // Obtiene el color de fondo del círculo
            filtrarPorColor(color); // Llama a la función de filtrado con el color
        });
    });


    // --------------------

    const actionButton = document.querySelector('#action-button');
    actionButton.addEventListener('click', () => {
        // Llama a la función `clearFilialContainer` para borrar botones actuales
        const filialContainer = document.querySelector('#filialContainer');
        filialContainer.innerHTML = '';

        const cards = document.querySelectorAll('.main-skills .card .circle span');
        cards.forEach(card => {
            card.textContent = '';
        });

        // Llama a `buscar` con el terminal actual para recargar las filiales
        const terminal = window.location.pathname.split('/').pop();
        buscar(terminal);
    });

}); */

document.addEventListener('DOMContentLoaded', () => {

    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);

    // -------------------- 
    // Seleccionar todos los elementos con la clase 'circle' y agregar un listener a cada uno

    const circles = document.querySelectorAll('.circle');
    if (circles.length > 0) {
        circles.forEach(circle => {
            circle.addEventListener('click', () => {
                const color = window.getComputedStyle(circle).backgroundColor;
                filtrarPorColor(color);
            });
        });
    } else {
        console.log("No se encontraron elementos con la clase 'circle' en esta página.");
    }


    // --------------------

    const actionButton = document.querySelector('#action-button');
    if (actionButton) {
        actionButton.addEventListener('click', () => {
            const filialContainer = document.querySelector('#filialContainer');
            filialContainer.innerHTML = '';

            const cards = document.querySelectorAll('.main-skills .card .circle span');
            cards.forEach(card => {
                card.textContent = '';
            });

            const terminal = window.location.pathname.split('/').pop();
            buscar(terminal);
        });
    } else {
        console.log("El botón actionButton no está presente en esta página, se omite el eventListener.");
    }


    // ------------------------

    const params = new URLSearchParams(window.location.search);
    const filialName = params.get('name');
    const fromPage = params.get('from');

    if (filialName) {
        // Recuperar los hosts desde sessionStorage y mostrar los datos si existen
        const hosts = JSON.parse(sessionStorage.getItem('filialHosts'));

        const breadcrumb = document.querySelector('.breadcrumb');
        breadcrumb.innerHTML = `
            <a href="/MonitoringAppFront/">Home</a> / 
            <a href="${fromPage}.html">${fromPage.toUpperCase()}</a> / 
            <a href="filial.html?name=${filialName}&from=${fromPage}">${filialName}</a>
        `;

        const headerText = document.querySelector('header h1');
        headerText.textContent += ` ${filialName}`;

        if (hosts) {
            displayHosts(hosts);
        } else {
            console.error('No se encontraron datos de hosts en sessionStorage');
        }
    } else {
        console.error("No se ha pasado el nombre de la filial en la URL.");
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


window.buscar = buscar;
window.filtrando = filtrando;