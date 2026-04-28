const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./config/database');
const User = require('./models/User');

async function resetPassword() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        const email = 'itsupport@technosprint.net';
        const newPassword = 'Poland@01';

        const user = await User.scope('withPassword').findOne({ where: { email } });
        if (!user) {
            console.log('User itsupport@technosprint.net not found, creating it...');
            await User.create({
                email,
                password: newPassword,
                businessName: 'TechnoSprint Support'
            });
            console.log('User created successfully');
        } else {
            user.password = newPassword;
            await user.save();
            console.log('Password reset successfully for', email);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();
