console.log('El script se está cargando correctamente');

// Variables globales para el estado
window.totalFiliales = 0;
window.actualizadas = 0;
window.pendientes = 0;
window.fallidas = 0;
window.allButtons = [];


function buscar(tipoTerminal) {
    if (tipoTerminal === 'cctv.html') {
        fetchFiliales(347);
    } else if (tipoTerminal === 'wst.html') {
        fetchFiliales(22);
    } else if (tipoTerminal === ''){
        crearGraficoCircular('#circularCctv','cctv.html');
        crearGraficoCircular('#circularWst','wst.html');
    }
}

function filtrando() {
    const filial = document.getElementById('search').value.toLowerCase();

    allButtons.forEach(button => {
        const buttonText = button.textContent.toLowerCase();
        button.style.display = buttonText.includes(filial) ? '' : 'none';
    });
}

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {    
    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);
});

// Exportar funciones globales
window.buscar = buscar;
window.filtrando = filtrando;