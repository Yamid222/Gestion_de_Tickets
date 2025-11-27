// Configuración de consumo del microservicio de tickets

// BASE_URL_TICKETS se define en configuracion.js

// Funciones para consumir el microservicio de tickets

async function apiListarTickets(params = {}) {
    const token = localStorage.getItem('token');
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL_TICKETS}/api/tickets${query ? `?${query}` : ''}`;

    const resp = await fetch(url, {
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

async function apiCrearTicket({ titulo, descripcion, gestor_id }) {
    const token = localStorage.getItem('token');

    try {
        const resp = await fetch(`${BASE_URL_TICKETS}/api/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                titulo,
                descripcion,
                gestor_id
            })
        });

        // Verificar el Content-Type de la respuesta
        const contentType = resp.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await resp.text();
            console.error('Respuesta no es JSON:', text.substring(0, 200));
            return { 
                success: false, 
                message: 'El servidor devolvió una respuesta inválida. Verifica que el microservicio esté corriendo.' 
            };
        }

        if (!resp.ok) {
            if (resp.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
                window.location.href = 'index.html';
                return { success: false, message: 'Sesión expirada' };
            }
        }

        return await resp.json();
    } catch (error) {
        console.error('Error en apiCrearTicket:', error);
        return { 
            success: false, 
            message: `Error de conexión: ${error.message}. Verifica que el microservicio de tickets esté corriendo en ${BASE_URL_TICKETS}` 
        };
    }
}

async function apiObtenerTicket(id) {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_TICKETS}/api/tickets/${id}`, {
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

async function apiActualizarEstadoTicket(id, estado, user_id, mensaje = null) {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_TICKETS}/api/tickets/${id}/estado`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            estado,
            user_id,
            mensaje
        })
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

async function apiAsignarTicket(id, admin_id, user_id) {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_TICKETS}/api/tickets/${id}/asignar`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            admin_id,
            user_id
        })
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

async function apiAgregarComentario(id, mensaje, user_id) {
    const token = localStorage.getItem('token');

    const resp = await fetch(`${BASE_URL_TICKETS}/api/tickets/${id}/comentarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            mensaje,
            user_id
        })
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
