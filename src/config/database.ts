/**
 * DATABROKERS - CONFIGURACIÓN DE BASE DE DATOS
 * Cliente Prisma y utilidades de base de datos
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { PrismaClient } from '@prisma/client';

// Crear instancia única de Prisma Client (Singleton)
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Función para probar la conexión a la base de datos
 */
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
}

/**
 * Función para cerrar la conexión a la base de datos
 */
export async function closeDatabaseConnection() {
  await prisma.$disconnect();
  console.log('🔌 Conexión a base de datos cerrada');
}
