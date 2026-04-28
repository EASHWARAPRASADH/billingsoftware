
const User = require('../backend/models/User');
const sequelize = require('../backend/config/database');

async function updatePassword() {
  try {
    const user = await User.findOne({ where: { email: 'itsupport@technosprint.net' } });
    if (user) {
      user.password = 'Poland@01';
      await user.save();
      console.log('Password updated successfully for itsupport@technosprint.net');
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    process.exit();
  }
}

updatePassword();
