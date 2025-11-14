/**
 * Script completo de seed para tablas vacías
 * Genera datos dummy para todas las tablas sin datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTableEmpty(tableName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
    const count = Number((result as any)[0].count);
    return count === 0;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function seedUsuarios() {
  console.log('Verificando usuarios...');
  const isEmpty = await checkTableEmpty('usuarios');
  if (!isEmpty) {
    console.log('✓ Usuarios ya tiene datos');
    return;
  }

  console.log('Creando usuarios dummy...');

  // Usuario admin ya existe del seed inicial
  const users = [
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@databrokers.cl',
      password: '$2b$10$YourHashedPasswordHere', // password: demo123
      rol_id: 2, // GESTOR
      estado_usuario_id: 1, // ACTIVO
      telefono: '+56912345678',
      activo: true
    },
    {
      nombre: 'María',
      apellido: 'González',
      email: 'maria.gonzalez@databrokers.cl',
      password: '$2b$10$YourHashedPasswordHere',
      rol_id: 3, // CORREDOR
      estado_usuario_id: 1,
      telefono: '+56987654321',
      activo: true
    },
    {
      nombre: 'Pedro',
      apellido: 'Rodríguez',
      email: 'pedro.rodriguez@databrokers.cl',
      password: '$2b$10$YourHashedPasswordHere',
      rol_id: 4, // ANALISTA
      estado_usuario_id: 1,
      telefono: '+56911223344',
      activo: true
    }
  ];

  for (const user of users) {
    await prisma.usuarios.create({ data: user });
  }

  console.log(`✓ ${users.length} usuarios creados`);
}

async function seedModelosNegocio() {
  console.log('Verificando modelos de negocio...');
  const isEmpty = await checkTableEmpty('modelos_negocio');
  if (!isEmpty) {
    console.log('✓ Modelos de negocio ya tiene datos');
    return;
  }

  console.log('Creando modelos de negocio dummy...');

  const modelos = [
    {
      nombre: 'Venta Directa',
      tipo_modelo_id: 1, // Asumiendo ID de dom_parametros
      descripcion: 'Venta directa de propiedades',
      comision_porcentaje: 3.0,
      gestor_id: 1,
      activo: true
    },
    {
      nombre: 'Preventa',
      tipo_modelo_id: 2,
      descripcion: 'Venta de propiedades en etapa de construcción',
      comision_porcentaje: 2.5,
      gestor_id: 1,
      activo: true
    },
    {
      nombre: 'Consignación',
      tipo_modelo_id: 3,
      descripcion: 'Propiedades en consignación',
      comision_porcentaje: 4.0,
      gestor_id: 1,
      activo: true
    }
  ];

  for (const modelo of modelos) {
    await prisma.modelos_negocio.create({ data: modelo });
  }

  console.log(`✓ ${modelos.length} modelos de negocio creados`);
}

async function seedProyectos() {
  console.log('Verificando proyectos...');
  const isEmpty = await checkTableEmpty('proyectos');
  if (!isEmpty) {
    console.log('✓ Proyectos ya tiene datos');
    return;
  }

  console.log('Creando proyectos dummy...');

  const proyectos = [
    {
      nombre: 'Torres del Sol',
      inmobiliaria: 'Inmobiliaria Aconcagua',
      direccion: 'Av. Apoquindo 4500',
      comuna_id: 100, // Las Condes
      region_id: 50, // RM
      estado_proyecto_id: 20, // En Construcción
      fecha_inicio_ventas: new Date('2024-01-15'),
      fecha_entrega_estimada: new Date('2025-12-31'),
      total_unidades: 120,
      unidades_disponibles: 85,
      descripcion: 'Moderno edificio residencial con amenities premium',
      modelo_negocio_id: 1,
      activo: true
    },
    {
      nombre: 'Parque Central',
      inmobiliaria: 'Constructora Mediterránea',
      direccion: 'Av. Kennedy 9000',
      comuna_id: 105, // Vitacura
      region_id: 50,
      estado_proyecto_id: 21, // Pre-venta
      fecha_inicio_ventas: new Date('2024-06-01'),
      fecha_entrega_estimada: new Date('2026-06-30'),
      total_unidades: 80,
      unidades_disponibles: 80,
      descripcion: 'Exclusivo condominio con áreas verdes',
      modelo_negocio_id: 2,
      activo: true
    }
  ];

  for (const proyecto of proyectos) {
    await prisma.proyectos.create({ data: proyecto });
  }

  console.log(`✓ ${proyectos.length} proyectos creados`);
}

async function seedPropiedades() {
  console.log('Verificando propiedades...');
  const isEmpty = await checkTableEmpty('propiedades');
  if (!isEmpty) {
    console.log('✓ Propiedades ya tiene datos');
    return;
  }

  console.log('Creando propiedades dummy...');

  const propiedades = [
    {
      codigo: 'PROP-001',
      modelo_negocio_id: 1,
      tipo_operacion_id: 30, // Venta
      tipo_propiedad_id: 40, // Departamento
      clasificacion_id: 50, // Nueva
      estado_propiedad_id: 60, // Disponible
      direccion: 'Av. Providencia 1500, Depto 501',
      comuna_id: 101, // Providencia
      region_id: 50,
      superficie_total: 85.5,
      superficie_util: 72.0,
      dormitorios: 2,
      banos: 2,
      estacionamientos: 1,
      bodegas: 1,
      precio: 4500000000,
      titulo: 'Moderno departamento en Providencia',
      descripcion: 'Hermoso departamento con vista panorámica',
      comision_porcentaje: 3.0,
      comision_monto: 135000000,
      fecha_publicacion: new Date('2024-01-10'),
      activo: true
    },
    {
      codigo: 'PROP-002',
      modelo_negocio_id: 1,
      tipo_operacion_id: 30,
      tipo_propiedad_id: 41, // Casa
      clasificacion_id: 51, // Usada
      estado_propiedad_id: 60,
      direccion: 'Los Robles 234',
      comuna_id: 100, // Las Condes
      region_id: 50,
      superficie_total: 180.0,
      superficie_util: 150.0,
      superficie_terreno: 250.0,
      dormitorios: 4,
      banos: 3,
      estacionamientos: 2,
      bodegas: 1,
      precio: 9800000000,
      titulo: 'Amplia casa en sector exclusivo',
      descripcion: 'Casa con jardín y piscina',
      comision_porcentaje: 3.0,
      comision_monto: 294000000,
      fecha_publicacion: new Date('2024-02-01'),
      activo: true
    },
    {
      codigo: 'PROP-003',
      modelo_negocio_id: 3,
      tipo_operacion_id: 30,
      tipo_propiedad_id: 40,
      clasificacion_id: 50,
      estado_propiedad_id: 61, // Reservada
      direccion: 'Av. Vitacura 3500, Depto 802',
      comuna_id: 105,
      region_id: 50,
      superficie_total: 95.0,
      superficie_util: 80.0,
      dormitorios: 3,
      banos: 2,
      estacionamientos: 2,
      bodegas: 1,
      precio: 6200000000,
      titulo: 'Departamento premium en Vitacura',
      descripcion: 'Departamento de lujo con amenities',
      comision_porcentaje: 4.0,
      comision_monto: 248000000,
      fecha_publicacion: new Date('2024-01-20'),
      activo: true
    }
  ];

  for (const propiedad of propiedades) {
    await prisma.propiedades.create({ data: propiedad });
  }

  console.log(`✓ ${propiedades.length} propiedades creadas`);
}

async function seedCanjes() {
  console.log('Verificando canjes...');
  const isEmpty = await checkTableEmpty('canjes');
  if (!isEmpty) {
    console.log('✓ Canjes ya tiene datos');
    return;
  }

  console.log('Creando canjes dummy...');

  const canjes = [
    {
      codigo: 'CANJE-001',
      modelo_negocio_id: 1,
      estado_canje_id: 70, // Iniciado
      propiedad_entrega_id: 1,
      valor_tasacion_entrega: 3800000000,
      saldo_favor: 700000000,
      fecha_inicio: new Date('2024-03-01'),
      fecha_vencimiento: new Date('2024-09-01'),
      observaciones: 'Canje de departamento usado por uno nuevo',
      gestor_id: 1,
      activo: true
    },
    {
      codigo: 'CANJE-002',
      modelo_negocio_id: 1,
      estado_canje_id: 71, // En Evaluación
      propiedad_entrega_id: 2,
      valor_tasacion_entrega: 9500000000,
      saldo_favor: 300000000,
      fecha_inicio: new Date('2024-02-15'),
      fecha_vencimiento: new Date('2024-08-15'),
      observaciones: 'Canje de casa por departamentos',
      gestor_id: 1,
      activo: true
    }
  ];

  for (const canje of canjes) {
    await prisma.canjes.create({ data: canje });
  }

  console.log(`✓ ${canjes.length} canjes creados`);
}

async function seedPublicaciones() {
  console.log('Verificando publicaciones...');
  const isEmpty = await checkTableEmpty('publicaciones');
  if (!isEmpty) {
    console.log('✓ Publicaciones ya tiene datos');
    return;
  }

  console.log('Creando publicaciones dummy...');

  const publicaciones = [
    {
      codigo: 'PUB-001',
      propiedad_id: 1,
      corredor_id: 2,
      estado_publicacion_id: 80, // Activa
      tipo_exclusividad_id: 85, // Exclusiva
      fecha_inicio: new Date('2024-01-10'),
      fecha_vencimiento: new Date('2024-07-10'),
      destacada: true,
      activo: true
    },
    {
      codigo: 'PUB-002',
      propiedad_id: 2,
      corredor_id: 2,
      estado_publicacion_id: 80,
      tipo_exclusividad_id: 86, // No Exclusiva
      fecha_inicio: new Date('2024-02-01'),
      fecha_vencimiento: new Date('2024-08-01'),
      destacada: false,
      activo: true
    }
  ];

  for (const publicacion of publicaciones) {
    await prisma.publicaciones.create({ data: publicacion });
  }

  console.log(`✓ ${publicaciones.length} publicaciones creadas`);
}

async function seedAlertas() {
  console.log('Verificando alertas...');
  const isEmpty = await checkTableEmpty('alertas');
  if (!isEmpty) {
    console.log('✓ Alertas ya tiene datos');
    return;
  }

  console.log('Creando alertas dummy...');

  const alertas = [
    {
      tipo_alerta_id: 90, // Sistema
      nivel_alerta_id: 91, // Info
      prioridad_id: 92, // Media
      estado_alerta_id: 93, // Activa
      titulo: 'Nueva propiedad disponible',
      mensaje: 'Se ha agregado una nueva propiedad en Las Condes',
      entidad_tipo_id: 100,
      entidad_id: 1,
      usuario_destino_id: 2,
      activo: true
    },
    {
      tipo_alerta_id: 90,
      nivel_alerta_id: 94, // Advertencia
      prioridad_id: 95, // Alta
      estado_alerta_id: 93,
      titulo: 'Publicación próxima a vencer',
      mensaje: 'La publicación PUB-001 vence en 30 días',
      entidad_tipo_id: 101,
      entidad_id: 1,
      usuario_destino_id: 2,
      activo: true
    }
  ];

  for (const alerta of alertas) {
    await prisma.alertas.create({ data: alerta });
  }

  console.log(`✓ ${alertas.length} alertas creadas`);
}

async function seedDocumentos() {
  console.log('Verificando documentos...');
  const isEmpty = await checkTableEmpty('documentos');
  if (!isEmpty) {
    console.log('✓ Documentos ya tiene datos');
    return;
  }

  console.log('Creando documentos dummy...');

  const documentos = [
    {
      nombre: 'Contrato de Compraventa - PROP-001',
      tipo_documento_id: 110, // Contrato
      ruta_archivo: '/uploads/documentos/contrato-001.pdf',
      tamano_bytes: 524288,
      mime_type: 'application/pdf',
      entidad_tipo_id: 100,
      entidad_id: 1,
      subido_por_id: 1,
      activo: true
    },
    {
      nombre: 'Tasación - PROP-002',
      tipo_documento_id: 111, // Tasación
      ruta_archivo: '/uploads/documentos/tasacion-002.pdf',
      tamano_bytes: 312455,
      mime_type: 'application/pdf',
      entidad_tipo_id: 100,
      entidad_id: 2,
      subido_por_id: 1,
      activo: true
    }
  ];

  for (const documento of documentos) {
    await prisma.documentos.create({ data: documento });
  }

  console.log(`✓ ${documentos.length} documentos creados`);
}

async function seedComisiones() {
  console.log('Verificando comisiones...');
  const isEmpty = await checkTableEmpty('comisiones');
  if (!isEmpty) {
    console.log('✓ Comisiones ya tiene datos');
    return;
  }

  console.log('Creando comisiones dummy...');

  const comisiones = [
    {
      propiedad_id: 1,
      corredor_id: 2,
      monto_bruto: 135000000,
      porcentaje_corredor: 50.0,
      monto_corredor: 67500000,
      estado_comision_id: 120, // Pendiente
      fecha_venta: new Date('2024-03-15'),
      activo: true
    }
  ];

  for (const comision of comisiones) {
    await prisma.comisiones.create({ data: comision });
  }

  console.log(`✓ ${comisiones.length} comisiones creadas`);
}

async function seedReportes() {
  console.log('Verificando reportes...');
  const isEmpty = await checkTableEmpty('reportes');
  if (!isEmpty) {
    console.log('✓ Reportes ya tiene datos');
    return;
  }

  console.log('Creando reportes dummy...');

  const reportes = [
    {
      nombre: 'Reporte Mensual - Marzo 2024',
      tipo_reporte_id: 130, // Mensual
      formato_id: 131, // PDF
      estado_reporte_id: 132, // Generado
      parametros: JSON.stringify({ mes: 3, anio: 2024 }),
      ruta_archivo: '/uploads/reportes/reporte-marzo-2024.pdf',
      tamano_bytes: 1024000,
      usuario_generador_id: 1,
      activo: true
    }
  ];

  for (const reporte of reportes) {
    await prisma.reportes.create({ data: reporte });
  }

  console.log(`✓ ${reportes.length} reportes creados`);
}

async function main() {
  console.log('🌱 Iniciando seed de datos dummy...\n');

  try {
    // Seed en orden de dependencias
    await seedUsuarios();
    await seedModelosNegocio();
    await seedProyectos();
    await seedPropiedades();
    await seedCanjes();
    await seedPublicaciones();
    await seedAlertas();
    await seedDocumentos();
    await seedComisiones();
    await seedReportes();

    console.log('\n✅ Seed completado exitosamente!');
  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
