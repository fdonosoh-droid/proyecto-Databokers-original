/**
 * Script para crear datos de prueba mínimos
 * Ejecutar: npx ts-node seed-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Iniciando seed de datos...\n');

    // =====================================================
    // 1. MODELOS DE NEGOCIO
    // =====================================================
    console.log('📊 Creando modelos de negocio...');

    const modeloVentaDirecta = await prisma.modelos_negocio.upsert({
      where: { codigo: 'VENTA_DIRECTA' },
      update: {},
      create: {
        codigo: 'VENTA_DIRECTA',
        nombre: 'Venta Directa',
        descripcion: 'Venta tradicional de propiedades',
        comision_porcentaje: 2.5,
        activo: true,
      },
    });

    await prisma.modelos_negocio.upsert({
      where: { codigo: 'CANJE' },
      update: {},
      create: {
        codigo: 'CANJE',
        nombre: 'Canje/Permuta',
        descripcion: 'Intercambio de propiedades',
        comision_porcentaje: 2.0,
        activo: true,
      },
    });

    await prisma.modelos_negocio.upsert({
      where: { codigo: 'CORRETAJE' },
      update: {},
      create: {
        codigo: 'CORRETAJE',
        nombre: 'Corretaje Externo',
        descripcion: 'Venta a través de corredores externos',
        comision_porcentaje: 1.5,
        activo: true,
      },
    });

    console.log('✅ Modelos de negocio creados');

    // =====================================================
    // 2. CATEGORÍAS DE DOMINIO
    // =====================================================
    console.log('\n📋 Creando categorías de dominio...');

    const catTipoPropiedad = await prisma.dom_categorias.upsert({
      where: { codigo: 'TIPO_PROPIEDAD' },
      update: {},
      create: {
        codigo: 'TIPO_PROPIEDAD',
        nombre: 'Tipos de Propiedad',
        descripcion: 'Clasificación de tipos de propiedades',
        activo: true,
      },
    });

    const catEstadoPropiedad = await prisma.dom_categorias.upsert({
      where: { codigo: 'ESTADO_PROPIEDAD' },
      update: {},
      create: {
        codigo: 'ESTADO_PROPIEDAD',
        nombre: 'Estados de Propiedad',
        descripcion: 'Estados del ciclo de vida de una propiedad',
        activo: true,
      },
    });

    const catRegion = await prisma.dom_categorias.upsert({
      where: { codigo: 'REGION' },
      update: {},
      create: {
        codigo: 'REGION',
        nombre: 'Regiones',
        descripcion: 'Regiones de Chile',
        activo: true,
      },
    });

    console.log('✅ Categorías creadas');

    // =====================================================
    // 3. PARÁMETROS DE DOMINIO
    // =====================================================
    console.log('\n🏷️  Creando parámetros...');

    // Tipos de Propiedad
    await prisma.dom_parametros.upsert({
      where: { categoria_id_codigo: { categoria_id: catTipoPropiedad.id, codigo: 'DEPARTAMENTO' } },
      update: {},
      create: {
        categoria_id: catTipoPropiedad.id,
        codigo: 'DEPARTAMENTO',
        nombre: 'Departamento',
        orden: 1,
        activo: true,
      },
    });

    await prisma.dom_parametros.upsert({
      where: { categoria_id_codigo: { categoria_id: catTipoPropiedad.id, codigo: 'CASA' } },
      update: {},
      create: {
        categoria_id: catTipoPropiedad.id,
        codigo: 'CASA',
        nombre: 'Casa',
        orden: 2,
        activo: true,
      },
    });

    await prisma.dom_parametros.upsert({
      where: { categoria_id_codigo: { categoria_id: catTipoPropiedad.id, codigo: 'OFICINA' } },
      update: {},
      create: {
        categoria_id: catTipoPropiedad.id,
        codigo: 'OFICINA',
        nombre: 'Oficina',
        orden: 3,
        activo: true,
      },
    });

    // Estados de Propiedad
    await prisma.dom_parametros.upsert({
      where: { categoria_id_codigo: { categoria_id: catEstadoPropiedad.id, codigo: 'DISPONIBLE' } },
      update: {},
      create: {
        categoria_id: catEstadoPropiedad.id,
        codigo: 'DISPONIBLE',
        nombre: 'Disponible',
        orden: 1,
        activo: true,
      },
    });

    await prisma.dom_parametros.upsert({
      where: { categoria_id_codigo: { categoria_id: catEstadoPropiedad.id, codigo: 'RESERVADA' } },
      update: {},
      create: {
        categoria_id: catEstadoPropiedad.id,
        codigo: 'RESERVADA',
        nombre: 'Reservada',
        orden: 2,
        activo: true,
      },
    });

    await prisma.dom_parametros.upsert({
      where: { categoria_id_codigo: { categoria_id: catEstadoPropiedad.id, codigo: 'VENDIDA' } },
      update: {},
      create: {
        categoria_id: catEstadoPropiedad.id,
        codigo: 'VENDIDA',
        nombre: 'Vendida',
        orden: 3,
        activo: true,
      },
    });

    // Región Metropolitana
    await prisma.dom_parametros.upsert({
      where: { categoria_id_codigo: { categoria_id: catRegion.id, codigo: 'RM' } },
      update: {},
      create: {
        categoria_id: catRegion.id,
        codigo: 'RM',
        nombre: 'Región Metropolitana',
        orden: 13,
        activo: true,
      },
    });

    console.log('✅ Parámetros creados');

    // =====================================================
    // 4. OBTENER IDs DE PARÁMETROS
    // =====================================================
    const tipoDepartamento = await prisma.dom_parametros.findFirst({
      where: { codigo: 'DEPARTAMENTO' },
    });

    const estadoDisponible = await prisma.dom_parametros.findFirst({
      where: { codigo: 'DISPONIBLE' },
    });

    const regionRM = await prisma.dom_parametros.findFirst({
      where: { codigo: 'RM' },
    });

    // =====================================================
    // 5. PROYECTOS
    // =====================================================
    console.log('\n🏗️  Creando proyecto de ejemplo...');

    await prisma.proyectos.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'Torres del Parque',
        inmobiliaria: 'Inmobiliaria Ejemplo S.A.',
        direccion: 'Av. Providencia 1234',
        comuna_id: 1,
        region_id: regionRM!.id,
        estado_proyecto_id: 1,
        fecha_inicio_ventas: new Date('2025-01-01'),
        fecha_entrega_estimada: new Date('2026-06-30'),
        total_unidades: 120,
        unidades_disponibles: 95,
        descripcion: 'Proyecto de departamentos modernos en el corazón de Providencia',
        modelo_negocio_id: modeloVentaDirecta.id,
        activo: true,
      },
    });

    console.log('✅ Proyecto creado');

    // =====================================================
    // 6. PROPIEDADES
    // =====================================================
    console.log('\n🏠 Creando propiedades de ejemplo...');

    await prisma.propiedades.create({
      data: {
        codigo: 'PROP-000001',
        titulo: 'Departamento 2D+1B - Torres del Parque',
        descripcion: 'Hermoso departamento de 2 dormitorios y 1 baño con vista al parque',
        tipo_propiedad_id: tipoDepartamento!.id,
        direccion: 'Av. Providencia 1234, Depto 505',
        comuna_id: 1,
        region_id: regionRM!.id,
        precio: 4500,
        superficie_total: 65.5,
        superficie_util: 58.0,
        dormitorios: 2,
        banos: 1,
        estacionamientos: 1,
        bodegas: 1,
        estado_propiedad_id: estadoDisponible!.id,
        modelo_negocio_id: modeloVentaDirecta.id,
        gestor_id: 1,
        comision_porcentaje: 2.5,
        activo: true,
      },
    });

    await prisma.propiedades.create({
      data: {
        codigo: 'PROP-000002',
        titulo: 'Departamento 3D+2B Premium',
        descripcion: 'Amplio departamento de 3 dormitorios con terraza panorámica',
        tipo_propiedad_id: tipoDepartamento!.id,
        direccion: 'Av. Providencia 1234, Depto 1201',
        comuna_id: 1,
        region_id: regionRM!.id,
        precio: 7200,
        superficie_total: 95.0,
        superficie_util: 85.0,
        dormitorios: 3,
        banos: 2,
        estacionamientos: 2,
        bodegas: 1,
        estado_propiedad_id: estadoDisponible!.id,
        modelo_negocio_id: modeloVentaDirecta.id,
        gestor_id: 1,
        comision_porcentaje: 2.5,
        activo: true,
      },
    });

    await prisma.propiedades.create({
      data: {
        codigo: 'PROP-000003',
        titulo: 'Departamento Compacto 1D+1B',
        descripcion: 'Ideal para inversión o primera vivienda',
        tipo_propiedad_id: tipoDepartamento!.id,
        direccion: 'Av. Providencia 1234, Depto 308',
        comuna_id: 1,
        region_id: regionRM!.id,
        precio: 3200,
        superficie_total: 42.0,
        superficie_util: 38.0,
        dormitorios: 1,
        banos: 1,
        estacionamientos: 1,
        bodegas: 0,
        estado_propiedad_id: estadoDisponible!.id,
        modelo_negocio_id: modeloVentaDirecta.id,
        gestor_id: 1,
        comision_porcentaje: 2.5,
        activo: true,
      },
    });

    console.log('✅ 3 propiedades creadas');

    // =====================================================
    // 7. RESUMEN
    // =====================================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(50));
    console.log('\n📊 Datos creados:');
    console.log(`   - ${3} Modelos de Negocio`);
    console.log(`   - ${3} Categorías de Dominio`);
    console.log(`   - ${7} Parámetros`);
    console.log(`   - ${1} Proyecto`);
    console.log(`   - ${3} Propiedades`);
    console.log(`   - ${1} Usuario Admin (ya existente)`);
    console.log('\n🔑 Credenciales:');
    console.log('   Email: admin@databrokers.cl');
    console.log('   Password: admin123\n');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
