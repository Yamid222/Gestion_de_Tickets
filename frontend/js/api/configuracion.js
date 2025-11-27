// Configuración global de endpoints de los microservicios
// Estas variables quedan disponibles en window para cualquier script del frontend

window.API_USUARIOS = "http://localhost:8000";   // Microservicio de usuarios
window.API_TICKETS  = "http://localhost:8001";   // Microservicio de tickets

// Alias usados por otros scripts (por compatibilidad)
window.BASE_URL_USUARIOS = window.API_USUARIOS;
window.BASE_URL_TICKETS  = window.API_TICKETS;