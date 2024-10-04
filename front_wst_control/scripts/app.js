console.log('El script se está cargando correctamente');

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    function buscar(tipoTerminal) {
        let inventoryId;
        if (tipoTerminal.includes('wst')) {
            inventoryId = 22;
        } else if (tipoTerminal.includes('cctv')) {
            inventoryId = 347;
        }

        // Llamar a fetchFiliales con el nuevo inventoryId
        fetchFiliales(inventoryId);
    }

    function filtrando() {
        const filial = document.getElementById('search').value.toLowerCase();

        allButtons.forEach(button => {
            const buttonText = button.textContent.toLowerCase();
            button.style.display = buttonText.includes(filial) ? '' : 'none';
        });
    }

    // Exportar funciones globales
    window.buscar = buscar;
    window.filtrando = filtrando;
});
