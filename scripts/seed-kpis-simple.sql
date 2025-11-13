-- Script SQL para crear datos de prueba para KPIs

-- 1. Insertar configuraciones de KPIs
INSERT INTO kpis (codigo, nombre, descripcion, umbral_min, umbral_max, unidad_medida, activo, created_at, updated_at)
VALUES
  ('TASA_CONVERSION', 'Tasa de Conversión', 'Porcentaje de propiedades vendidas respecto al total', 10.0, 80.0, 'porcentaje', true, NOW(), NOW()),
  ('TIEMPO_PROMEDIO_VENTA', 'Tiempo Promedio de Venta', 'Días promedio desde publicación hasta venta', 30.0, 180.0, 'dias', true, NOW(), NOW()),
  ('VALORIZACION_TOTAL', 'Valorización Total', 'Suma del precio de todas las propiedades activas', 100000000.0, NULL, 'clp', true, NOW(), NOW()),
  ('COMISION_TOTAL_GENERADA', 'Comisión Total Generada', 'Suma de todas las comisiones de ventas', 5000000.0, NULL, 'clp', true, NOW(), NOW()),
  ('COMISION_NETA_AGENCIA', 'Comisión Neta Agencia', 'Comisión total menos split de corredores', 3000000.0, NULL, 'clp', true, NOW(), NOW()),
  ('INDICE_STOCK', 'Índice de Stock', 'Porcentaje de stock actual respecto al objetivo', 50.0, 150.0, 'porcentaje', true, NOW(), NOW())
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    umbral_min = EXCLUDED.umbral_min,
    umbral_max = EXCLUDED.umbral_max,
    unidad_medida = EXCLUDED.unidad_medida,
    activo = EXCLUDED.activo,
    updated_at = NOW();

-- 2. Verificar que existe un modelo de negocio activo
DO $$
DECLARE
  modelo_id INT;
BEGIN
  SELECT id INTO modelo_id FROM modelos_negocio WHERE activo = true LIMIT 1;

  IF modelo_id IS NULL THEN
    RAISE NOTICE 'No hay modelo de negocio activo. Por favor crea uno primero.';
  ELSE
    RAISE NOTICE 'Modelo de negocio encontrado con ID: %', modelo_id;
  END IF;
END $$;

SELECT 'KPIs configurados correctamente!' as resultado;
