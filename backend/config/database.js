const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL || process.env.INTERNAL_DATABASE_URL || process.env.RENDER_DATABASE_URL;

if (dbUrl) {
  console.log('✅ Found database URL in environment variables. Using PostgreSQL.');
} else {
  console.log('⚠️ No database URL found. Falling back to manual configuration.');
  console.log('Current DB_HOST:', process.env.DB_HOST || '127.0.0.1 (default)');
}

const sequelize = dbUrl 
  ? new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'u841409365_billingnew',
      process.env.DB_USER || 'u841409365_billingnew',
      process.env.DB_PASSWORD || process.env.DB_PASS,
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        dialect: process.env.DB_DIALECT || 'mysql',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: (process.env.DB_DIALECT === 'mysql' || !process.env.DB_DIALECT) ? {} : {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      }
    );

module.exports = sequelize;
