import { connectDB, pool, healthCheck, getConnectionStats } from './database';

async function main() {
  try {
    // Connect to the database
    await connectDB();

    // Example: Perform a simple query
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version);

    // Check database health
    const health = await healthCheck();
    console.log('🏥 Health check:', health);

    // Get connection statistics
    const stats = getConnectionStats();
    console.log('📊 Connection stats:', stats);

    console.log('\n✅ Database service is running...');

  } catch (error) {
    console.error('❌ Failed to start database service:', error);
    process.exit(1);
  }
}

// Start the application
main();

export { connectDB, pool, healthCheck, getConnectionStats };



