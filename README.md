```bash
# Sistema de Gestión de Tickets
## Requisitos
## Instalación
### 1. Clonar el repositorio
git clone https://github.com/Yamid222/Gestion_de_Tickets.git
cd Gestion_de_Tickets

### 2. Instalar dependencias de Composer

# Microservicio de Usuarios
cd microservicio-usuarios
composer install
cd ..

# Microservicio de Tickets
cd microservicio-tickets
composer install
cd ..


### 3. Configurar la base de datos
### 4. Verificar conexión a base de datos
La conexión está configurada en:
- `microservicio-usuarios/app/configuracion/database.php`
- `microservicio-tickets/app/configuracion/database.php`
**Configuración actual:**
- Host: `127.0.0.1`
- Base de datos: `soporte_tickets`
- Usuario: `root`
- Contraseña: (vacía)
- Puerto: `3306`

## Ejecución

### Opción 1: Usando los scripts .bat (Windows)

# Terminal 1 - Microservicio de Usuarios (Puerto 8000)
start_usuarios.bat
# Terminal 2 - Microservicio de Tickets (Puerto 8001)
start_tickets.bat
### Opción 2: Usando PHP Built-in Server
# Terminal 1 - Microservicio de Usuarios
cd microservicio-usuarios/public
php -S localhost:8000

# Terminal 2 - Microservicio de Tickets
cd microservicio-tickets/public
php -S localhost:8001



- Usuarios: `http://localhost/Gestion_de_Tickets/microservicio-usuarios/public/`
- Tickets: `http://localhost/Gestion_de_Tickets/microservicio-tickets/public/`

# Base de datos sql

-- ============================================
-- CREACIÓN DE BASE DE DATOS
-- ============================================
CREATE DATABASE soporte_tickets;
USE soporte_tickets;

-- ============================================
-- TABLA: users
-- Roles posibles: 'gestor', 'admin'
-- ============================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('gestor', 'admin') NOT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

-- ============================================
-- TABLA: auth_tokens (token de sesión)
-- Se elimina cuando el usuario cierra sesión
-- ============================================
CREATE TABLE auth_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: tickets
-- Estados: 'abierto', 'en_progreso', 'resuelto', 'cerrado'
-- ============================================
CREATE TABLE tickets (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('abierto', 'en_progreso', 'resuelto', 'cerrado') DEFAULT 'abierto',
    gestor_id BIGINT UNSIGNED NOT NULL,
    admin_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (gestor_id) REFERENCES users(id),
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- ============================================
-- TABLA: ticket_actividad
-- Registro cronológico de eventos o comentarios
-- ============================================
CREATE TABLE ticket_actividad (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    mensaje TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================
-- INSERTS DE PRUEBA
-- ============================================

-- Usuarios
INSERT INTO users (name, email, password, role, created_at)
VALUES
('Juan Gestor', 'gestor1@example.com', 'password123', 'gestor', NOW()),
('Ana Gestor', 'gestor2@example.com', 'password123', 'gestor', NOW()),
('Carlos Admin', 'admin1@example.com', 'password123', 'admin', NOW());

-- Tokens (simulados)
INSERT INTO auth_tokens (user_id, token, created_at)
VALUES
(1, 'token_gestor_1_abc123', NOW()),
(3, 'token_admin_1_xyz789', NOW());

-- Tickets
INSERT INTO tickets (titulo, descripcion, estado, gestor_id, admin_id, created_at)
VALUES
('Error al iniciar sesión', 'El usuario no puede iniciar sesión en la app.', 'abierto', 1, 3, NOW()),
('Problema con carga de archivos', 'Los archivos no suben correctamente.', 'en_progreso', 2, 3, NOW());

-- Actividades de tickets
INSERT INTO ticket_actividad (ticket_id, user_id, mensaje, created_at)
VALUES
(1, 1, 'Se reporta el problema y se abre el ticket.', NOW()),
(1, 3, 'Admin toma el ticket para revisión.', NOW()),
(2, 2, 'Reporte inicial del problema con archivos.', NOW()),
(2, 3, 'Admin revisa el módulo de carga.', NOW());
