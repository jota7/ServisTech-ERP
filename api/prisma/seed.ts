import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default store
  const store = await prisma.store.upsert({
    where: { code: 'CCS-01' },
    update: {},
    create: {
      name: 'Sede Principal - Caracas',
      code: 'CCS-01',
      address: 'Av. Principal de Las Mercedes, Centro Comercial X, Local 15',
      phone: '+58 212-123-4567',
      email: 'caracas@servistech.com',
      rif: 'J-12345678-9',
      razonSocial: 'SERVISTECH C.A.',
      direccionFiscal: 'Av. Principal de Las Mercedes, Caracas',
    },
  });
  console.log('✅ Store created:', store.name);

  // Create additional stores
  const store2 = await prisma.store.upsert({
    where: { code: 'VLN-01' },
    update: {},
    create: {
      name: 'Sede Valencia',
      code: 'VLN-01',
      address: 'Centro Comercial Sambil Valencia, Nivel 2, Local 45',
      phone: '+58 241-987-6543',
      email: 'valencia@servistech.com',
    },
  });

  const store3 = await prisma.store.upsert({
    where: { code: 'MCB-01' },
    update: {},
    create: {
      name: 'Sede Maracaibo',
      code: 'MCB-01',
      address: 'Centro Comercial Lago Mall, Nivel 1, Local 28',
      phone: '+58 261-456-7890',
      email: 'maracaibo@servistech.com',
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@servistech.com' },
    update: {},
    create: {
      name: 'Admin Principal',
      email: 'admin@servistech.com',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      storeId: store.id,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create sample users
  const users = [
    { name: 'Carlos Gerente', email: 'gerente@servistech.com', role: UserRole.GERENTE },
    { name: 'María Anfitriona', email: 'anfitrion@servistech.com', role: UserRole.ANFITRION },
    { name: 'Juan Técnico', email: 'tecnico@servistech.com', role: UserRole.TECNICO },
    { name: 'Ana QA', email: 'qa@servistech.com', role: UserRole.QA },
    { name: 'Pedro Almacén', email: 'almacen@servistech.com', role: UserRole.ALMACEN },
  ];

  for (const userData of users) {
    const password = await bcrypt.hash('password123', 12);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password,
        storeId: store.id,
      },
    });
  }
  console.log('✅ Sample users created');

  // Create default BCV rate
  await prisma.bCVRate.upsert({
    where: { id: 'default-rate' },
    update: {},
    create: {
      id: 'default-rate',
      rate: 64.85,
      date: new Date(),
      source: 'manual',
    },
  });
  console.log('✅ Default BCV rate created');

  // Create sample parts
  const parts = [
    {
      sku: 'SCR-IP14PM-OEM',
      name: 'Pantalla iPhone 14 Pro Max OLED OEM',
      description: 'Pantalla completa con OLED original',
      category: 'Pantallas',
      compatibleModels: ['iPhone 14 Pro Max'],
      costPrice: 180,
      salePrice: 280,
      shippingCost: 15,
      operationalCost: 10,
      minStock: 3,
      supplier: 'Proveedor A',
    },
    {
      sku: 'BAT-IP13-OEM',
      name: 'Batería iPhone 13 OEM',
      description: 'Batería original de 3227 mAh',
      category: 'Baterías',
      compatibleModels: ['iPhone 13', 'iPhone 13 Mini'],
      costPrice: 45,
      salePrice: 85,
      shippingCost: 5,
      operationalCost: 5,
      minStock: 5,
      supplier: 'Proveedor B',
    },
    {
      sku: 'CHG-S23U-OEM',
      name: 'Puerto de Carga Samsung S23 Ultra',
      description: 'Conector de carga tipo C original',
      category: 'Conectores',
      compatibleModels: ['Galaxy S23 Ultra'],
      costPrice: 25,
      salePrice: 55,
      shippingCost: 3,
      operationalCost: 3,
      minStock: 3,
      supplier: 'Proveedor C',
    },
    {
      sku: 'CAM-IP14P-OEM',
      name: 'Cámara Trasera iPhone 14 Pro',
      description: 'Módulo de cámara triple original',
      category: 'Cámaras',
      compatibleModels: ['iPhone 14 Pro', 'iPhone 14 Pro Max'],
      costPrice: 120,
      salePrice: 195,
      shippingCost: 10,
      operationalCost: 8,
      minStock: 2,
      supplier: 'Proveedor A',
    },
    {
      sku: 'FLEX-IP12-OEM',
      name: 'Flex de Carga iPhone 12',
      description: 'Flex con conector Lightning original',
      category: 'Flex',
      compatibleModels: ['iPhone 12', 'iPhone 12 Pro'],
      costPrice: 18,
      salePrice: 45,
      shippingCost: 2,
      operationalCost: 2,
      minStock: 5,
      supplier: 'Proveedor B',
    },
  ];

  for (const partData of parts) {
    const warrantyFund = partData.costPrice * 0.1;
    const part = await prisma.part.upsert({
      where: { sku: partData.sku },
      update: {},
      create: {
        ...partData,
        warrantyFund,
      },
    });

    // Create stock for each store
    for (const s of [store, store2, store3]) {
      await prisma.partStock.upsert({
        where: {
          partId_storeId: {
            partId: part.id,
            storeId: s.id,
          },
        },
        update: {},
        create: {
          partId: part.id,
          storeId: s.id,
          quantity: Math.floor(Math.random() * 10) + 2,
        },
      });
    }
  }
  console.log('✅ Sample parts created');

  // Create sample customers
  const customers = [
    {
      name: 'Pedro González',
      email: 'pedro@gmail.com',
      phone: '+58 412-123-4567',
      documentId: 'V-12.345.678',
      address: 'Urb. Las Acacias, Caracas',
    },
    {
      name: 'Laura Martínez',
      email: 'laura@hotmail.com',
      phone: '+58 414-987-6543',
      documentId: 'V-23.456.789',
      address: 'Urb. El Rosal, Caracas',
    },
    {
      name: 'Roberto Silva',
      email: 'roberto@gmail.com',
      phone: '+58 416-555-8888',
      documentId: 'V-34.567.890',
      address: 'Urb. La Castellana, Caracas',
    },
  ];

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { documentId: customerData.documentId },
      update: {},
      create: customerData,
    });
  }
  console.log('✅ Sample customers created');

  // Create app settings
  await prisma.appSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'SERVISTECH',
      defaultWarrantyDays: 90,
      igtfPercentage: 3,
      warrantyFundPercentage: 10,
      bcvAutoSync: true,
      bcvSyncHour: 8,
      whatsappEnabled: true,
    },
  });
  console.log('✅ App settings created');

  // Create WhatsApp templates
  const templates = [
    {
      name: 'Recepción Confirmada',
      trigger: 'triaje',
      content: '¡Hola {{nombre}}! Hemos recibido tu {{equipo}} en SERVISTECH. Tu número de orden es: {{orden}}. Te mantendremos informado del avance.',
      variables: ['nombre', 'equipo', 'orden'],
    },
    {
      name: 'Diagnóstico Completo',
      trigger: 'diagnostico',
      content: 'Hola {{nombre}}. Hemos completado el diagnóstico de tu {{equipo}}. {{diagnostico}}. Costo estimado: {{monto}}. ¿Deseas proceder?',
      variables: ['nombre', 'equipo', 'diagnostico', 'monto'],
    },
    {
      name: 'Equipo Listo',
      trigger: 'listo',
      content: '¡Buenas noticias {{nombre}}! Tu {{equipo}} está listo. Puedes pasar a retirarlo por nuestra sede. Total a pagar: {{monto}}.',
      variables: ['nombre', 'equipo', 'monto'],
    },
    {
      name: 'Garantía Activada',
      trigger: 'entregado',
      content: 'Gracias {{nombre}} por preferir SERVISTECH. Tu {{equipo}} tiene garantía por {{dias}} días. Guarda tu orden: {{orden}}.',
      variables: ['nombre', 'equipo', 'dias', 'orden'],
    },
  ];

  for (const template of templates) {
    await prisma.whatsAppTemplate.upsert({
      where: { id: `template-${template.trigger}` },
      update: {},
      create: {
        id: `template-${template.trigger}`,
        ...template,
        isActive: true,
      },
    });
  }
  console.log('✅ WhatsApp templates created');

  console.log('\n✨ Database seeded successfully!');
  console.log('\n📧 Default login credentials:');
  console.log('   Email: admin@servistech.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
