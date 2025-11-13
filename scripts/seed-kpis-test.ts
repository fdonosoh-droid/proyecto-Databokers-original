/**
 * SCRIPT DE SEED PARA DATOS DE PRUEBA DE KPIs
 * Genera datos dummy para poder calcular KPIs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba para KPIs...');

  // 1. Crear configuraciones de KPIs si no existen
  console.log('📊 Creando configuraciones de KPIs...');

  const kpisConfig = [
    {
      codigo: 'TASA_CONVERSION',
      nombre: 'Tasa de Conversión',
      descripcion: 'Porcentaje de propiedades vendidas respecto al total',
      umbral_min: 10.0,
      umbral_max: 80.0,
      unidad_medida: 'porcentaje',
      activo: true
    },
    {
      codigo: 'TIEMPO_PROMEDIO_VENTA',
      nombre: 'Tiempo Promedio de Venta',
      descripcion: 'Días promedio desde publicación hasta venta',
      umbral_min: 30.0,
      umbral_max: 180.0,
      unidad_medida: 'dias',
      activo: true
    },
    {
      codigo: 'VALORIZACION_TOTAL',
      nombre: 'Valorización Total',
      descripcion: 'Suma del precio de todas las propiedades activas',
      umbral_min: 100000000.0,
      unidad_medida: 'clp',
      activo: true
    },
    {
      codigo: 'COMISION_TOTAL_GENERADA',
      nombre: 'Comisión Total Generada',
      descripcion: 'Suma de todas las comisiones de ventas',
      umbral_min: 5000000.0,
      unidad_medida: 'clp',
      activo: true
    },
    {
      codigo: 'COMISION_NETA_AGENCIA',
      nombre: 'Comisión Neta Agencia',
      descripcion: 'Comisión total menos split de corredores',
      umbral_min: 3000000.0,
      unidad_medida: 'clp',
      activo: true
    },
    {
      codigo: 'INDICE_STOCK',
      nombre: 'Índice de Stock',
      descripcion: 'Porcentaje de stock actual respecto al objetivo',
      umbral_min: 50.0,
      umbral_max: 150.0,
      unidad_medida: 'porcentaje',
      activo: true
    }
  ];

  for (const kpi of kpisConfig) {
    await prisma.kpis.upsert({
      where: { codigo: kpi.codigo },
      update: kpi,
      create: kpi
    });
  }

  console.log(`✅ ${kpisConfig.length} KPIs configurados`);

  // 2. Crear modelo de negocio si no existe
  console.log('💼 Creando modelo de negocio...');

  const modeloNegocio = await prisma.modelos_negocio.upsert({
    where: { codigo: 'VENTA_DIRECTA' },
    update: {
      nombre: 'Venta Directa',
      activo: true,
      metadata: JSON.stringify({
        stock_objetivo: 50,
        costos_operacionales: 5000000
      })
    },
    create: {
      codigo: 'VENTA_DIRECTA',
      nombre: 'Venta Directa',
      descripcion: 'Modelo de venta directa de propiedades',
      activo: true,
      metadata: JSON.stringify({
        stock_objetivo: 50,
        costos_operacionales: 5000000
      })
    }
  });

  console.log(`✅ Modelo de negocio creado: ${modeloNegocio.nombre}`);

  // 3. Crear proyectos
  console.log('🏗️ Creando proyectos...');

  const proyectos = [];
  for (let i = 1; i <= 3; i++) {
    const proyecto = await prisma.proyectos.upsert({
      where: { codigo: `PROY-TEST-${i}` },
      update: {
        nombre: `Proyecto Test ${i}`,
        modelo_negocio_id: modeloNegocio.id,
        activo: true
      },
      create: {
        codigo: `PROY-TEST-${i}`,
        nombre: `Proyecto Test ${i}`,
        descripcion: `Proyecto de prueba ${i} para cálculo de KPIs`,
        modelo_negocio_id: modeloNegocio.id,
        estado: 2, // En curso
        activo: true
      }
    });
    proyectos.push(proyecto);
  }

  console.log(`✅ ${proyectos.length} proyectos creados`);

  // 4. Crear propiedades con diferentes estados
  console.log('🏠 Creando propiedades...');

  const now = new Date();
  const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const hace60Dias = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const hace30Dias = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const propiedades = [];

  // Propiedades disponibles (20)
  for (let i = 1; i <= 20; i++) {
    const prop = await prisma.propiedades.create({
      data: {
        codigo: `PROP-DISP-${i}`,
        direccion: `Calle Test ${i}`,
        comuna: 'Santiago',
        tipo_propiedad: 1, // Casa
        dormitorios: 3,
        banos: 2,
        superficie_total: 120.0,
        superficie_util: 100.0,
        precio_venta: 150000000 + (i * 5000000),
        porcentaje_comision: 2.5,
        modelo_negocio_id: modeloNegocio.id,
        proyecto_id: proyectos[i % 3].id,
        estado: 1, // Disponible
        fecha_creacion: mesAnterior,
        activo: true
      }
    });
    propiedades.push(prop);
  }

  // Propiedades reservadas (5)
  for (let i = 1; i <= 5; i++) {
    const prop = await prisma.propiedades.create({
      data: {
        codigo: `PROP-RESV-${i}`,
        direccion: `Avenida Test ${i}`,
        comuna: 'Santiago',
        tipo_propiedad: 2, // Departamento
        dormitorios: 2,
        banos: 2,
        superficie_total: 80.0,
        superficie_util: 70.0,
        precio_venta: 100000000 + (i * 3000000),
        porcentaje_comision: 2.5,
        modelo_negocio_id: modeloNegocio.id,
        proyecto_id: proyectos[i % 3].id,
        estado: 2, // Reservada
        fecha_creacion: mesAnterior,
        activo: true
      }
    });
    propiedades.push(prop);
  }

  // Propiedades vendidas (15)
  for (let i = 1; i <= 15; i++) {
    const fechaCreacion = i <= 7 ? hace60Dias : hace30Dias;
    const diasVenta = i <= 7 ? 45 : 25;
    const fechaVenta = new Date(fechaCreacion.getTime() + diasVenta * 24 * 60 * 60 * 1000);

    const prop = await prisma.propiedades.create({
      data: {
        codigo: `PROP-VEND-${i}`,
        direccion: `Pasaje Test ${i}`,
        comuna: 'Santiago',
        tipo_propiedad: 1,
        dormitorios: 3,
        banos: 2,
        superficie_total: 110.0,
        superficie_util: 95.0,
        precio_venta: 130000000 + (i * 4000000),
        porcentaje_comision: 2.5,
        modelo_negocio_id: modeloNegocio.id,
        proyecto_id: proyectos[i % 3].id,
        estado: 3, // Vendida
        fecha_creacion: fechaCreacion,
        fecha_venta: fechaVenta,
        activo: true
      }
    });
    propiedades.push(prop);
  }

  console.log(`✅ ${propiedades.length} propiedades creadas (20 disponibles, 5 reservadas, 15 vendidas)`);

  // 5. Crear algunos canjes
  console.log('🔄 Creando canjes...');

  for (let i = 1; i <= 5; i++) {
    await prisma.canjes.create({
      data: {
        codigo: `CANJE-TEST-${i}`,
        propiedad_entregada_id: propiedades[i].id,
        propiedad_recibida_id: propiedades[i + 5].id,
        valor_diferencia: 10000000,
        estado: i <= 3 ? 4 : 2, // 3 finalizados, 2 en proceso
        fecha_inicio: mesAnterior,
        fecha_finalizacion: i <= 3 ? now : null,
        activo: true
      }
    });
  }

  console.log('✅ 5 canjes creados (3 finalizados, 2 en proceso)');

  // 6. Crear publicaciones para algunas propiedades
  console.log('📢 Creando publicaciones...');

  const usuarioId = 1; // Usuario admin

  for (let i = 0; i < 10; i++) {
    await prisma.publicaciones.create({
      data: {
        codigo: `PUB-TEST-${i + 1}`,
        propiedad_id: propiedades[i].id,
        corredor_id: usuarioId,
        plataforma_id: 1, // Portal inmobiliario
        fecha_publicacion: mesAnterior,
        estado: 1, // Activa
        comision_corredor_porcentaje: 40.0, // 40% de split
        activo: true
      }
    });
  }

  console.log('✅ 10 publicaciones creadas');

  // Resumen
  console.log('\n📊 Resumen de datos generados:');
  console.log(`   - ${kpisConfig.length} configuraciones de KPIs`);
  console.log(`   - 1 modelo de negocio`);
  console.log(`   - ${proyectos.length} proyectos`);
  console.log(`   - ${propiedades.length} propiedades (20 disponibles, 5 reservadas, 15 vendidas)`);
  console.log(`   - 5 canjes (3 finalizados)`);
  console.log(`   - 10 publicaciones`);
  console.log('\n✅ Seed completado exitosamente!');
  console.log('\n🎯 Ahora puedes calcular KPIs con estos datos de prueba.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
