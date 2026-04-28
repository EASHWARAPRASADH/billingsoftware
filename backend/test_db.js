const sequelize = require('./config/database');

async function test() {
    try {
        await sequelize.authenticate();
        console.log('Database connection OK');
        const [results] = await sequelize.query('SELECT 1+1 as result');
        console.log('Query result:', results[0].result);
        process.exit(0);
    } catch (e) {
        console.error('Database test failed:', e);
        process.exit(1);
    }
}
test();
