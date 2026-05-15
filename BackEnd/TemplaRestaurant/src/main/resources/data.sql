-- ====================================================
-- LIMPIEZA DE TABLAS (solo para desarrollo)
-- ====================================================
--SET FOREIGN_KEY_CHECKS = 0;
--TRUNCATE TABLE usuarios;
--TRUNCATE TABLE personas;
--TRUNCATE TABLE productos;
--TRUNCATE TABLE platos_Detalle;
--TRUNCATE TABLE platos;
--TRUNCATE TABLE mesas;
--TRUNCATE TABLE disponibilidades;
--TRUNCATE TABLE reservas;
--SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- INSERTAR PERSONAS
-- ====================================================

-- Insertar persona administrador
INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Admin', 'Sistema', 'admin@gmail.com', '0000000000', 99999999, 'PERSONAL', NOW(), 0, NULL, NULL);

INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Mateo', 'Moszoro', 'mateomoszoro@gmail.com', '1111111111', 12345678, 'CLIENTE', NOW(), 0, NULL, NULL);

INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Facundo', 'Ruiz', 'facuruiz@gmail.com', '2222222222', 87654321, 'CLIENTE', NOW(), 0, NULL, NULL);

-- Insertar usuario administrador con password ENCRIPTADA
INSERT INTO usuarios (username, password, rol, activo, id_persona)
VALUES ('admin','$2a$10$NewaJBkpaQZu/1xsTnpAqOr5nSnIbmVAV0IqPq6kP/SDtfeQJ83Xy', 'ADMINISTRADOR', true, 1);

-- ============================================
-- PERSONAS DEL PERSONAL (empleados)
-- ============================================

-- Mozo
INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Juan', 'Pérez', 'mozo@gmail.com', '3333333333', 11111111, 'PERSONAL', NOW(), 1, NULL, NULL);

-- Cocina
INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('María', 'González', 'cocina@gmail.com', '4444444444', 22222222, 'PERSONAL', NOW(), 1, NULL, NULL);

-- Encargado
INSERT INTO personas (nombre, apellido, email, telefono, dni, tipo_persona, fecha_alta, user_alta, fecha_baja, user_baja_id)
VALUES ('Carlos', 'Rodríguez', 'encargado@gmail.com', '5555555555', 33333333, 'PERSONAL', NOW(), 1, NULL, NULL);

-- ============================================
-- USUARIOS POR ROL
-- ============================================

-- Usuario MOZO (persona_id = 4)
INSERT INTO usuarios (username, password, rol, activo, id_persona)
VALUES ('mozo', '$2a$10$NewaJBkpaQZu/1xsTnpAqOr5nSnIbmVAV0IqPq6kP/SDtfeQJ83Xy', 'MOZO', true, 4);

-- Usuario COCINA (persona_id = 5)
INSERT INTO usuarios (username, password, rol, activo, id_persona)
VALUES ('cocina', '$2a$10$NewaJBkpaQZu/1xsTnpAqOr5nSnIbmVAV0IqPq6kP/SDtfeQJ83Xy', 'COCINA', true, 5);

-- Usuario ENCARGADO (persona_id = 6)
INSERT INTO usuarios (username, password, rol, activo, id_persona)
VALUES ('encargado', '$2a$10$NewaJBkpaQZu/1xsTnpAqOr5nSnIbmVAV0IqPq6kP/SDtfeQJ83Xy', 'ENCARGADO', true, 6);

-- ====================================================
-- PRODUCTOS
-- ====================================================

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo,precio)
VALUES ('Harina de Trigo', 'INSUMO', 'KILOGRAMO', 50.0, 10.0, 100.0, true,0);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo,precio)
VALUES ('Papas Fritas', 'ACOMPAÑANTE', 'UNIDAD', 30.0, 5.0, 50.0, true,2000);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo,precio)
VALUES ('Coca Cola', 'BEBIDA', 'LITRO', 40.0, 10.0, 100.0, true,3000);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo, precio)
VALUES ('Carne de Res', 'INSUMO', 'KILOGRAMO', 25.0, 5.0, 50.0, true, 8000);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo, precio)
VALUES ('Queso Muzzarella', 'INSUMO', 'KILOGRAMO', 15.0, 3.0, 30.0, true, 5000);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo, precio)
VALUES ('Tomate', 'INSUMO', 'KILOGRAMO', 20.0, 5.0, 40.0, true, 1500);

INSERT INTO productos (nombre, tipo, unidad_medida, stock_actual, stock_minimo, stock_maximo, activo, precio)
VALUES ('Pan de Hamburguesa', 'INSUMO', 'UNIDAD', 50.0, 10.0, 100.0, true, 800);

-- ====================================================
-- PLATOS
-- ====================================================

INSERT INTO platos (nombre, descripcion, precio, descuento, disponible, tipo_plato, foto, fecha_alta, user_alta, fecha_baja, user_baja)
VALUES ('Milanesa Napolitana', 'Milanesa de ternera con salsa de tomate, jamón y queso gratinado.',
        10000.00, 7500.00, TRUE, 'PRINCIPAL',
        'https://templarestaurante.s3.us-east-1.amazonaws.com/platos/5f783b1e-7422-44ac-8252-959cb9cfc158_WhatsApp+Image+2025-10-12+at+8.29.48+PM.jpeg',
        NOW(), 1, NULL, NULL);

INSERT INTO platos (nombre, descripcion, precio, descuento, disponible, tipo_plato, foto, fecha_alta, user_alta, fecha_baja, user_baja)
VALUES ('Hamburguesa Completa', 'Hamburguesa de carne con queso, tomate y papas fritas.',
        8500.00, 7000.00, TRUE, 'PRINCIPAL',
        'https://templarestaurante.s3.us-east-1.amazonaws.com/platos/aa871198-377e-4fa7-945a-e28db3e532c4_WhatsApp Image 2025-10-12 at 8.28.20 PM.jpeg',
        NOW(), 1, NULL, NULL);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (1, 1, 0.2);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (2, 4, 0.15);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (2, 5, 0.05);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (2, 6, 0.1);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (2, 7, 1.0);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (2, 2, 1.0);

INSERT INTO platos_Detalle (id_plato, id_producto, cantidad)
VALUES (2, 1, 0.05);

-- ====================================================
-- MESAS
-- ====================================================

INSERT INTO mesas (numero_mesa, estado_mesa)
VALUES ('2', 'DISPONIBLE');

INSERT INTO mesas (numero_mesa, estado_mesa)
VALUES ('3', 'DISPONIBLE');

INSERT INTO mesas (numero_mesa, estado_mesa)
VALUES ('4', 'DISPONIBLE');

-- ====================================================
-- DISPONIBILIDADES
-- ====================================================

INSERT INTO disponibilidades (fecha, cupos_ocupados, cupos_maximos, activo)
VALUES (NOW(), 20, 30, true);

-- Disponibilidades para los próximos 30 días (versión MySQL)
INSERT INTO disponibilidades (fecha, cupos_ocupados, cupos_maximos, activo)
VALUES
    (CURRENT_DATE, 0, 30, true),
    (DATEADD('DAY', 1, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 2, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 3, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 4, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 5, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 6, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 7, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 8, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 9, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 10, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 11, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 12, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 13, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 14, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 15, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 16, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 17, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 18, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 19, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 20, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 21, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 22, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 23, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 24, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 25, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 26, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 27, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 28, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 29, CURRENT_DATE), 0, 30, true),
    (DATEADD('DAY', 30, CURRENT_DATE), 0, 30, true);