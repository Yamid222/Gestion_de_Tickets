// Validar que exista un token válido antes de mostrar pantallas protegidas
// Si no hay token o es inválido, redirige al login

(async function () {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Validar el token con el backend
    try {
        const resultado = await apiValidarToken();
        
        if (!resultado.success) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
            return;
        }

        // Actualizar datos del usuario en localStorage si es necesario
        if (resultado.data && resultado.data.user) {
            localStorage.setItem('usuario', JSON.stringify(resultado.data.user));
        }
    } catch (error) {
        console.error('Error al validar token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'index.html';
    }
})();
