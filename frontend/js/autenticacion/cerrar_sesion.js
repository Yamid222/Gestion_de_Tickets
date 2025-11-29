(function () {
    const btnLogout = document.getElementById('btn-logout');

    if (!btnLogout) return;

    btnLogout.addEventListener('click', async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        }
        window.location.href = 'index.html';
    });
})();
