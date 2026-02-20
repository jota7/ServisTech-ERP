const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.create({
    data: {
      email: 'admin@servistech.com', // Puedes cambiarlo por tu correo
      password: 'admin123_cambiame', // Esta será tu clave inicial
      name: 'Administrador ServisTech',
      role: 'ADMIN',
    },
  });
  console.log('✅ Usuario Admin creado con éxito:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Error creando usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });