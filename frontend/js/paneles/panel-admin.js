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
    
    const etiquetaUsuarioNombre = document.getElementById('usuario-nombre');
    const etiquetaUsuarioCorreo = document.getElementById('usuario-correo');
    const etiquetaUsuarioId = document.getElementById('usuario-id');
    if (etiquetaUsuarioNombre) {
        const nombre = usuario.name || 'Usuario autenticado';
        etiquetaUsuarioNombre.textContent = `Nombre: ${nombre}`;
    }
    if (etiquetaUsuarioCorreo) {
        const correo = usuario.email || 'Sin correo disponible';
        etiquetaUsuarioCorreo.textContent = `Correo: ${correo}`;
    }
    if (etiquetaUsuarioId) {
        etiquetaUsuarioId.textContent = `ID: ${usuario.id ?? 'N/D'}`;
    }

    const listaTickets = document.getElementById('lista-tickets');
    const detalleTicket = document.getElementById('detalle-ticket');
    const listaUsuarios = document.getElementById('lista-usuarios');
    const formularioCrearUsuario = document.getElementById('form-crear-usuario');
    const btnToggleFormUsuario = document.getElementById('btn-toggle-form-usuario');
    const filtrosTickets = document.getElementById('filtros-tickets');

    let todosLosUsuarios = [];
    let cacheTickets = [];

    function obtenerUsuarioPorId(id) {
        if (!id) return null;
        return todosLosUsuarios.find(user => Number(user.id) === Number(id));
    }

    function obtenerDatosCreador(ticket) {
        const usuarioGestor = obtenerUsuarioPorId(ticket.gestor_id);
        return {
            nombre: usuarioGestor?.name || `Gestor #${ticket.gestor_id || 'N/D'}`,
            correo: usuarioGestor?.email || 'Correo no disponible'
        };
    }

    if (detalleTicket) {
        detalleTicket.innerHTML = '';
    }

    // Cargar datos al iniciar
    cargarTickets();
    cargarUsuarios();
    crearFiltros();
    renderFormularioCrearUsuario();
    configurarToggleFormulario();

    // Crear interfaz de filtros
    function crearFiltros() {
        const html = `
            <div class="filtros-contenedor">
                <h3>Filtros y Búsqueda</h3>
                <div class="filtro-grupo">
                    <label for="buscar-ticket">Buscar (título o descripción):</label>
                    <input type="text" id="buscar-ticket" placeholder="Escribe para buscar...">
                </div>
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
                    <label for="filtro-gestor">Gestor (creador):</label>
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
        
        // Búsqueda en tiempo real (cuando se presiona Enter)
        const buscarInput = document.getElementById('buscar-ticket');
        if (buscarInput) {
            buscarInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    aplicarFiltros();
                }
            });
        }

        // Llenar selectores con usuarios
        cargarUsuariosEnFiltros();
    }

    // Cargar usuarios en los filtros
    function cargarUsuariosEnFiltros() {
        const selectGestor = document.getElementById('filtro-gestor');
        const selectAdmin = document.getElementById('filtro-admin');

        if (!selectGestor || !selectAdmin) {
            return;
        }

        selectGestor.innerHTML = '<option value="">Todos</option>';
        selectAdmin.innerHTML = `
            <option value="">Todos</option>
            <option value="sin_asignar">Sin asignar</option>
        `;

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
        const buscar = document.getElementById('buscar-ticket').value.trim();
        const estado = document.getElementById('filtro-estado').value;
        const gestorId = document.getElementById('filtro-gestor').value;
        const adminId = document.getElementById('filtro-admin').value;

        const params = {};
        if (buscar) params.buscar = buscar;
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
        document.getElementById('buscar-ticket').value = '';
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
        if (!listaTickets) return;
        cacheTickets = Array.isArray(tickets) ? tickets : [];

        if (tickets.length === 0) {
            listaTickets.innerHTML = '<p>No hay tickets que coincidan con los filtros</p>';
            return;
        }

        const html = tickets.map(ticket => {
            const estadoClass = `estado-${ticket.estado}`;
            const fecha = new Date(ticket.created_at).toLocaleDateString('es-ES');
            const descripcionCorta = ticket.descripcion
                ? `${ticket.descripcion.substring(0, 120)}${ticket.descripcion.length > 120 ? '...' : ''}`
                : '';
            const datosCreador = obtenerDatosCreador(ticket);
            
            return `
                <div class="ticket-item" data-id="${ticket.id}">
                    <h3>${ticket.titulo}</h3>
                    <p class="ticket-meta">
                        <span class="estado ${estadoClass}">${ticket.estado}</span>
                        <span class="fecha">${fecha}</span>
                    </p>
                    <p class="ticket-creador">Creado por: ${datosCreador.nombre} (${datosCreador.correo})</p>
                    <p class="ticket-descripcion">${descripcionCorta}</p>
                    <button class="btn-ver-detalle" data-id="${ticket.id}">Ver detalles</button>
                    <div class="ticket-detalle-expandido" id="detalle-ticket-${ticket.id}"></div>
                </div>
            `;
        }).join('');

        listaTickets.innerHTML = html;

        listaTickets.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.currentTarget.getAttribute('data-id');
                toggleDetalleTicket(ticketId, e.currentTarget);
            });
        });
    }

    async function toggleDetalleTicket(ticketId, triggerBtn) {
        const contenedorDetalle = document.getElementById(`detalle-ticket-${ticketId}`);
        const tarjeta = document.querySelector(`.ticket-item[data-id="${ticketId}"]`);

        if (!contenedorDetalle || !tarjeta) {
            return;
        }

        const yaVisible = contenedorDetalle.classList.contains('visible');

        if (yaVisible) {
            cerrarDetalleExpandido(contenedorDetalle, tarjeta, triggerBtn);
            return;
        }

        cerrarOtrosDetalles(ticketId);
        ocultarOtrosTickets(tarjeta);

        contenedorDetalle.classList.add('visible');
        tarjeta.classList.add('abierto');
        contenedorDetalle.innerHTML = '<p class="mensaje info">Cargando detalle...</p>';
        if (triggerBtn) {
            triggerBtn.textContent = 'Ocultar detalles';
        }

        try {
            const resultado = await apiObtenerTicket(ticketId);

            if (resultado.success && resultado.data) {
                renderDetalleTicket(resultado.data, contenedorDetalle, triggerBtn);
            } else {
                contenedorDetalle.innerHTML = '<p class="mensaje error">No se pudo cargar el ticket</p>';
            }
        } catch (error) {
            console.error('Error al cargar detalle:', error);
            contenedorDetalle.innerHTML = '<p class="mensaje error">Error al conectar con el servidor</p>';
        }
    }

    function cerrarOtrosDetalles(ticketIdActivo) {
        document.querySelectorAll('.ticket-detalle-expandido.visible').forEach(detalle => {
            if (detalle.id !== `detalle-ticket-${ticketIdActivo}`) {
                const tarjeta = detalle.closest('.ticket-item');
                const boton = tarjeta ? tarjeta.querySelector('.btn-ver-detalle') : null;
                cerrarDetalleExpandido(detalle, tarjeta, boton);
            }
        });
    }

    function ocultarOtrosTickets(tarjetaSeleccionada) {
        document.querySelectorAll('.ticket-item').forEach(item => {
            if (item !== tarjetaSeleccionada) {
                item.classList.add('oculto');
            }
        });
    }

    function mostrarTodosLosTickets() {
        document.querySelectorAll('.ticket-item').forEach(item => item.classList.remove('oculto', 'abierto'));
        listaTickets.querySelectorAll('.ticket-detalle-expandido').forEach(detalle => {
            detalle.classList.remove('visible');
            detalle.innerHTML = '';
        });
        listaTickets.querySelectorAll('.btn-ver-detalle').forEach(btn => (btn.textContent = 'Ver detalles'));
    }

    function cerrarDetalleExpandido(contenedorDetalle, tarjeta, triggerBtn) {
        contenedorDetalle.classList.remove('visible');
        contenedorDetalle.innerHTML = '';
        if (tarjeta) {
            tarjeta.classList.remove('abierto');
        }
        if (triggerBtn) {
            triggerBtn.textContent = 'Ver detalles';
        }
        mostrarTodosLosTickets();
    }

    function renderDetalleTicket(ticket, contenedorDetalle, triggerBtn = null) {
        const estadoClass = `estado-${ticket.estado}`;
        const fechaCreacion = new Date(ticket.created_at).toLocaleString('es-ES');
        const fechaActualizacion = new Date(ticket.updated_at).toLocaleString('es-ES');
        const datosCreador = obtenerDatosCreador(ticket);

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
            .map(admin => {
                const seleccionado = Number(ticket.admin_id) === Number(admin.id) ? 'selected' : '';
                return `<option value="${admin.id}" ${seleccionado}>${admin.name}</option>`;
            })
            .join('');

        const html = `
            <div class="detalle-ticket-contenido detalle-ticket-inline">
                <h3>${ticket.titulo}</h3>
                <div class="ticket-info">
                    <p><strong>Estado:</strong> <span class="estado ${estadoClass}">${ticket.estado}</span></p>
                    <p><strong>Creado:</strong> ${fechaCreacion}</p>
                    <p><strong>Última actualización:</strong> ${fechaActualizacion}</p>
                    <p><strong>Gestor:</strong> ${datosCreador.nombre} (${datosCreador.correo})</p>
                </div>
                <div class="admin-controls">
                    <h4>Gestión:</h4>
                    <div class="control-grupo">
                        <label>Cambiar estado:</label>
                        <select class="select-cambiar-estado">
                            <option value="abierto" ${ticket.estado === 'abierto' ? 'selected' : ''}>Abierto</option>
                            <option value="en_progreso" ${ticket.estado === 'en_progreso' ? 'selected' : ''}>En Progreso</option>
                            <option value="resuelto" ${ticket.estado === 'resuelto' ? 'selected' : ''}>Resuelto</option>
                            <option value="cerrado" ${ticket.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                        </select>
                        <button class="btn-primario btn-actualizar-estado">Actualizar estado</button>
                    </div>
                    <div class="control-grupo">
                        <label>Asignar a:</label>
                        <select class="select-asignar-admin">
                            <option value="" ${ticket.admin_id ? '' : 'selected'}>Sin asignar</option>
                            ${adminsOptions}
                        </select>
                        <button class="btn-primario btn-asignar">Asignar</button>
                    </div>
                    <p class="mensaje mensaje-gestion" style="display:none;"></p>
                </div>
                <div class="ticket-descripcion-completa">
                    <h4>Descripción:</h4>
                    <p>${ticket.descripcion || 'Sin descripción registrada'}</p>
                </div>
                <div class="ticket-actividades">
                    <h4>Comentarios:</h4>
                    <div class="actividades-lista">${actividadesHtml}</div>
                </div>
                <div class="agregar-comentario">
                    <h4>Agregar comentario:</h4>
                    <textarea class="textarea-comentario" rows="3" placeholder="Escribe tu comentario..."></textarea>
                    <button class="btn-primario btn-agregar-comentario">Agregar comentario</button>
                    <p class="mensaje mensaje-comentario" style="display:none;"></p>
                </div>
                <button class="btn-cerrar-detalle btn-primario">Cerrar vista de detalles</button>
            </div>
        `;

        contenedorDetalle.innerHTML = html;

        const selectEstado = contenedorDetalle.querySelector('.select-cambiar-estado');
        const btnActualizarEstado = contenedorDetalle.querySelector('.btn-actualizar-estado');
        const selectAsignar = contenedorDetalle.querySelector('.select-asignar-admin');
        const btnAsignar = contenedorDetalle.querySelector('.btn-asignar');
        const mensajeGestion = contenedorDetalle.querySelector('.mensaje-gestion');
        const textareaComentario = contenedorDetalle.querySelector('.textarea-comentario');
        const btnAgregarComentario = contenedorDetalle.querySelector('.btn-agregar-comentario');
        const mensajeComentario = contenedorDetalle.querySelector('.mensaje-comentario');
        const btnCerrarDetalle = contenedorDetalle.querySelector('.btn-cerrar-detalle');
        const tarjeta = contenedorDetalle.closest('.ticket-item');


        if (mensajeGestion) {
            mensajeGestion.textContent = '';
            mensajeGestion.style.display = 'none';
        }

        if (mensajeComentario) {
            mensajeComentario.textContent = '';
            mensajeComentario.style.display = 'none';
        }

        if (btnActualizarEstado && selectEstado) {
            btnActualizarEstado.addEventListener('click', async () => {
                try {
                    const resultado = await apiActualizarEstadoTicket(ticket.id, selectEstado.value, usuario.id);

                    if (resultado.success) {
                        mostrarMensaje(mensajeGestion, 'Estado actualizado exitosamente', true);
                        await refrescarDetalleTicket(ticket.id, contenedorDetalle);
                        cargarTickets();
                    } else {
                        mostrarMensaje(mensajeGestion, resultado.message || 'Error al actualizar estado', false);
                    }
                } catch (error) {
                    console.error('Error al actualizar estado:', error);
                    mostrarMensaje(mensajeGestion, 'Error al conectar con el servidor', false);
                }
            });
        }

        if (btnAsignar && selectAsignar) {
            btnAsignar.addEventListener('click', async () => {
                const adminId = selectAsignar.value;

                if (!adminId) {
                    mostrarMensaje(mensajeGestion, 'Selecciona un administrador', false);
                    return;
                }

                const adminOption = selectAsignar.options[selectAsignar.selectedIndex];
                const adminNombre = adminOption ? adminOption.textContent : '';

                try {
                    const resultado = await apiAsignarTicket(ticket.id, adminId, usuario.id, adminNombre);

                    if (resultado.success) {
                        mostrarMensaje(mensajeGestion, 'Ticket asignado exitosamente', true);
                        await refrescarDetalleTicket(ticket.id, contenedorDetalle);
                        cargarTickets();
                    } else {
                        mostrarMensaje(mensajeGestion, resultado.message || 'Error al asignar ticket', false);
                    }
                } catch (error) {
                    console.error('Error al asignar ticket:', error);
                    mostrarMensaje(mensajeGestion, 'Error al conectar con el servidor', false);
                }
            });
        }

        if (btnAgregarComentario && textareaComentario) {
            btnAgregarComentario.addEventListener('click', async () => {
                const mensaje = textareaComentario.value.trim();

                if (!mensaje) {
                    mostrarMensaje(mensajeComentario, 'El comentario no puede estar vacío', false);
                    return;
                }

                try {
                    const resultado = await apiAgregarComentario(ticket.id, mensaje, usuario.id);

                    if (resultado.success) {
                        mostrarMensaje(mensajeComentario, 'Comentario agregado exitosamente', true);
                        textareaComentario.value = '';
                        await refrescarDetalleTicket(ticket.id, contenedorDetalle);
                    } else {
                        mostrarMensaje(mensajeComentario, resultado.message || 'Error al agregar comentario', false);
                    }
                } catch (error) {
                    console.error('Error al agregar comentario:', error);
                    mostrarMensaje(mensajeComentario, 'Error al conectar con el servidor', false);
                }
            });
        }

        if (btnCerrarDetalle) {
            btnCerrarDetalle.addEventListener('click', () => {
                cerrarDetalleExpandido(contenedorDetalle, tarjeta, triggerBtn || (tarjeta ? tarjeta.querySelector('.btn-ver-detalle') : null));
            });
        }
    }

    async function refrescarDetalleTicket(ticketId, contenedorDetalle) {
        if (!contenedorDetalle) return;

        contenedorDetalle.innerHTML = '<p class="mensaje info">Actualizando información...</p>';

        try {
            const resultado = await apiObtenerTicket(ticketId);

            if (resultado.success && resultado.data) {
                renderDetalleTicket(resultado.data, contenedorDetalle);
            } else {
                contenedorDetalle.innerHTML = '<p class="mensaje error">No se pudo actualizar el detalle</p>';
            }
        } catch (error) {
            console.error('Error al refrescar detalle:', error);
            contenedorDetalle.innerHTML = '<p class="mensaje error">Error al conectar con el servidor</p>';
        }
    }

    function mostrarMensaje(elemento, texto, esExito = true) {
        if (!elemento) return;

        elemento.textContent = texto;
        elemento.style.display = 'block';
        elemento.className = `mensaje ${esExito ? 'exito' : 'error'}`;
    }

    // Renderizar formulario de creación de usuarios
    function renderFormularioCrearUsuario() {
        if (!formularioCrearUsuario) return;

        formularioCrearUsuario.innerHTML = `
            <div class="formulario-crear-usuario">
                <h3>Crear nuevo usuario</h3>
                <form id="form-nuevo-usuario">
                    <div class="campo-form">
                        <label for="nuevo-nombre">Nombre completo:</label>
                        <input type="text" id="nuevo-nombre" placeholder="Ej. Juan Pérez" required>
                    </div>
                    <div class="campo-form">
                        <label for="nuevo-email">Correo electrónico:</label>
                        <input type="email" id="nuevo-email" placeholder="usuario@ejemplo.com" required>
                    </div>
                    <div class="campo-form">
                        <label for="nuevo-password">Contraseña temporal:</label>
                        <input type="password" id="nuevo-password" placeholder="Mínimo 6 caracteres" required minlength="6">
                    </div>
                    <div class="campo-form">
                        <label for="nuevo-role">Rol:</label>
                        <select id="nuevo-role" required>
                            <option value="gestor">Gestor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <div class="acciones-form">
                        <button type="submit" class="btn-primario">Crear usuario</button>
                        <button type="reset" class="btn-secundario">Limpiar</button>
                        <button type="button" class="btn-cerrar-form">Cancelar</button>
                    </div>
                    <p id="mensaje-crear-usuario" class="mensaje"></p>
                </form>
            </div>
        `;

        const form = document.getElementById('form-nuevo-usuario');
        const mensajeCrear = document.getElementById('mensaje-crear-usuario');

        if (mensajeCrear) {
            mensajeCrear.textContent = '';
            mensajeCrear.style.display = 'none';
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datos = {
                name: document.getElementById('nuevo-nombre').value.trim(),
                email: document.getElementById('nuevo-email').value.trim(),
                password: document.getElementById('nuevo-password').value.trim(),
                role: document.getElementById('nuevo-role').value
            };

            if (!datos.name || !datos.email || !datos.password) {
                mostrarMensaje(mensajeCrear, 'Todos los campos son obligatorios', false);
                return;
            }

            if (datos.password.length < 6) {
                mostrarMensaje(mensajeCrear, 'La contraseña debe tener al menos 6 caracteres', false);
                return;
            }

            try {
                const resultado = await apiCrearUsuario(datos);

                if (resultado.success) {
                    mostrarMensaje(mensajeCrear, 'Usuario creado exitosamente', true);
                    form.reset();
                    cargarUsuarios();
                } else {
                    mostrarMensaje(mensajeCrear, resultado.message || 'No se pudo crear el usuario', false);
                }
            } catch (error) {
                console.error('Error al crear usuario:', error);
                mostrarMensaje(mensajeCrear, 'Error al conectar con el servidor', false);
            }
        });

        const btnCerrarForm = form.querySelector('.btn-cerrar-form');
        if (btnCerrarForm) {
            btnCerrarForm.addEventListener('click', () => {
                form.reset();
                ocultarFormularioCrearUsuario();
            });
        }
    }

    function configurarToggleFormulario() {
        if (!btnToggleFormUsuario || !formularioCrearUsuario) return;

        btnToggleFormUsuario.addEventListener('click', () => {
            const visible = !formularioCrearUsuario.classList.contains('oculto');
            if (visible) {
                ocultarFormularioCrearUsuario();
            } else {
                mostrarFormularioCrearUsuario();
            }
        });

        ocultarFormularioCrearUsuario();
    }

    function mostrarFormularioCrearUsuario() {
        if (!formularioCrearUsuario || !btnToggleFormUsuario) return;
        formularioCrearUsuario.classList.remove('oculto');
        btnToggleFormUsuario.textContent = 'Cerrar formulario';
    }

    function ocultarFormularioCrearUsuario() {
        if (!formularioCrearUsuario || !btnToggleFormUsuario) return;
        formularioCrearUsuario.classList.add('oculto');
        btnToggleFormUsuario.textContent = 'Crear usuario';
    }

    // Cargar usuarios
    async function cargarUsuarios() {
        try {
            const resultado = await apiListarUsuarios();

            if (resultado.success && resultado.data) {
                todosLosUsuarios = resultado.data;
                mostrarUsuarios(resultado.data);
                cargarUsuariosEnFiltros();
                if (cacheTickets.length > 0) {
                    mostrarTickets(cacheTickets);
                }
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

