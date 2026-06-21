const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashed = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hostel.com' },
    update: {},
    create: { name: 'Hostel Admin', email: 'admin@hostel.com', password: hashed, role: 'OWNER' }
  });
  console.log('Admin user created: admin@hostel.com / admin123');

  const hostel = await prisma.hostel.create({
    data: { name: 'Sri Venkateswara Boys Hostel', address: '123 Main Road, Tadpatri, AP', phone: '9876543210', email: 'admin@hostel.com' }
  });

  await prisma.user.update({ where: { id: admin.id }, data: { hostelId: hostel.id } });

  const blockA = await prisma.block.create({ data: { name: 'A', hostelId: hostel.id } });
  const floor1 = await prisma.floor.create({ data: { number: 1, blockId: blockA.id } });
  const floor2 = await prisma.floor.create({ data: { number: 2, blockId: blockA.id } });

  const blockB = await prisma.block.create({ data: { name: 'B', hostelId: hostel.id } });
  const floor3 = await prisma.floor.create({ data: { number: 1, blockId: blockB.id } });

  const roomsData = [
    { roomNumber: 'A-101', floorId: floor1.id, roomType: 'TRIPLE',       totalBeds: 3, monthlyRent: 4500, meterNumber: 'EB001' },
    { roomNumber: 'A-102', floorId: floor1.id, roomType: 'DOUBLE',       totalBeds: 2, monthlyRent: 5500, meterNumber: 'EB002' },
    { roomNumber: 'A-201', floorId: floor2.id, roomType: 'TRIPLE',       totalBeds: 3, monthlyRent: 4500, meterNumber: 'EB003' },
    { roomNumber: 'A-202', floorId: floor2.id, roomType: 'DOUBLE',       totalBeds: 2, monthlyRent: 5500, meterNumber: 'EB004' },
    { roomNumber: 'B-101', floorId: floor3.id, roomType: 'FOUR_SHARING', totalBeds: 4, monthlyRent: 3500, meterNumber: 'EB005' },
    { roomNumber: 'B-102', floorId: floor3.id, roomType: 'DOUBLE',       totalBeds: 2, monthlyRent: 5500, meterNumber: 'EB006' },
  ];

  const rooms = [];
  for (const rd of roomsData) {
    const bedData = [];
    for (let i = 1; i <= rd.totalBeds; i++) {
      bedData.push({ bedNumber: i, isOccupied: false });
    }
    const room = await prisma.room.create({
      data: {
        roomNumber: rd.roomNumber,
        floorId: rd.floorId,
        roomType: rd.roomType,
        totalBeds: rd.totalBeds,
        monthlyRent: rd.monthlyRent,
        meterNumber: rd.meterNumber,
        beds: { create: bedData }
      },
      include: { beds: true }
    });
    rooms.push(room);
  }
  console.log('Created ' + rooms.length + ' rooms');

  const tenantsData = [
    { name: 'Ravi Kumar',   phone: '9876500001', email: 'ravi@example.com',    roomIdx: 0, bedIdx: 0, rent: 4500 },
    { name: 'Suresh Reddy', phone: '9876500002', email: 'suresh@example.com',  roomIdx: 0, bedIdx: 1, rent: 4500 },
    { name: 'Manoj Sharma', phone: '9876500003', email: 'manoj@example.com',   roomIdx: 1, bedIdx: 0, rent: 5500 },
    { name: 'Pradeep Nair', phone: '9876500004', email: 'pradeep@example.com', roomIdx: 2, bedIdx: 0, rent: 4500 },
    { name: 'Arun Babu',    phone: '9876500005', email: 'arun@example.com',    roomIdx: 3, bedIdx: 0, rent: 5500 },
    { name: 'Kiran Rao',    phone: '9876500006', email: 'kiran@example.com',   roomIdx: 4, bedIdx: 0, rent: 3500 },
    { name: 'Vijay Prasad', phone: '9876500007', email: 'vijay@example.com',   roomIdx: 4, bedIdx: 1, rent: 3500 },
    { name: 'Ganesh Kumar', phone: '9876500008', email: 'ganesh@example.com',  roomIdx: 5, bedIdx: 0, rent: 5500 },
  ];

  const now = new Date();
  const tenants = [];

  for (const td of tenantsData) {
    const bed = rooms[td.roomIdx].beds[td.bedIdx];
    const tenant = await prisma.tenant.create({
      data: {
        name: td.name,
        phone: td.phone,
        email: td.email,
        joiningDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
        rentAmount: td.rent,
        securityDeposit: td.rent * 2,
        bedId: bed.id,
        status: 'ACTIVE'
      }
    });
    await prisma.bed.update({ where: { id: bed.id }, data: { isOccupied: true } });

    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const isPast = i > 0;
      const isRandomPaid = Math.random() > 0.25;
      const status = isPast
        ? (isRandomPaid ? 'PAID' : 'OVERDUE')
        : (isRandomPaid ? 'PAID' : 'UNPAID');
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          amount: td.rent,
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          dueDate: new Date(d.getFullYear(), d.getMonth(), 5),
          status: status,
          paidDate: isRandomPaid ? new Date(d.getFullYear(), d.getMonth(), 3) : null,
          dueAmount: isRandomPaid ? 0 : td.rent,
          method: isRandomPaid ? 'CASH' : null
        }
      });
    }
    tenants.push(tenant);
  }
  console.log('Created ' + tenants.length + ' tenants with payment history');

  await prisma.tenant.update({
    where: { id: tenants[2].id },
    data: {
      status: 'NOTICE_GIVEN',
      vacateDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12)
    }
  });

  const complaintData = [
    { tenantId: tenants[0].id, category: 'WATER',       title: 'No water supply in morning',    description: 'Water is not available between 6-8 AM daily.', status: 'OPEN' },
    { tenantId: tenants[1].id, category: 'ELECTRICITY', title: 'Fan not working in room',       description: 'Ceiling fan stopped working yesterday.',       status: 'IN_PROGRESS' },
    { tenantId: tenants[3].id, category: 'CLEANING',    title: 'Common area not cleaned',       description: 'Corridor has not been swept for 3 days.',      status: 'OPEN' },
    { tenantId: tenants[4].id, category: 'INTERNET',    title: 'WiFi very slow after 9 PM',     description: 'Internet speed drops badly after 9 PM.',       status: 'RESOLVED', resolvedAt: new Date() },
  ];
  for (const c of complaintData) {
    await prisma.complaint.create({ data: c });
  }
  console.log('Created ' + complaintData.length + ' complaints');

  for (let ri = 0; ri < 4; ri++) {
    const room = rooms[ri];
    const prevReading = Math.floor(Math.random() * 1000) + 500;
    const currReading = prevReading + Math.floor(Math.random() * 80) + 40;
    const units = currReading - prevReading;
    const totalBill = units * 7.0;

    const occupiedBeds = room.beds.filter(function(b) { return b.isOccupied; });
    const tenantCount = occupiedBeds.length > 0 ? occupiedBeds.length : 1;
    const perTenant = totalBill / tenantCount;

    const bill = await prisma.ebBill.create({
      data: {
        roomId: room.id,
        previousReading: prevReading,
        currentReading: currReading,
        unitsConsumed: units,
        costPerUnit: 7.0,
        totalBill: totalBill,
        billingMonth: now.getMonth() + 1,
        billingYear: now.getFullYear()
      }
    });

    for (const bed of occupiedBeds) {
      const tenant = await prisma.tenant.findFirst({
        where: { bedId: bed.id, status: { in: ['ACTIVE', 'NOTICE_GIVEN'] } }
      });
      if (tenant) {
        await prisma.ebSplit.create({
          data: { ebBillId: bill.id, tenantId: tenant.id, amount: perTenant }
        });
      }
    }
  }
  console.log('Created EB bills');

  await prisma.notification.createMany({
    data: [
      { userId: admin.id, title: 'New Tenant Added',   message: 'Ravi Kumar has been assigned to Room A-101, Bed 1.',    type: 'NEW_TENANT', isRead: false },
      { userId: admin.id, title: 'Rent Due Reminder',  message: '3 tenants have unpaid rent for this month.',            type: 'RENT_DUE',   isRead: false },
      { userId: admin.id, title: 'Upcoming Vacate',    message: 'Manoj Sharma will vacate in 12 days.',                  type: 'VACATE',     isRead: false },
      { userId: admin.id, title: 'New Complaint',      message: 'Water supply complaint raised in Room A-101.',          type: 'COMPLAINT',  isRead: false },
    ]
  });
  console.log('Created notifications');

  console.log('\nSeed complete!');
  console.log('Login: admin@hostel.com / admin123');
}

main()
  .catch(function(e) { console.error(e); process.exit(1); })
  .finally(function() { prisma.$disconnect(); });
