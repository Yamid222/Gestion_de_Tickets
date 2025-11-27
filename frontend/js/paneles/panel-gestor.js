// Script para el panel de gestor
// Maneja: crear tickets, listar tickets propios, ver detalles, agregar comentarios

(function() {
    let usuario = null;
    const formCrearTicket = document.getElementById('form-crear-ticket');
    const mensajeTicket = document.getElementById('mensaje-ticket');
    const listaTickets = document.getElementById('lista-tickets');
    const detalleTicket = document.getElementById('detalle-ticket');

    // Inicializar panel cuando el DOM esté listo
    function iniciarPanel() {
        usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        
        // Verificar que el usuario tenga datos
        if (!usuario.id || !usuario.role) {
            console.error('Usuario no encontrado en localStorage:', usuario);
            window.location.href = 'index.html';
            return;
        }
        
        // Verificar que sea gestor
        if (usuario.role !== 'gestor') {
            console.error('Usuario no es gestor:', usuario.role);
            window.location.href = 'index.html';
            return;
        }

        console.log('Usuario cargado:', usuario);

        // Cargar tickets al iniciar
        cargarTickets();

        // Manejar creación de ticket
        if (formCrearTicket) {
            formCrearTicket.addEventListener('submit', async (e) => {
                e.preventDefault();
                mensajeTicket.textContent = '';
                mensajeTicket.className = 'mensaje';

                const titulo = document.getElementById('titulo').value.trim();
                const descripcion = document.getElementById('descripcion').value.trim();

                if (!titulo || !descripcion) {
                    mensajeTicket.textContent = 'Todos los campos son obligatorios';
                    mensajeTicket.className = 'mensaje error';
                    return;
                }

                // Verificar que el usuario tenga ID
                if (!usuario || !usuario.id) {
                    mensajeTicket.textContent = 'Error: No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.';
                    mensajeTicket.className = 'mensaje error';
                    console.error('Usuario sin ID:', usuario);
                    return;
                }

                try {
                    console.log('Creando ticket con datos:', { titulo, descripcion, gestor_id: usuario.id });
                    
                    const resultado = await apiCrearTicket({
                        titulo,
                        descripcion,
                        gestor_id: usuario.id
                    });

                    console.log('Respuesta del servidor:', resultado);

                    if (resultado.success) {
                        mensajeTicket.textContent = 'Ticket creado exitosamente';
                        mensajeTicket.className = 'mensaje exito';
                        formCrearTicket.reset();
                        cargarTickets();
                    } else {
                        mensajeTicket.textContent = resultado.message || 'Error al crear ticket';
                        mensajeTicket.className = 'mensaje error';
                        console.error('Error en la respuesta:', resultado);
                    }
                } catch (error) {
                    console.error('Error al crear ticket:', error);
                    mensajeTicket.textContent = `Error al conectar con el servidor: ${error.message}`;
                    mensajeTicket.className = 'mensaje error';
                }
            });
        }
    }

    // Cargar tickets del gestor
    async function cargarTickets() {
        if (!usuario || !usuario.id) {
            console.error('No se puede cargar tickets: usuario no disponible');
            return;
        }

        try {
            const resultado = await apiListarTickets({
                solo_gestor: true,
                user_id: usuario.id
            });

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
            listaTickets.innerHTML = '<p>No tienes tickets creados</p>';
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

        // Agregar event listeners a los botones
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

    // Mostrar detalle del ticket
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

        // Agregar event listener al botón de comentario
        const btnComentario = document.getElementById('btn-agregar-comentario');
        if (btnComentario) {
            btnComentario.addEventListener('click', async () => {
                const mensaje = document.getElementById('nuevo-comentario').value.trim();
                const mensajeComentario = document.getElementById('mensaje-comentario');

                if (!mensaje) {
                    mensajeComentario.textContent = 'El comentario no puede estar vacío';
                    mensajeComentario.className = 'mensaje error';
                    return;
                }

                if (!usuario || !usuario.id) {
                    mensajeComentario.textContent = 'Error: Usuario no disponible';
                    mensajeComentario.className = 'mensaje error';
                    return;
                }

                try {
                    const resultado = await apiAgregarComentario(ticket.id, mensaje, usuario.id);

                    if (resultado.success) {
                        mensajeComentario.textContent = 'Comentario agregado exitosamente';
                        mensajeComentario.className = 'mensaje exito';
                        document.getElementById('nuevo-comentario').value = '';
                        // Recargar el detalle para mostrar el nuevo comentario
                        verDetalleTicket(ticket.id);
                        // Recargar la lista
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
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarPanel);
    } else {
        iniciarPanel();
    }
})();
