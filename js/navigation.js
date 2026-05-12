function navigateTo(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    // Mostrar la vista seleccionada
    document.getElementById(viewId).classList.add('active');
}