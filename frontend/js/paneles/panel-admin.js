// Script para el panel de administrador
// Maneja: gestión de tickets (ver todos, filtrar, actualizar estado, asignar, comentarios)
// y gestión de usuarios (listar, actualizar, eliminar)

(function() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    // Verificar que sea admin
    if (usuario.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    const listaTickets = document.getElementById('lista-tickets');
    const detalleTicket = document.getElementById('detalle-ticket');
    const listaUsuarios = document.getElementById('lista-usuarios');
    const filtrosTickets = document.getElementById('filtros-tickets');

    let todosLosUsuarios = [];

    // Cargar datos al iniciar
    cargarTickets();
    cargarUsuarios();
    crearFiltros();

    // Crear interfaz de filtros
    function crearFiltros() {
        const html = `
            <div class="filtros-contenedor">
                <h3>Filtros</h3>
                <div class="filtro-grupo">
                    <label for="filtro-estado">Estado:</label>
                    <select id="filtro-estado">
                        <option value="">Todos</option>
                        <option value="abierto">Abierto</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                    </select>
                </div>
                <div class="filtro-grupo">
                    <label for="filtro-gestor">Gestor:</label>
                    <select id="filtro-gestor">
                        <option value="">Todos</option>
                    </select>
                </div>
                <div class="filtro-grupo">
                    <label for="filtro-admin">Administrador asignado:</label>
                    <select id="filtro-admin">
                        <option value="">Todos</option>
                        <option value="sin_asignar">Sin asignar</option>
                    </select>
                </div>
                <button id="btn-aplicar-filtros" class="btn-primario">Aplicar filtros</button>
                <button id="btn-limpiar-filtros" class="btn-secundario">Limpiar</button>
            </div>
        `;

        filtrosTickets.innerHTML = html;

        // Event listeners para filtros
        document.getElementById('btn-aplicar-filtros').addEventListener('click', aplicarFiltros);
        document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);

        // Llenar selectores con usuarios
        cargarUsuariosEnFiltros();
    }

    // Cargar usuarios en los filtros
    function cargarUsuariosEnFiltros() {
        const selectGestor = document.getElementById('filtro-gestor');
        const selectAdmin = document.getElementById('filtro-admin');

        if (todosLosUsuarios.length > 0) {
            todosLosUsuarios.forEach(user => {
                if (user.role === 'gestor') {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    selectGestor.appendChild(option);
                }
                if (user.role === 'admin') {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    selectAdmin.appendChild(option);
                }
            });
        }
    }

    // Aplicar filtros
    function aplicarFiltros() {
        const estado = document.getElementById('filtro-estado').value;
        const gestorId = document.getElementById('filtro-gestor').value;
        const adminId = document.getElementById('filtro-admin').value;

        const params = {};
        if (estado) params.estado = estado;
        if (gestorId) params.gestor_id = gestorId;
        if (adminId && adminId !== 'sin_asignar') {
            params.admin_id = adminId;
        }
        if (adminId === 'sin_asignar') {
            params.sin_asignar = '1';
        }

        cargarTickets(params);
    }

    // Limpiar filtros
    function limpiarFiltros() {
        document.getElementById('filtro-estado').value = '';
        document.getElementById('filtro-gestor').value = '';
        document.getElementById('filtro-admin').value = '';
        cargarTickets();
    }

    // Cargar todos los tickets
    async function cargarTickets(params = {}) {
        try {
            const resultado = await apiListarTickets(params);

            if (resultado.success && resultado.data) {
                mostrarTickets(resultado.data);
            } else {
                listaTickets.innerHTML = '<p>No hay tickets disponibles</p>';
            }
        } catch (error) {
            console.error('Error al cargar tickets:', error);
            listaTickets.innerHTML = '<p class="error">Error al cargar tickets</p>';
        }
    }

    // Mostrar lista de tickets
    function mostrarTickets(tickets) {
        if (tickets.length === 0) {
            listaTickets.innerHTML = '<p>No hay tickets que coincidan con los filtros</p>';
            return;
        }

        const html = tickets.map(ticket => {
            const estadoClass = `estado-${ticket.estado}`;
            const fecha = new Date(ticket.created_at).toLocaleDateString('es-ES');
            
            return `
                <div class="ticket-item" data-id="${ticket.id}">
                    <h3>${ticket.titulo}</h3>
                    <p class="ticket-meta">
                        <span class="estado ${estadoClass}">${ticket.estado}</span>
                        <span class="fecha">${fecha}</span>
                    </p>
                    <p class="ticket-descripcion">${ticket.descripcion.substring(0, 100)}${ticket.descripcion.length > 100 ? '...' : ''}</p>
                    <button class="btn-ver-detalle" data-id="${ticket.id}">Ver detalles</button>
                </div>
            `;
        }).join('');

        listaTickets.innerHTML = html;

        // Agregar event listeners
        document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.target.getAttribute('data-id');
                verDetalleTicket(ticketId);
            });
        });
    }

    // Ver detalle de un ticket
    async function verDetalleTicket(ticketId) {
        try {
            const resultado = await apiObtenerTicket(ticketId);

            if (resultado.success && resultado.data) {
                mostrarDetalleTicket(resultado.data);
            } else {
                detalleTicket.innerHTML = '<p class="error">Error al cargar el ticket</p>';
            }
        } catch (error) {
            console.error('Error al cargar detalle:', error);
            detalleTicket.innerHTML = '<p class="error">Error al conectar con el servidor</p>';
        }
    }

    // Mostrar detalle del ticket con controles de admin
    function mostrarDetalleTicket(ticket) {
        const estadoClass = `estado-${ticket.estado}`;
        const fechaCreacion = new Date(ticket.created_at).toLocaleString('es-ES');
        const fechaActualizacion = new Date(ticket.updated_at).toLocaleString('es-ES');

        let actividadesHtml = '';
        if (ticket.actividades && ticket.actividades.length > 0) {
            actividadesHtml = ticket.actividades.map(act => {
                const fechaAct = new Date(act.created_at).toLocaleString('es-ES');
                return `
                    <div class="actividad-item">
                        <p class="actividad-mensaje">${act.mensaje}</p>
                        <p class="actividad-fecha">${fechaAct}</p>
                    </div>
                `;
            }).join('');
        } else {
            actividadesHtml = '<p>No hay comentarios aún</p>';
        }

        // Opciones de administradores para asignar
        const adminsOptions = todosLosUsuarios
            .filter(u => u.role === 'admin')
            .map(admin => `<option value="${admin.id}">${admin.name}</option>`)
            .join('');

        const html = `
            <div class="detalle-ticket-contenido">
                <h3>${ticket.titulo}</h3>
                <div class="ticket-info">
                    <p><strong>Estado:</strong> <span class="estado ${estadoClass}">${ticket.estado}</span></p>
                    <p><strong>Creado:</strong> ${fechaCreacion}</p>
                    <p><strong>Última actualización:</strong> ${fechaActualizacion}</p>
                </div>
                <div class="ticket-descripcion-completa">
                    <h4>Descripción:</h4>
                    <p>${ticket.descripcion}</p>
                </div>
                <div class="admin-controls">
                    <h4>Gestión:</h4>
                    <div class="control-grupo">
                        <label for="cambiar-estado">Cambiar estado:</label>
                        <select id="cambiar-estado">
                            <option value="abierto" ${ticket.estado === 'abierto' ? 'selected' : ''}>Abierto</option>
                            <option value="en_progreso" ${ticket.estado === 'en_progreso' ? 'selected' : ''}>En Progreso</option>
                            <option value="resuelto" ${ticket.estado === 'resuelto' ? 'selected' : ''}>Resuelto</option>
                            <option value="cerrado" ${ticket.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                        </select>
                        <button id="btn-actualizar-estado" class="btn-primario" data-ticket-id="${ticket.id}">Actualizar estado</button>
                    </div>
                    <div class="control-grupo">
                        <label for="asignar-admin">Asignar a:</label>
                        <select id="asignar-admin">
                            <option value="">Sin asignar</option>
                            ${adminsOptions}
                        </select>
                        <button id="btn-asignar" class="btn-primario" data-ticket-id="${ticket.id}">Asignar</button>
                    </div>
                    <p id="mensaje-gestion" class="mensaje"></p>
                </div>
                <div class="ticket-actividades">
                    <h4>Comentarios:</h4>
                    <div class="actividades-lista">${actividadesHtml}</div>
                </div>
                <div class="agregar-comentario">
                    <h4>Agregar comentario:</h4>
                    <textarea id="nuevo-comentario" rows="3" placeholder="Escribe tu comentario..."></textarea>
                    <button id="btn-agregar-comentario" class="btn-primario" data-ticket-id="${ticket.id}">Agregar comentario</button>
                    <p id="mensaje-comentario" class="mensaje"></p>
                </div>
            </div>
        `;

        detalleTicket.innerHTML = html;

        // Event listeners para controles de admin
        document.getElementById('btn-actualizar-estado').addEventListener('click', async () => {
            const nuevoEstado = document.getElementById('cambiar-estado').value;
            const mensajeGestion = document.getElementById('mensaje-gestion');

            try {
                const resultado = await apiActualizarEstadoTicket(ticket.id, nuevoEstado, usuario.id);

                if (resultado.success) {
                    mensajeGestion.textContent = 'Estado actualizado exitosamente';
                    mensajeGestion.className = 'mensaje exito';
                    verDetalleTicket(ticket.id);
                    cargarTickets();
                } else {
                    mensajeGestion.textContent = resultado.message || 'Error al actualizar estado';
                    mensajeGestion.className = 'mensaje error';
                }
            } catch (error) {
                console.error('Error al actualizar estado:', error);
                mensajeGestion.textContent = 'Error al conectar con el servidor';
                mensajeGestion.className = 'mensaje error';
            }
        });

        document.getElementById('btn-asignar').addEventListener('click', async () => {
            const adminId = document.getElementById('asignar-admin').value;
            const mensajeGestion = document.getElementById('mensaje-gestion');

            if (!adminId) {
                mensajeGestion.textContent = 'Selecciona un administrador';
                mensajeGestion.className = 'mensaje error';
                return;
            }

            try {
                const resultado = await apiAsignarTicket(ticket.id, adminId, usuario.id);

                if (resultado.success) {
                    mensajeGestion.textContent = 'Ticket asignado exitosamente';
                    mensajeGestion.className = 'mensaje exito';
                    verDetalleTicket(ticket.id);
                    cargarTickets();
                } else {
                    mensajeGestion.textContent = resultado.message || 'Error al asignar ticket';
                    mensajeGestion.className = 'mensaje error';
                }
            } catch (error) {
                console.error('Error al asignar ticket:', error);
                mensajeGestion.textContent = 'Error al conectar con el servidor';
                mensajeGestion.className = 'mensaje error';
            }
        });

        // Event listener para comentarios
        document.getElementById('btn-agregar-comentario').addEventListener('click', async () => {
            const mensaje = document.getElementById('nuevo-comentario').value.trim();
            const mensajeComentario = document.getElementById('mensaje-comentario');

            if (!mensaje) {
                mensajeComentario.textContent = 'El comentario no puede estar vacío';
                mensajeComentario.className = 'mensaje error';
                return;
            }

            try {
                const resultado = await apiAgregarComentario(ticket.id, mensaje, usuario.id);

                if (resultado.success) {
                    mensajeComentario.textContent = 'Comentario agregado exitosamente';
                    mensajeComentario.className = 'mensaje exito';
                    document.getElementById('nuevo-comentario').value = '';
                    verDetalleTicket(ticket.id);
                    cargarTickets();
                } else {
                    mensajeComentario.textContent = resultado.message || 'Error al agregar comentario';
                    mensajeComentario.className = 'mensaje error';
                }
            } catch (error) {
                console.error('Error al agregar comentario:', error);
                mensajeComentario.textContent = 'Error al conectar con el servidor';
                mensajeComentario.className = 'mensaje error';
            }
        });
    }

    // Cargar usuarios
    async function cargarUsuarios() {
        try {
            const resultado = await apiListarUsuarios();

            if (resultado.success && resultado.data) {
                todosLosUsuarios = resultado.data;
                mostrarUsuarios(resultado.data);
            } else {
                listaUsuarios.innerHTML = '<p>No hay usuarios disponibles</p>';
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            listaUsuarios.innerHTML = '<p class="error">Error al cargar usuarios</p>';
        }
    }

    // Mostrar lista de usuarios
    function mostrarUsuarios(usuarios) {
        if (usuarios.length === 0) {
            listaUsuarios.innerHTML = '<p>No hay usuarios</p>';
            return;
        }

        const html = usuarios.map(user => {
            const fecha = new Date(user.created_at).toLocaleDateString('es-ES');
            const roleClass = `role-${user.role}`;
            
            return `
                <div class="usuario-item" data-id="${user.id}">
                    <div class="usuario-info">
                        <h4>${user.name}</h4>
                        <p>${user.email}</p>
                        <p><span class="role ${roleClass}">${user.role}</span> - Creado: ${fecha}</p>
                    </div>
                    <div class="usuario-acciones">
                        <button class="btn-editar-usuario" data-id="${user.id}">Editar</button>
                        <button class="btn-eliminar-usuario" data-id="${user.id}">Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');

        listaUsuarios.innerHTML = html;

        // Event listeners
        document.querySelectorAll('.btn-editar-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-id');
                mostrarFormularioEditar(userId);
            });
        });

        document.querySelectorAll('.btn-eliminar-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-id');
                eliminarUsuario(userId);
            });
        });
    }

    // Mostrar formulario de edición
    function mostrarFormularioEditar(userId) {
        const user = todosLosUsuarios.find(u => u.id == userId);
        if (!user) return;

        const html = `
            <div class="formulario-editar-usuario">
                <h3>Editar Usuario</h3>
                <form id="form-editar-usuario" data-user-id="${user.id}">
                    <div class="campo-form">
                        <label for="edit-name">Nombre:</label>
                        <input type="text" id="edit-name" value="${user.name}" required>
                    </div>
                    <div class="campo-form">
                        <label for="edit-email">Email:</label>
                        <input type="email" id="edit-email" value="${user.email}" required>
                    </div>
                    <div class="campo-form">
                        <label for="edit-role">Rol:</label>
                        <select id="edit-role" required>
                            <option value="gestor" ${user.role === 'gestor' ? 'selected' : ''}>Gestor</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primario">Guardar cambios</button>
                    <button type="button" class="btn-secundario btn-cancelar-edicion">Cancelar</button>
                </form>
                <p id="mensaje-edicion" class="mensaje"></p>
            </div>
        `;

        listaUsuarios.innerHTML = html;

        // Event listeners
        document.getElementById('form-editar-usuario').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = e.target.getAttribute('data-user-id');
            const name = document.getElementById('edit-name').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const role = document.getElementById('edit-role').value;
            const mensajeEdicion = document.getElementById('mensaje-edicion');

            try {
                const resultado = await apiActualizarUsuario(userId, { name, email, role });

                if (resultado.success) {
                    mensajeEdicion.textContent = 'Usuario actualizado exitosamente';
                    mensajeEdicion.className = 'mensaje exito';
                    setTimeout(() => {
                        cargarUsuarios();
                    }, 1000);
                } else {
                    mensajeEdicion.textContent = resultado.message || 'Error al actualizar usuario';
                    mensajeEdicion.className = 'mensaje error';
                }
            } catch (error) {
                console.error('Error al actualizar usuario:', error);
                mensajeEdicion.textContent = 'Error al conectar con el servidor';
                mensajeEdicion.className = 'mensaje error';
            }
        });

        document.querySelector('.btn-cancelar-edicion').addEventListener('click', () => {
            cargarUsuarios();
        });
    }

    // Eliminar usuario
    async function eliminarUsuario(userId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            return;
        }

        try {
            const resultado = await apiEliminarUsuario(userId);

            if (resultado.success) {
                alert('Usuario eliminado exitosamente');
                cargarUsuarios();
            } else {
                alert(resultado.message || 'Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error al conectar con el servidor');
        }
    }
})();

