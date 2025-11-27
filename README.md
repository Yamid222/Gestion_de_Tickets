# Sistema de Gestión de Tickets

Sistema de gestión de tickets basado en arquitectura de microservicios.

## Estructura del Proyecto

```
Gestion_de_Tickets/
├── frontend/                    # Frontend HTML/CSS/JavaScript
├── microservicio-usuarios/     # Microservicio de gestión de usuarios
│   ├── app/
│   │   ├── controladores/      # Controladores de la API
│   │   ├── modelos/            # Modelos Eloquent
│   │   ├── middleware/         # Middleware de autenticación
│   │   ├── rutas/             # Definición de rutas
│   │   └── configuracion/     # Configuración de BD
│   ├── migraciones/           # Scripts SQL de migración
│   └── public/                # Punto de entrada (index.php)
├── microservicio-tickets/      # Microservicio de gestión de tickets
│   ├── app/
│   │   ├── controladores/     # Controladores de la API
│   │   ├── modelos/           # Modelos Eloquent
│   │   ├── middleware/        # Middleware de autenticación
│   │   ├── rutas/            # Definición de rutas
│   │   └── configuracion/    # Configuración de BD
│   ├── migraciones/          # Scripts SQL de migración
│   └── public/               # Punto de entrada (index.php)
└── README.md
```

## Requisitos

- PHP 7.4 o superior
- MySQL 5.7 o superior
- Composer
- Servidor web (Apache/Nginx) o PHP Built-in Server

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Gestion_de_Tickets
```

### 2. Instalar dependencias de Composer

```bash
# Microservicio de Usuarios
cd microservicio-usuarios
composer install
cd ..

# Microservicio de Tickets
cd microservicio-tickets
composer install
cd ..
```

### 3. Configurar la base de datos

La base de datos ya está configurada y contiene las siguientes tablas:
- `users` - Usuarios del sistema (gestores y administradores)
- `auth_tokens` - Tokens de autenticación
- `tickets` - Tickets de soporte
- `ticket_actividad` - Actividades y comentarios de tickets

**Nota importante sobre contraseñas:**
Si insertaste usuarios directamente en la BD con contraseñas en texto plano, ejecuta el script:
```bash
php fix_passwords.php
```

Este script hasheará las contraseñas para que funcionen correctamente con el sistema de autenticación.

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

Si necesitas cambiar la configuración, edita estos archivos.

**Probar la conexión:**
```bash
php test_connection.php
```

## Ejecución

### Opción 1: Usando los scripts .bat (Windows)

```bash
# Terminal 1 - Microservicio de Usuarios (Puerto 8000)
start_usuarios.bat

# Terminal 2 - Microservicio de Tickets (Puerto 8001)
start_tickets.bat
```

### Opción 2: Usando PHP Built-in Server

```bash
# Terminal 1 - Microservicio de Usuarios
cd microservicio-usuarios/public
php -S localhost:8000

# Terminal 2 - Microservicio de Tickets
cd microservicio-tickets/public
php -S localhost:8001
```

### Opción 3: Usando XAMPP/Apache

Configurar los virtual hosts o acceder directamente:
- Usuarios: `http://localhost/Gestion_de_Tickets/microservicio-usuarios/public/`
- Tickets: `http://localhost/Gestion_de_Tickets/microservicio-tickets/public/`

## Endpoints de la API

### Microservicio de Usuarios (Puerto 8000)

#### Autenticación
- `POST /api/auth/registro` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/validate-token` - Validar token

#### Usuarios (Requiere autenticación y rol admin)
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/{id}` - Obtener usuario
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Eliminar usuario

### Microservicio de Tickets (Puerto 8001)

#### Tickets (Requiere autenticación)
- `POST /api/tickets` - Crear ticket (gestor/admin)
- `GET /api/tickets` - Listar tickets (gestor/admin)
- `GET /api/tickets/{id}` - Obtener ticket (gestor/admin)
- `PUT /api/tickets/{id}/estado` - Actualizar estado (admin)
- `PUT /api/tickets/{id}/asignar` - Asignar ticket (admin)
- `POST /api/tickets/{id}/comentarios` - Agregar comentario (gestor/admin)

## Roles

- **gestor**: Puede crear y ver tickets, agregar comentarios
- **admin**: Puede hacer todo lo que un gestor, además de gestionar usuarios, estados y asignaciones

## Estructura de Base de Datos

### Tabla: users
- id, name, email, password, role, created_at, updated_at

### Tabla: auth_tokens
- id, user_id, token, created_at, updated_at

### Tabla: tickets
- id, titulo, descripcion, estado, gestor_id, admin_id, created_at, updated_at

### Tabla: ticket_actividad
- id, ticket_id, user_id, mensaje, created_at, updated_at

## Tecnologías Utilizadas

- **Backend**: PHP 7.4+
- **Framework**: Slim 4
- **ORM**: Illuminate Database (Eloquent)
- **Base de Datos**: MySQL
- **Frontend**: HTML, CSS, JavaScript vanilla

## Notas

- Los microservicios se comunican mediante HTTP para validar tokens
- El microservicio de tickets valida tokens llamando al microservicio de usuarios
- Asegúrate de que ambos microservicios estén ejecutándose para que la autenticación funcione correctamente
