// Manejo de login en el frontend
// Por ahora se asume que el microservicio de usuarios expone un endpoint /login
// que devuelve { success, data: { token, user: { id, role, name, email } } }

const formLogin = document.getElementById('form-login');
const mensajeLogin = document.getElementById('mensaje-login');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensajeLogin.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const resp = await fetch(`${API_USUARIOS}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            let data;
            try {
                data = await resp.json();
            } catch (e) {
                console.error('No se pudo parsear JSON de la respuesta del login', e);
                mensajeLogin.textContent = `Error del servidor (status ${resp.status})`;
                return;
            }

            if (!resp.ok) {
                console.error('Error HTTP en login:', resp.status, data);
                mensajeLogin.textContent = data.message
                    ? `(${resp.status}) ${data.message}`
                    : `Error del servidor (status ${resp.status})`;
                return;
            }

            if (!data.success) {
                mensajeLogin.textContent = data.message || 'Credenciales inválidas';
                return;
            }

            const { token, user } = data.data;

            // Guardar token y datos básicos en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('usuario', JSON.stringify(user));

            // Redirigir según rol
            if (user.role === 'admin') {
                window.location.href = 'panel-admin.html';
            } else {
                window.location.href = 'panel-gestor.html';
            }
        } catch (error) {
            console.error('Error de red en login:', error);
            mensajeLogin.textContent = 'Error al conectar con el servidor';
        }
    });
}
