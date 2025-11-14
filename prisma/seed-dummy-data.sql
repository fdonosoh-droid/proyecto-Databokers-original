-- Script para poblar tablas vacías con datos dummy
-- DATABROKERS - Sistema de Gestión Inmobiliaria

-- Verificar y crear usuarios si la tabla está vacía
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'gestor@databrokers.cl') THEN
        INSERT INTO usuarios (email, password, nombre, apellido, telefono, rol_id, activo)
        VALUES
            ('gestor@databrokers.cl', '$2b$10$YourHashedPassword', 'Carlos', 'Gestión', '+56912345678', (SELECT id FROM roles WHERE codigo = 'GESTOR' LIMIT 1), true),
            ('corredor@databrokers.cl', '$2b$10$YourHashedPassword', 'Ana', 'Ventas', '+56987654321', (SELECT id FROM roles WHERE codigo = 'CORREDOR' LIMIT 1), true),
            ('analista@databrokers.cl', '$2b$10$YourHashedPassword', 'Luis', 'Análisis', '+56911223344', (SELECT id FROM roles WHERE codigo = 'ANALISTA' LIMIT 1), true);
        RAISE NOTICE 'Usuarios dummy creados';
    END IF;
END $$;

-- Verificar y crear modelos de negocio
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM modelos_negocio LIMIT 1) THEN
        INSERT INTO modelos_negocio (codigo, nombre, descripcion, comision_porcentaje, activo)
        VALUES
            ('VENTA_DIRECTA', 'Venta Directa', 'Venta directa de propiedades', 3.00, true),
            ('PREVENTA', 'Preventa', 'Venta de propiedades en construcción', 2.50, true),
            ('CONSIGNACION', 'Consignación', 'Propiedades en consignación', 4.00, true);
        RAISE NOTICE 'Modelos de negocio dummy creados';
    END IF;
END $$;

-- Verificar y crear proyectos
DO $$
DECLARE
    v_comuna_id INT;
    v_region_id INT;
    v_estado_id INT;
    v_modelo_id INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM proyectos LIMIT 1) THEN
        -- Obtener IDs necesarios
        SELECT id INTO v_comuna_id FROM dom_parametros WHERE codigo = 'LAS_CONDES' LIMIT 1;
        SELECT id INTO v_region_id FROM dom_parametros WHERE codigo = 'RM' LIMIT 1;
        SELECT id INTO v_estado_id FROM dom_parametros WHERE codigo LIKE 'PROYECTO%' LIMIT 1;
        SELECT id INTO v_modelo_id FROM modelos_negocio LIMIT 1;

        IF v_comuna_id IS NULL THEN v_comuna_id := 1; END IF;
        IF v_region_id IS NULL THEN v_region_id := 1; END IF;
        IF v_estado_id IS NULL THEN v_estado_id := 1; END IF;
        IF v_modelo_id IS NULL THEN v_modelo_id := 1; END IF;

        INSERT INTO proyectos (nombre, inmobiliaria, direccion, comuna_id, region_id, estado_proyecto_id,
                               fecha_inicio_ventas, fecha_entrega_estimada, total_unidades, unidades_disponibles,
                               descripcion, modelo_negocio_id, activo)
        VALUES
            ('Torres del Sol', 'Inmobiliaria Aconcagua', 'Av. Apoquindo 4500', v_comuna_id, v_region_id, v_estado_id,
             '2024-01-15', '2025-12-31', 120, 85, 'Moderno edificio residencial', v_modelo_id, true),
            ('Parque Central', 'Constructora Mediterránea', 'Av. Kennedy 9000', v_comuna_id, v_region_id, v_estado_id,
             '2024-06-01', '2026-06-30', 80, 80, 'Exclusivo condominio', v_modelo_id, true);
        RAISE NOTICE 'Proyectos dummy creados';
    END IF;
END $$;

-- Verificar y crear propiedades
DO $$
DECLARE
    v_modelo_id INT;
    v_tipo_op_id INT;
    v_tipo_prop_id INT;
    v_clasif_id INT;
    v_estado_id INT;
    v_comuna_id INT;
    v_region_id INT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM propiedades LIMIT 1) THEN
        -- Obtener IDs necesarios desde dom_parametros o usar valores por defecto
        SELECT id INTO v_modelo_id FROM modelos_negocio LIMIT 1;
        SELECT id INTO v_tipo_op_id FROM dom_parametros WHERE codigo LIKE '%VENTA%' LIMIT 1;
        SELECT id INTO v_tipo_prop_id FROM dom_parametros WHERE codigo LIKE '%DEPTO%' OR codigo LIKE '%DEPARTAMENTO%' LIMIT 1;
        SELECT id INTO v_clasif_id FROM dom_parametros WHERE codigo LIKE '%NUEVA%' OR codigo LIKE '%NUEVO%' LIMIT 1;
        SELECT id INTO v_estado_id FROM dom_parametros WHERE codigo LIKE '%DISPONIBLE%' LIMIT 1;
        SELECT id INTO v_comuna_id FROM dom_parametros WHERE codigo = 'PROVIDENCIA' OR codigo = 'LAS_CONDES' LIMIT 1;
        SELECT id INTO v_region_id FROM dom_parametros WHERE codigo = 'RM' OR codigo = 'METROPOLITANA' LIMIT 1;

        -- Valores por defecto si no se encuentran
        IF v_modelo_id IS NULL THEN v_modelo_id := 1; END IF;
        IF v_tipo_op_id IS NULL THEN v_tipo_op_id := 1; END IF;
        IF v_tipo_prop_id IS NULL THEN v_tipo_prop_id := 1; END IF;
        IF v_clasif_id IS NULL THEN v_clasif_id := 1; END IF;
        IF v_estado_id IS NULL THEN v_estado_id := 1; END IF;
        IF v_comuna_id IS NULL THEN v_comuna_id := 1; END IF;
        IF v_region_id IS NULL THEN v_region_id := 1; END IF;

        INSERT INTO propiedades (codigo, modelo_negocio_id, tipo_operacion_id, tipo_propiedad_id, clasificacion_id,
                                estado_propiedad_id, direccion, comuna_id, region_id, superficie_total, superficie_util,
                                dormitorios, banos, estacionamientos, bodegas, precio, titulo, descripcion,
                                comision_porcentaje, comision_monto, fecha_publicacion, activo)
        VALUES
            ('PROP-00001', v_modelo_id, v_tipo_op_id, v_tipo_prop_id, v_clasif_id, v_estado_id,
             'Av. Providencia 1500, Depto 501', v_comuna_id, v_region_id, 85.5, 72.0, 2, 2, 1, 1,
             4500000000, 'Moderno departamento en Providencia', 'Hermoso departamento con vista panorámica',
             3.0, 135000000, '2024-01-10', true),
            ('PROP-00002', v_modelo_id, v_tipo_op_id, v_tipo_prop_id, v_clasif_id, v_estado_id,
             'Los Robles 234', v_comuna_id, v_region_id, 180.0, 150.0, 4, 3, 2, 1,
             9800000000, 'Amplia casa en sector exclusivo', 'Casa con jardín y piscina',
             3.0, 294000000, '2024-02-01', true),
            ('PROP-00003', v_modelo_id, v_tipo_op_id, v_tipo_prop_id, v_clasif_id, v_estado_id,
             'Av. Vitacura 3500, Depto 802', v_comuna_id, v_region_id, 95.0, 80.0, 3, 2, 2, 1,
             6200000000, 'Departamento premium en Vitacura', 'Departamento de lujo',
             4.0, 248000000, '2024-01-20', true),
            ('PROP-00004', v_modelo_id, v_tipo_op_id, v_tipo_prop_id, v_clasif_id, v_estado_id,
             'Av. Larraín 5000, Depto 1205', v_comuna_id, v_region_id, 78.0, 65.0, 2, 2, 1, 1,
             3800000000, 'Departamento luminoso', 'Excelente ubicación',
             3.0, 114000000, '2024-03-01', true),
            ('PROP-00005', v_modelo_id, v_tipo_op_id, v_tipo_prop_id, v_clasif_id, v_estado_id,
             'Los Militares 6000', v_comuna_id, v_region_id, 220.0, 180.0, 5, 4, 3, 2,
             15000000000, 'Casa de lujo', 'Amplia casa con todas las comodidades',
             3.5, 525000000, '2024-02-15', true);
        RAISE NOTICE 'Propiedades dummy creadas';
    END IF;
END $$;

-- Verificar y crear canjes si la tabla existe y está vacía
DO $$
DECLARE
    v_modelo_id INT;
    v_estado_id INT;
    v_prop_id INT;
    v_gestor_id INT;
    table_exists BOOLEAN;
BEGIN
    -- Verificar si la tabla existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'canjes'
    ) INTO table_exists;

    IF table_exists THEN
        IF NOT EXISTS (SELECT 1 FROM canjes LIMIT 1) THEN
            SELECT id INTO v_modelo_id FROM modelos_negocio LIMIT 1;
            SELECT id INTO v_estado_id FROM dom_parametros WHERE codigo LIKE '%CANJE%' OR codigo LIKE '%INICIADO%' LIMIT 1;
            SELECT id INTO v_prop_id FROM propiedades LIMIT 1;
            SELECT id INTO v_gestor_id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE codigo = 'GESTOR' LIMIT 1) LIMIT 1;

            IF v_modelo_id IS NULL THEN v_modelo_id := 1; END IF;
            IF v_estado_id IS NULL THEN v_estado_id := 1; END IF;
            IF v_prop_id IS NULL THEN v_prop_id := 1; END IF;
            IF v_gestor_id IS NULL THEN v_gestor_id := 1; END IF;

            INSERT INTO canjes (codigo, modelo_negocio_id, estado_canje_id, propiedad_entregada_id,
                              valor_tasacion_entregada, propiedad_recibida_id, valor_tasacion_recibida,
                              fecha_inicio, fecha_vencimiento, observaciones, gestor_id, activo)
            VALUES
                ('CANJE-00001', v_modelo_id, v_estado_id, v_prop_id, 3800000000, v_prop_id + 1, 4500000000,
                 '2024-03-01', '2024-09-01', 'Canje de departamento usado por uno nuevo', v_gestor_id, true);
            RAISE NOTICE 'Canjes dummy creados';
        END IF;
    END IF;
END $$;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '✅ Seed de datos dummy completado';
    RAISE NOTICE 'Verifica las tablas para confirmar los datos insertados';
END $$;
