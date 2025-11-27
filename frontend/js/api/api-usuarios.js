// Funciones para consumir el microservicio de usuarios

async function apiListarUsuarios() {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_USUARIOS}/api/usuarios`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!resp.ok) {
        if (resp.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
            return { success: false, message: 'Sesión expirada' };
        }
    }

    return resp.json();
}

async function apiObtenerUsuario(id) {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_USUARIOS}/api/usuarios/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!resp.ok) {
        if (resp.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
            return { success: false, message: 'Sesión expirada' };
        }
    }

    return resp.json();
}

async function apiActualizarUsuario(id, datos) {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_USUARIOS}/api/usuarios/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
    });

    if (!resp.ok) {
        if (resp.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
            return { success: false, message: 'Sesión expirada' };
        }
    }

    return resp.json();
}

async function apiEliminarUsuario(id) {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_USUARIOS}/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!resp.ok) {
        if (resp.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'index.html';
            return { success: false, message: 'Sesión expirada' };
        }
    }

    return resp.json();
}

async function apiValidarToken() {
    const token = localStorage.getItem('token');

    if (!token) {
        return { success: false, message: 'No hay token' };
    }

    const resp = await fetch(`${BASE_URL_USUARIOS}/api/auth/validate-token`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!resp.ok) {
        if (resp.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            return { success: false, message: 'Token inválido' };
        }
    }

    return resp.json();
}

async function apiLogout() {
    const token = localStorage.getItem('token');

    if (!token) {
        return { success: true };
    }

    const resp = await fetch(`${BASE_URL_USUARIOS}/api/auth/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    // Siempre eliminar del localStorage, incluso si falla el logout en el servidor
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    return resp.json();
}

