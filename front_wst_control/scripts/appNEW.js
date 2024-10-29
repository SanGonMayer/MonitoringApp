function buscar(tipoTerminal) {
    if (tipoTerminal === 'cctv.html') {
        fetchFiliales(347);
    } else if (tipoTerminal === 'wst.html') {
        fetchFiliales(22);
    } else if (tipoTerminal === ''){
        crearGraficoCircular('#circularCctv','cctv.html');
        crearGraficoCircular('#circularWst','wst.html');
    } else {
        console.log('Página no reconocida.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);
});

window.buscar = buscar;
