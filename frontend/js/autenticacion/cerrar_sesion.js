// Cerrar sesión: eliminar token en el backend y redirigir al login

(function () {
    const btnLogout = document.getElementById('btn-logout');

    if (!btnLogout) return;

    btnLogout.addEventListener('click', async () => {
        // Llamar al backend para eliminar el token
        try {
            await apiLogout();
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        }
        
        // Siempre redirigir al login
        window.location.href = 'index.html';
    });
})();
