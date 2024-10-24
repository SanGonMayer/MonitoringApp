async function buscarYCrear(tipoTerminal) {
    try {
        clearFilialContainer();

        const filiales = await fetchFilialesFromDB(tipoTerminal);
        
        createFilialButtons(filiales);

    } catch (error) {
        console.error('Error al buscar las filiales:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const terminal = window.location.pathname.split('/').pop(); 
    buscar(terminal);
});

window.buscar = buscar;
