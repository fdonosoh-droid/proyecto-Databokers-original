/**
 * Script para crear usuario administrador inicial
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verificar si ya existe un rol ADMIN
    let rolAdmin = await prisma.roles.findUnique({
      where: { codigo: 'ADMIN' },
    });

    // Si no existe, crear el rol ADMIN
    if (!rolAdmin) {
      rolAdmin = await prisma.roles.create({
        data: {
          codigo: 'ADMIN',
          nombre: 'Administrador',
          descripcion: 'Rol con acceso total al sistema',
          activo: true,
        },
      });
      console.log('✅ Rol ADMIN creado');
    }

    // Verificar si ya existe el usuario admin
    const adminExists = await prisma.usuarios.findUnique({
      where: { email: 'admin@databrokers.cl' },
    });

    if (adminExists) {
      console.log('⚠️  Usuario admin ya existe');
      return;
    }

    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.usuarios.create({
      data: {
        email: 'admin@databrokers.cl',
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        telefono: '+56912345678',
        rol_id: rolAdmin.id,
        activo: true,
      },
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   ID: ${admin.id}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
