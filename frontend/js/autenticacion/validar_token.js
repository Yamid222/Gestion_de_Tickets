(async function () {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const resultado = await apiValidarToken();
        
        if (!resultado.success) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
            return;
        }

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
