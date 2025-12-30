const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./config/database');
const User = require('./models/User');
const BusinessProfile = require('./models/BusinessProfile');

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        // Sync models to ensure tables exist
        await sequelize.sync();

        const email = 'admin@example.com';
        const password = 'password123';
        const businessName = 'Admin Business';

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const user = await User.create({
            email,
            password,
            businessName
        });

        await BusinessProfile.create({
            userId: user.id,
            businessName
        });

        console.log('Admin user created successfully');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
