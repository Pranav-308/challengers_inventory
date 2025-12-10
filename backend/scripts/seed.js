require('dotenv').config();
const { createUser, deleteAllUsers } = require('../models/User');
const { createComponent, deleteAllComponents } = require('../models/Component');
const { deleteAllHistory } = require('../models/CheckoutHistory');
const { deleteAllRequests } = require('../models/ComponentRequest');

const seedData = async () => {
  try {
    console.log('🔥 Starting Firebase seed...');

    // Clear existing data
    await deleteAllUsers();
    await deleteAllComponents();
    await deleteAllHistory();
    await deleteAllRequests();
    console.log('🗑️  Cleared existing data');

    // Create Challengers Team Members
    // NOTE: Update this list with actual team members
    // Admins have full control, Members can checkout/return components
    const users = [];
    
    // ========== ADMINS ==========
    const admin1 = await createUser({
      username: 'pranav',
      password: 'challengers@2025',
      name: 'Pranav',
      email: 'pranavpavan308@gmail.com',
      phone: '+918217040641',
      role: 'admin',
      notificationPreferences: {
        email: true,
      },
    });
    users.push(admin1);

    // Add more admins here as needed:
    // const admin2 = await createUser({
    //   username: 'admin_username',
    //   password: 'secure_password',
    //   name: 'Admin Name',
    //   email: 'admin@email.com',
    //   phone: '+91XXXXXXXXXX',
    //   role: 'admin',
    // });
    // users.push(admin2);

    // ========== TEAM MEMBERS ==========
    const member1 = await createUser({
      username: 'member1',
      password: 'challengers@2025',
      name: 'Team Member 1',
      email: 'pranavpavan641@gmail.com',
      phone: '+919876543211',
      role: 'member',
      notificationPreferences: {
        email: true,
      },
    });
    users.push(member1);

    const member2 = await createUser({
      username: 'member2',
      password: 'challengers@2025',
      name: 'Team Member 2',
      email: 'member2@challengers.com',
      phone: '+919876543212',
      role: 'member',
      notificationPreferences: {
        email: true,
      },
    });
    users.push(member2);

    // Add more team members as needed - admins can also add them via the app

    console.log('👥 Created Challengers team members');

    // Create components with random quantities (1-10)
    const componentsData = [
      {
        componentId: 'ARD-001',
        name: 'Arduino Uno R3',
        category: 'Arduino',
        description: 'Standard Arduino Uno board with ATmega328P microcontroller',
        checkoutDuration: 7,
        totalQuantity: 8,
        availableQuantity: 8,
        imageUrl: '/uploads/components/component-1765302001268-556101185.jpg',
      },
      {
        componentId: 'ARD-002',
        name: 'Arduino Mega 2560',
        category: 'Arduino',
        description: 'Arduino Mega with 54 digital I/O pins and 16 analog inputs',
        checkoutDuration: 7,
        totalQuantity: 5,
        availableQuantity: 5,
        imageUrl: '/uploads/components/component-1765302136949-39240387.jpg',
      },
      {
        componentId: 'SENS-001',
        name: 'Ultrasonic Sensor HC-SR04',
        category: 'Sensor',
        description: 'Distance measuring sensor module',
        checkoutDuration: 14,
        totalQuantity: 10,
        availableQuantity: 10,
        imageUrl: '/uploads/components/component-1765302439041-111348474.jpg',
      },
      {
        componentId: 'SENS-002',
        name: 'DHT22 Temperature & Humidity Sensor',
        category: 'Sensor',
        description: 'Digital temperature and humidity sensor',
        checkoutDuration: 14,
        totalQuantity: 7,
        availableQuantity: 7,
        imageUrl: '/uploads/components/component-1765302586770-42782333.jpg',
      },
      {
        componentId: 'MOT-001',
        name: 'DC Motor with L298N Driver',
        category: 'Motor',
        description: 'DC motor with motor driver module',
        checkoutDuration: 10,
        totalQuantity: 6,
        availableQuantity: 6,
        imageUrl: '/uploads/components/component-1765302701249-101174591.jpg',
      },
      {
        componentId: 'MOT-002',
        name: 'Stepper Motor 28BYJ-48',
        category: 'Motor',
        description: '5V stepper motor with ULN2003 driver',
        checkoutDuration: 10,
        totalQuantity: 4,
        availableQuantity: 4,
        imageUrl: '/uploads/components/component-1765302779366-850783848.jpg',
      },
      {
        componentId: 'DISP-001',
        name: '16x2 LCD Display',
        category: 'Display',
        description: 'Character LCD display with I2C interface',
        checkoutDuration: 7,
        totalQuantity: 9,
        availableQuantity: 9,
        imageUrl: '/uploads/components/component-1765302868461-37372975.jpg',
      },
      {
        componentId: 'DISP-002',
        name: 'OLED Display 0.96"',
        category: 'Display',
        description: 'Small OLED display module 128x64',
        checkoutDuration: 7,
        totalQuantity: 3,
        availableQuantity: 3,
        imageUrl: '/uploads/components/component-1765302933420-28977138.jpg',
      },
      {
        componentId: 'TOOL-001',
        name: 'Soldering Iron Kit',
        category: 'Tool',
        description: 'Complete soldering kit with stand and accessories',
        checkoutDuration: 3,
        totalQuantity: 2,
        availableQuantity: 2,
        imageUrl: '/uploads/components/component-1765303036488-37729039.jpg',
      },
      {
        componentId: 'TOOL-002',
        name: 'Digital Multimeter',
        category: 'Tool',
        description: 'Digital multimeter for voltage, current, and resistance measurement',
        checkoutDuration: 3,
        totalQuantity: 4,
        availableQuantity: 4,
        imageUrl: '/uploads/components/component-1765303195033-337527577.jpg',
      },
    ];

    for (const compData of componentsData) {
      await createComponent(compData);
    }

    console.log('📦 Created components');

    console.log('\n✅ Firebase database seeded successfully!');
    console.log('\n📝 Challengers Team Login Credentials:');
    console.log('   ═══════════════════════════════════════');
    console.log('   ADMIN:  username=pranav, password=challengers@2025');
    console.log('   MEMBER: username=member1, password=challengers@2025');
    console.log('   MEMBER: username=member2, password=challengers@2025');
    console.log('   ═══════════════════════════════════════');
    console.log('\n💡 Admins can add new team members via the User Management page');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
