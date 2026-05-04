# 🍽️ PS2025_TemplaRestaurante

Sistema de gestión integral para restaurantes desarrollado con Angular 18 y Spring Boot, que incluye procesamiento de pagos con Mercado Pago y visualización de datos con Google Charts.

## 📋 Descripción

TemplaRestaurante es una aplicación web full-stack diseñada para la gestión completa de restaurantes. Ofrece funcionalidades para la administración de menús, gestión de pedidos, sistema de reservas, procesamiento de pagos y análisis de datos mediante gráficos interactivos.

## ✨ Características

- 🔐 Sistema de autenticación y autorización con JWT
- 🍴 Gestión completa de menús y platillos
- 🛒 Sistema de pedidos en línea
- 💳 Integración con Mercado Pago para procesamiento de pagos
- 📊 Dashboard con estadísticas y gráficos interactivos (Google Charts)
- 👥 Gestión de usuarios y roles (Admin, Cliente, Personal, Mozo, Cocina, Encargado)
- 📅 Sistema de reservas de mesas
- 📱 Diseño responsive y moderno
- 🔒 Endpoints seguros con Spring Security
- ✅ Alta cobertura de tests unitarios

## 🚀 Tecnologías Utilizadas

### Frontend
- **Angular 18** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Google Charts** - Visualización de datos y estadísticas
- **HTML5/CSS3** - Maquetado y estilos
- **RxJS** - Programación reactiva

### Backend
- **Java** - Lenguaje de programación
- **Spring Boot** - Framework principal
- **Spring Security** - Seguridad y autenticación
- **JWT (JSON Web Tokens)** - Autenticación y autorización
- **Spring Data JPA** - Persistencia de datos
- **MySQL** - Base de datos relacional

### Testing
- **JUnit** - Tests unitarios
- **Mockito** - Mocking de dependencias

### APIs Externas
- **Mercado Pago API** - Procesamiento de pagos

## 📦 Requisitos Previos

- **Node.js** (v18 o superior)
- **npm** o **yarn**
- **Angular CLI** (v18)
- **Java JDK** (v17 o superior)
- **Maven** (v3.6 o superior)
- **MySQL** (v8.0 o superior)
- Cuenta de **Mercado Pago** (para credenciales de API)

### 2. Configuración de la Base de Datos

Ejecuta el script SQL incluido en el proyecto:

```bash
# El archivo data.sql contiene la estructura inicial de la base de datos
mysql -u tu_usuario -p < BackEnd/TemplaRestaurant/src/main/resources/data.sql
```

O crea la base de datos manualmente:

```sql
CREATE DATABASE restaurante_db;
```

Configura las credenciales en `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/restaurante_db
spring.datasource.username=tu_usuario
spring.datasource.password=tu_contraseña
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### 3. Configuración del Backend

```bash
cd BackEnd/TemplaRestaurant
```

Configura las variables de entorno en `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080

# JWT Configuration
jwt.secret=tu_clave_secreta_jwt
jwt.expiration=86400000

# Mercado Pago Configuration
mercadopago.access.token=tu_access_token_de_mercadopago
mercadopago.public.key=tu_public_key_de_mercadopago
```

Compila y ejecuta el proyecto:

```bash
mvn clean install
mvn spring-boot:run
```

El backend estará disponible en `http://localhost:8080`

### 4. Configuración del Frontend

```bash
cd TEMPLAFRONT
```

Instala las dependencias:

```bash
npm install
```

Configura las variables de entorno en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  mercadoPagoPublicKey: 'tu_public_key_de_mercadopago'
};
```

Ejecuta la aplicación:

```bash
ng serve
```

El frontend estará disponible en `http://localhost:4200`

## 📁 Estructura del Proyecto

```
PS2025_TemplaRestaurante/
│
├── BackEnd/
│   └── TemplaRestaurant/
│       ├── .mvn/                        # Maven Wrapper
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/
│       │   │   │   └── Templa.Tesis.App/
│       │   │   │       ├── Auth/               # Autenticación y seguridad
│       │   │   │       ├── configs/            # Configuraciones de Spring
│       │   │   │       ├── controllers/        # Controladores REST
│       │   │   │       ├── dtos/               # Data Transfer Objects
│       │   │   │       ├── entities/           # Entidades JPA
│       │   │   │       ├── Enums/              # Enumeraciones
│       │   │   │       ├── exceptions/         # Manejo de excepciones
│       │   │   │       ├── Jwt/                # Utilidades JWT
│       │   │   │       ├── repositories/       # Repositorios JPA
│       │   │   │       ├── resources/          # Recursos estáticos
│       │   │   │       ├── services/           # Lógica de negocio
│       │   │   │       └── Application.java    # Clase principal
│       │   │   └── resources/
│       │   │       ├── static/                 # Archivos estáticos
│       │   │       ├── application.properties  # Configuración principal
│       │   │       └── data.sql                # Script de inicialización
│       │   └── test/
│       │       └── java/
│       │           └── Templa.Tesis.App/
│       │               ���── services.impl/      # Tests de servicios
│       │               └── Application.java    # Tests de aplicación
│       └── pom.xml                             # Dependencias Maven
│
├── TEMPLAFRONT/
│   ├── .angular/                       # Cache de Angular
│   ├── .vscode/                        # Configuración de VSCode
│   ├── node_modules/                   # Dependencias npm
│   ├── public/                         # Recursos públicos
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/             # Componentes Angular
│   │   │   ├── guards/                 # Guards de rutas
│   │   │   ├── services/               # Servicios HTTP y lógica
│   │   │   ├── app.component.css       # Estilos del componente raíz
│   │   │   ├── app.component.html      # Template del componente raíz
│   │   │   ├── app.component.spec.ts   # Tests del componente raíz
│   │   │   ├── app.component.ts        # Componente raíz
│   │   │   ├── app.config.ts           # Configuración de la app
│   │   │   └── app.routes.ts           # Definición de rutas
│   │   ├── assets/                     # Recursos estáticos (imágenes, etc)
│   │   ├── environments/               # Configuraciones de entorno
│   │   ├── index.html                  # HTML principal
│   │   ├── main.ts                     # Punto de entrada
│   │   └── styles.css                  # Estilos globales
│   ├── .editorconfig                   # Configuración del editor
│   ├── .gitignore                      # Archivos ignorados por Git
│   ├── angular.json                    # Configuración de Angular
│   ├── MAPA_MESAS_README.md           # Documentación del mapa de mesas
│   ├── package-lock.json               # Lock de dependencias
│   ├── package.json                    # Dependencias y scripts npm
│   ├── README.md                       # Documentación del frontend
│   ├── SSE_BACKEND_CONFIG.md          # Configuración SSE Backend
│   └── SSE_INTEGRATION_BACKEND.md     # Integración SSE
│
└── README.md                           # Este archivo
```

## 🔑 Funcionalidades Principales

### Autenticación y Autorización (Auth/)
- Registro de usuarios con validación
- Login con JWT tokens
- Refresh tokens para sesiones prolongadas
- Recuperación de contraseña
- Roles y permisos (ADMIN, USER, STAFF)
- Middleware de autorización

## Gestión de Platos
- CRUD completo de platos del menú
- Gestión de ingredientes y alérgenos
- Control de disponibilidad en tiempo real
- Categorización por tipo (Entrada, Principal, Postre, Bebida, etc.)
- Gestión de precios y promociones
- Carga y almacenamiento de imágenes
- Búsqueda y filtrado avanzado
- Control de stock y disponibilidad
- Descripción detallada y información nutricional

### Gestión de Menú
- CRUD completo de menus
- Categorías de productos
- Gestión de precios y disponibilidad
- Búsqueda y filtrado

### Sistema de Pedidos
- Carrito de compras interactivo
- Procesamiento de órdenes en tiempo real
- Historial de pedidos
- Estados de pedido (Pendiente, En preparación, Listo, Entregado)
- Notificaciones de estado

### Pagos (Mercado Pago)
- Integración completa con Mercado Pago
- Múltiples métodos de pago
- Confirmación automática de pagos
- Webhooks para actualización de estados
- Historial de transacciones

### Dashboard y Reportes (Google Charts)
- Gráficos de ventas en tiempo real
- Estadísticas de productos más vendidos
- Análisis de ingresos por período
- Visualización de tendencias
- Reportes exportables

### Sistema de Reservas de Mesas
- Mapa interactivo de mesas (ver `MAPA_MESAS_README.md`)
- Reserva de mesas con selección visual
- Gestión de horarios y disponibilidad
- Confirmación automática de reservas
- Notificaciones al cliente

### Server-Sent Events (SSE)
- Actualizaciones en tiempo real (ver `SSE_BACKEND_CONFIG.md` y `SSE_INTEGRATION_BACKEND.md`)
- Notificaciones push al frontend
- Sincronización de estados de pedidos
- Actualizaciones del dashboard sin recargar

## 🔐 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración configurable
- **BCrypt**: Encriptación de contraseñas con salt
- **Spring Security**: Protección de endpoints
- **CORS**: Configuración para peticiones cross-origin
- **Validación de datos**: En frontend y backend
- **Sanitización de inputs**: Prevención de inyecciones
- **Exception Handling**: Manejo centralizado de errores
- **Guards de Angular**: Protección de rutas en el frontend

## 👤 Autor

**Facundo Nicolas Ruiz**
- GitHub: [@FacuRuizz1](https://github.com/FacuRuizz1)
- Legajo: 114318

**Mateo Moszoro Leszek**
- GitHub: [@114264MoszoroMateo](https://github.com/114264MoszoroMateo)
- Legajo: 114264

## 🏫 Proyecto Académico

Este proyecto fue desarrollado como parte de la materia **Practica Profesional** de la carrera de **Tecnicatura en Programacion** de la Facultad **Universidad Tecnologica Nacional Facultad Regional Cordoba**.
