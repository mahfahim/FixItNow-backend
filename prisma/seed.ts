import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Role,
  UserStatus,
  BookingStatus,
  PaymentStatus,
  PaymentProvider,
  Weekday,
  NotificationType,
} from '../generated/prisma/client';

// Validate environment variable to prevent undefined error
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // =========================================================================
  // 1. CLEANUP (Delete in reverse dependency order to avoid FK errors)
  // =========================================================================
  console.log('🧹 Cleaning existing data...');
  await prisma.bookingStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favoriteTechnician.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.address.deleteMany();
  await prisma.category.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.user.deleteMany();

  // =========================================================================
  // 2. CATEGORIES (5 records)
  // =========================================================================
  console.log('📦 Seeding Categories...');
  const categoriesData = [
    { name: 'AC Repair & Service', slug: 'ac-repair', icon: 'ac.png', description: 'AC servicing, maintenance, and gas refill.' },
    { name: 'Plumbing Services', slug: 'plumbing', icon: 'plumbing.png', description: 'Pipe leak repairs, fitting, and installation.' },
    { name: 'Electrical Repair', slug: 'electrical', icon: 'electrical.png', description: 'Wiring, switches, and appliance setup.' },
    { name: 'Home Cleaning', slug: 'home-cleaning', icon: 'cleaning.png', description: 'Deep house cleaning and sofa wash.' },
    { name: 'Appliance Repair', slug: 'appliance-repair', icon: 'appliance.png', description: 'Washing machine and refrigerator servicing.' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    categories.push(await prisma.category.create({ data: cat }));
  }

  // =========================================================================
  // 3. USERS & TECHNICIAN PROFILES (5 Customers, 5 Technicians = 10 Users)
  // =========================================================================
  console.log('👤 Seeding Users & Technician Profiles...');
  
  // 5 Customers
  const customers = [];
  for (let i = 1; i <= 5; i++) {
    const customer = await prisma.user.create({
      data: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        password: '$2b$10$eImiTXuWVxfM37uY4JANjO2...hashedPassword', // Mock hash
        role: Role.CUSTOMER,
        status: UserStatus.ACTIVE,
      },
    });
    customers.push(customer);
  }

  // 5 Technicians + 5 TechnicianProfiles
  const technicians = [];
  const technicianProfiles = [];
  for (let i = 1; i <= 5; i++) {
    const techUser = await prisma.user.create({
      data: {
        name: `Technician ${i}`,
        email: `tech${i}@example.com`,
        password: '$2b$10$eImiTXuWVxfM37uY4JANjO2...hashedPassword',
        role: Role.TECHNICIAN,
        status: UserStatus.ACTIVE,
      },
    });
    technicians.push(techUser);

    const profile = await prisma.technicianProfile.create({
      data: {
        userId: techUser.id,
        bio: `Professional certified technician #${i} with over ${3 + i} years of active service.`,
        yearsOfExperience: 3 + i,
        hourlyRate: 30.00 + i * 5,
        averageRating: 4.5,
        totalReviews: 12 + i,
        totalCompletedJobs: 25 + i * 3,
        phone: `+1202555010${i}`,
        address: `${100 + i} Skillful Ave`,
        city: 'New York',
        district: 'Manhattan',
      },
    });
    technicianProfiles.push(profile);
  }

  // =========================================================================
  // 4. SERVICES (5 records)
  // =========================================================================
  console.log('🛠️ Seeding Services...');
  const servicesData = [
    { title: 'Master AC Cleaning & Repair', description: 'Full jet wash and chemical treatment for split ACs.', price: 50.00, duration: 60 },
    { title: 'Emergency Pipe Leak Fix', description: 'Rapid repair for leaking or broken pipes.', price: 40.00, duration: 45 },
    { title: 'Full House Electrical Inspection', description: 'Comprehensive check of fuses, switches, and wiring.', price: 70.00, duration: 90 },
    { title: 'Deep Sofa & Carpet Cleaning', description: 'Steam sanitization and deep foam cleaning.', price: 95.00, duration: 120 },
    { title: 'Double Door Refrigerator Repair', description: 'Diagnostic, compressor check, and gas refill.', price: 85.00, duration: 75 },
  ];

  const services = [];
  for (let i = 0; i < 5; i++) {
    const techProfile = technicianProfiles[i]!;
    const category = categories[i]!;
    const serviceInfo = servicesData[i]!;

    const service = await prisma.service.create({
      data: {
        technicianId: techProfile.id,
        categoryId: category.id,
        title: serviceInfo.title,
        description: serviceInfo.description,
        price: serviceInfo.price,
        duration: serviceInfo.duration,
        images: [`https://example.com/s${i + 1}-a.jpg`, `https://example.com/s${i + 1}-b.jpg`],
        serviceArea: ['Manhattan', 'Brooklyn', 'Queens'],
        isAvailable: true,
      },
    });
    services.push(service);
  }

  // =========================================================================
  // 5. ADDRESSES (5 records)
  // =========================================================================
  console.log('📍 Seeding Addresses...');
  const addresses = [];
  for (let i = 0; i < 5; i++) {
    const customer = customers[i]!;

    const address = await prisma.address.create({
      data: {
        userId: customer.id,
        label: i % 2 === 0 ? 'Home' : 'Office',
        addressLine: `Apt ${i + 1}B, ${200 + i} Broadway St`,
        city: 'New York',
        district: 'Manhattan',
        postalCode: `1000${i + 1}`,
        isDefault: true,
      },
    });
    addresses.push(address);
  }

  // =========================================================================
  // 6. BOOKINGS (5 records)
  // =========================================================================
  console.log('📅 Seeding Bookings...');
  const bookingStatuses = [
    BookingStatus.REQUESTED,
    BookingStatus.ACCEPTED,
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
    BookingStatus.COMPLETED,
  ];
  const paymentStatuses = [
    PaymentStatus.PENDING,
    PaymentStatus.PENDING,
    PaymentStatus.COMPLETED,
    PaymentStatus.COMPLETED,
    PaymentStatus.COMPLETED,
  ];

  const bookings = [];
  for (let i = 0; i < 5; i++) {
    const customer = customers[i]!;
    const techProfile = technicianProfiles[i]!;
    const service = services[i]!;
    const addr = addresses[i]!;
    const status = bookingStatuses[i]!;
    const payStatus = paymentStatuses[i]!;

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        technicianId: techProfile.id,
        serviceId: service.id,
        addressId: addr.id,
        scheduledDate: new Date(`2026-08-1${i + 1}`),
        scheduledTime: '10:00 AM',
        address: addr.addressLine,
        notes: `Please arrive strictly on time for booking #${i + 1}.`,
        price: service.price,
        status: status,
        paymentStatus: payStatus,
      },
    });
    bookings.push(booking);
  }

  // =========================================================================
  // 7. BOOKING STATUS HISTORY (5 records)
  // =========================================================================
  console.log('📜 Seeding Booking Status History...');
  for (let i = 0; i < 5; i++) {
    const booking = bookings[i]!;
    const status = bookingStatuses[i]!;

    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        status: status,
        note: `Booking updated to state: ${status}`,
      },
    });
  }

  // =========================================================================
  // 8. PAYMENTS (5 records)
  // =========================================================================
  console.log('💳 Seeding Payments...');
  for (let i = 0; i < 5; i++) {
    const booking = bookings[i]!;
    const service = services[i]!;
    const payStatus = paymentStatuses[i]!;

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        transactionId: `TXN_202608_00${i + 1}`,
        amount: service.price,
        currency: 'USD',
        provider: i % 2 === 0 ? PaymentProvider.STRIPE : PaymentProvider.SSLCOMMERZ,
        status: payStatus,
        paidAt: payStatus === PaymentStatus.COMPLETED ? new Date() : null,
        metadata: { method: 'card', cardBrand: 'Visa' },
      },
    });
  }

  // =========================================================================
  // 9. REVIEWS (5 records)
  // =========================================================================
  console.log('⭐ Seeding Reviews...');
  for (let i = 0; i < 5; i++) {
    const booking = bookings[i]!;
    const customer = customers[i]!;
    const techProfile = technicianProfiles[i]!;

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: customer.id,
        technicianId: techProfile.id,
        rating: 4 + (i % 2), // Gives 4 or 5 star ratings
        comment: `Excellent work on service ${i + 1}! Punctual and clean job.`,
      },
    });
  }

  // =========================================================================
  // 10. AVAILABILITY SLOTS (5 records)
  // =========================================================================
  console.log('⏰ Seeding Availability Slots...');
  const weekdays = [
    Weekday.MONDAY,
    Weekday.TUESDAY,
    Weekday.WEDNESDAY,
    Weekday.THURSDAY,
    Weekday.FRIDAY,
  ];

  for (let i = 0; i < 5; i++) {
    const techProfile = technicianProfiles[i]!;
    const weekday = weekdays[i]!;

    await prisma.availabilitySlot.create({
      data: {
        technicianId: techProfile.id,
        weekday: weekday,
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        isAvailable: true,
      },
    });
  }

  // =========================================================================
  // 11. REFRESH TOKENS (5 records)
  // =========================================================================
  console.log('🔑 Seeding Refresh Tokens...');
  for (let i = 0; i < 5; i++) {
    const customer = customers[i]!;

    await prisma.refreshToken.create({
      data: {
        userId: customer.id,
        token: `sample_jwt_refresh_token_string_hash_${i + 1}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        revoked: false,
      },
    });
  }

  // =========================================================================
  // 12. NOTIFICATIONS (5 records)
  // =========================================================================
  console.log('🔔 Seeding Notifications...');
  const notifTypes = [
    NotificationType.BOOKING,
    NotificationType.PAYMENT,
    NotificationType.BOOKING,
    NotificationType.REVIEW,
    NotificationType.SYSTEM,
  ];

  for (let i = 0; i < 5; i++) {
    const customer = customers[i]!;
    const booking = bookings[i]!;
    const notifType = notifTypes[i]!;

    await prisma.notification.create({
      data: {
        userId: customer.id,
        type: notifType,
        title: `Notification Update #${i + 1}`,
        message: `Your booking status or service action #${i + 1} has been updated.`,
        isRead: i % 2 === 0,
        metadata: { bookingId: booking.id },
      },
    });
  }

  // =========================================================================
  // 13. FAVORITE TECHNICIANS (5 records)
  // =========================================================================
  console.log('❤️ Seeding Favorite Technicians...');
  for (let i = 0; i < 5; i++) {
    const customer = customers[i]!;
    const techProfile = technicianProfiles[i]!;

    await prisma.favoriteTechnician.create({
      data: {
        customerId: customer.id,
        technicianId: techProfile.id,
      },
    });
  }

  console.log('\n✅ Database seeding finished successfully! (5 records inserted per table)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding process:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });