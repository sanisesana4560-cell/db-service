"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectionStats = exports.healthCheck = exports.pool = exports.connectDB = void 0;
const database_1 = require("./database");
Object.defineProperty(exports, "connectDB", { enumerable: true, get: function () { return database_1.connectDB; } });
Object.defineProperty(exports, "pool", { enumerable: true, get: function () { return database_1.pool; } });
Object.defineProperty(exports, "healthCheck", { enumerable: true, get: function () { return database_1.healthCheck; } });
Object.defineProperty(exports, "getConnectionStats", { enumerable: true, get: function () { return database_1.getConnectionStats; } });
async function main() {
    try {
        // Connect to the database
        await (0, database_1.connectDB)();
        // Example: Perform a simple query
        const result = await database_1.pool.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('📅 Current time:', result.rows[0].current_time);
        console.log('🐘 PostgreSQL version:', result.rows[0].pg_version);
        // Check database health
        const health = await (0, database_1.healthCheck)();
        console.log('🏥 Health check:', health);
        // Get connection statistics
        const stats = (0, database_1.getConnectionStats)();
        console.log('📊 Connection stats:', stats);
        console.log('\n✅ Database service is running...');
    }
    catch (error) {
        console.error('❌ Failed to start database service:', error);
        process.exit(1);
    }
}
// Start the application
main();
//# sourceMappingURL=index.js.map