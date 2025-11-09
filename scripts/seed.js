import 'dotenv/config';
import { connectDB, disconnectDB } from '../libs/mongoose.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Coupon from '../models/Coupon.js';
import { createLogger } from '../libs/logger.js';

const logger = createLogger('Seed');

const seedUsers = async () => {
  logger.info('Creando usuarios...');

  const users = await User.create([
    {
      email: 'admin@parkbnb.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      roles: ['admin', 'host', 'driver'],
      isEmailVerified: true,
    },
    {
      email: 'host@parkbnb.com',
      password: 'Host123!',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+1234567891',
      roles: ['host'],
      isEmailVerified: true,
    },
    {
      email: 'driver@parkbnb.com',
      password: 'Driver123!',
      firstName: 'María',
      lastName: 'García',
      phone: '+1234567892',
      roles: ['driver'],
      isEmailVerified: true,
    },
  ]);

  logger.info(`✅ ${users.length} usuarios creados`);
  return users;
};

const seedListings = async (users) => {
  logger.info('Creando listings...');

  const host = users.find((u) => u.roles.includes('host'));

  const listings = await Listing.create([
    {
      host: host._id,
      title: 'Estacionamiento Céntrico Techado',
      description:
        'Espacio techado y seguro en el centro de la ciudad. Ideal para vehículos medianos y pequeños.',
      type: 'covered',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
        fullAddress: '123 Main St, New York, NY 10001',
        location: {
          type: 'Point',
          coordinates: [-73.9857, 40.7484],
        },
        approximateLocation: {
          type: 'Point',
          coordinates: [-73.985, 40.748],
        },
      },
      dimensions: {
        length: 500,
        width: 250,
        height: 200,
        maxVehicleSize: 'suv',
      },
      amenities: ['covered', 'security24h', 'cctv', 'lighting'],
      pricing: {
        hourlyRate: 5,
        dailyRate: 40,
        weeklyRate: 250,
      },
      rules: {
        minBookingHours: 1,
        maxBookingDays: 30,
        instantBook: true,
        requiresApproval: false,
        cancellationPolicy: 'flexible',
      },
      status: 'published',
      publishedAt: new Date(),
    },
    {
      host: host._id,
      title: 'Garage Privado - Centro',
      description: 'Garage privado con puerta automática. Muy seguro y limpio.',
      type: 'garage',
      address: {
        street: '456 Park Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10022',
        country: 'US',
        fullAddress: '456 Park Ave, New York, NY 10022',
        location: {
          type: 'Point',
          coordinates: [-73.9712, 40.7614],
        },
        approximateLocation: {
          type: 'Point',
          coordinates: [-73.971, 40.761],
        },
      },
      amenities: ['covered', 'security24h', 'gated', 'electricCharger'],
      pricing: {
        hourlyRate: 8,
        dailyRate: 60,
      },
      rules: {
        minBookingHours: 2,
        maxBookingDays: 7,
        instantBook: false,
        requiresApproval: true,
        cancellationPolicy: 'moderate',
      },
      status: 'published',
      publishedAt: new Date(),
    },
  ]);

  logger.info(`✅ ${listings.length} listings creados`);
  return listings;
};

const seedCoupons = async () => {
  logger.info('Creando cupones...');

  const coupons = await Coupon.create([
    {
      code: 'WELCOME20',
      type: 'percentage',
      value: 20,
      description: 'Descuento de bienvenida del 20%',
      minAmount: 10,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      usageLimit: 100,
      userLimit: 1,
      isActive: true,
    },
    {
      code: 'FIRST10',
      type: 'fixed',
      value: 10,
      description: '$10 de descuento en tu primera reserva',
      minAmount: 20,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
      usageLimit: 50,
      userLimit: 1,
      isActive: true,
    },
  ]);

  logger.info(`✅ ${coupons.length} cupones creados`);
  return coupons;
};

const seed = async () => {
  try {
    logger.info('🌱 Iniciando seed de la base de datos...');

    await connectDB();

    // Clear existing data
    logger.info('🗑️  Limpiando datos existentes...');
    await User.deleteMany({});
    await Listing.deleteMany({});
    await Coupon.deleteMany({});

    // Seed data
    const users = await seedUsers();
    await seedListings(users);
    await seedCoupons();

    logger.info('');
    logger.info('✨ Seed completado exitosamente!');
    logger.info('');
    logger.info('📋 Credenciales de prueba:');
    logger.info('');
    logger.info('Admin:');
    logger.info('  Email: admin@parkbnb.com');
    logger.info('  Password: Admin123!');
    logger.info('');
    logger.info('Host:');
    logger.info('  Email: host@parkbnb.com');
    logger.info('  Password: Host123!');
    logger.info('');
    logger.info('Driver:');
    logger.info('  Email: driver@parkbnb.com');
    logger.info('  Password: Driver123!');
    logger.info('');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seed();

