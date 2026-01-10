import { Pool, PoolConfig, QueryResult, PoolClient } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Types
interface ConnectionStats {
  acquired: number;
  released: number;
  created: number;
  removed: number;
}

interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  max: number;
  usage: string;
  stats: ConnectionStats;
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  connections?: PoolStats;
  error?: string;
  timestamp: string;
}

// Hybrid Database configuration
const dbConfig: PoolConfig = process.env.POSTGRES_URL
  ? {
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

// Create a new pool instance
const pool = new Pool(dbConfig);

// Connection monitoring
class ConnectionMonitor {
  private totalConnections: number = 0;
  private activeConnections: number = 0;
  private idleConnections: number = 0;
  private waitingClients: number = 0;
  private connectionStats: ConnectionStats = {
    acquired: 0,
    released: 0,
    created: 0,
    removed: 0,
  };

  updateStats(): void {
    this.totalConnections = pool.totalCount;
    this.idleConnections = pool.idleCount;
    this.activeConnections = pool.totalCount - pool.idleCount;
    this.waitingClients = pool.waitingCount;
  }

  getStats(): PoolStats {
    this.updateStats();
    return {
      total: this.totalConnections,
      active: this.activeConnections,
      idle: this.idleConnections,
      waiting: this.waitingClients,
      max: pool.options.max || 20,
      usage: `${this.activeConnections}/${pool.options.max || 20}`,
      stats: this.connectionStats,
    };
  }

  logStats(): void {
    const stats = this.getStats();
    console.log('📊 Database Connection Stats:', {
      active: `${stats.active}/${stats.max}`,
      idle: stats.idle,
      waiting: stats.waiting,
      usage: `${((stats.active / stats.max) * 100).toFixed(1)}%`,
    });
  }

  incrementAcquired(): void {
    this.connectionStats.acquired++;
  }

  incrementReleased(): void {
    this.connectionStats.released++;
  }

  incrementCreated(): void {
    this.connectionStats.created++;
  }

  incrementRemoved(): void {
    this.connectionStats.removed++;
  }
}

// Initialize monitor
const monitor = new ConnectionMonitor();

// Instrument the pool to track connections
const originalQuery = pool.query.bind(pool);
pool.query = function (queryTextOrConfig: any, values?: any): any {
  monitor.incrementAcquired();
  monitor.updateStats();

  const startTime = Date.now();
  return originalQuery(queryTextOrConfig, values)
    .then((result: any) => {
      monitor.incrementReleased();
      monitor.updateStats();

      const duration = Date.now() - startTime;
      if (duration > 1000) {
        // Log slow queries
        const queryText = typeof queryTextOrConfig === 'string'
          ? queryTextOrConfig
          : queryTextOrConfig.text || '';
        console.warn(`⚠️ Slow query detected: ${duration}ms`, {
          query: queryText.substring(0, 100) + '...',
        });
      }

      return result;
    })
    .catch((error: Error) => {
      monitor.incrementReleased();
      monitor.updateStats();
      throw error;
    });
} as typeof pool.query;

// Track connection lifecycle
pool.on('connect', (client: PoolClient) => {
  monitor.incrementCreated();
  monitor.updateStats();
  console.log('🔗 New database connection created');
});

pool.on('acquire', (client: PoolClient) => {
  monitor.incrementAcquired();
  monitor.updateStats();
});

pool.on('release', () => {
  monitor.incrementReleased();
  monitor.updateStats();
});

pool.on('remove', (client: PoolClient) => {
  monitor.incrementRemoved();
  monitor.updateStats();
  console.log('🗑️ Database connection removed');
});

// Test database connection
const connectDB = async (): Promise<Pool> => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully');

    const result = await client.query('SELECT NOW()');
    console.log('🕒 Database time:', result.rows[0].now);

    // Log initial stats
    monitor.logStats();

    client.release();
    return pool;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database connection failed:', errorMessage);
    throw error;
  }
};

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
  monitor.updateStats();
});

// Export monitoring functions
const getConnectionStats = (): PoolStats => monitor.getStats();
const logConnectionStats = (): void => monitor.logStats();

// Auto-log stats every 30 seconds (optional)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    monitor.logStats();
  }, 30000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down database pool...');

  // Log final stats
  const finalStats = monitor.getStats();
  console.log('📊 Final connection stats:', finalStats);

  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

// Health check endpoint helper
const healthCheck = async (): Promise<HealthCheckResponse> => {
  try {
    const stats = monitor.getStats();
    await pool.query('SELECT 1 as health_check');

    return {
      status: 'healthy',
      database: 'connected',
      connections: stats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
};

export {
  connectDB,
  pool,
  getConnectionStats,
  logConnectionStats,
  healthCheck,
  PoolStats,
  HealthCheckResponse,
  ConnectionStats,
};

// Default export for convenience
export default {
  connectDB,
  pool,
  query: pool.query.bind(pool),
  getConnectionStats,
  logConnectionStats,
  healthCheck,
};
