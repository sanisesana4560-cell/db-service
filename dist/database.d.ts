import { Pool, QueryResult } from 'pg';
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
declare const pool: Pool;
declare const connectDB: () => Promise<Pool>;
declare const getConnectionStats: () => PoolStats;
declare const logConnectionStats: () => void;
declare const healthCheck: () => Promise<HealthCheckResponse>;
export { connectDB, pool, getConnectionStats, logConnectionStats, healthCheck, PoolStats, HealthCheckResponse, ConnectionStats, };
declare const _default: {
    connectDB: () => Promise<Pool>;
    pool: Pool;
    query: {
        <T extends import("pg").Submittable>(queryStream: T): T;
        <R extends any[] = any[], I = any[]>(queryConfig: import("pg").QueryArrayConfig<I>, values?: import("pg").QueryConfigValues<I>): Promise<import("pg").QueryArrayResult<R>>;
        <R extends import("pg").QueryResultRow = any, I = any[]>(queryConfig: import("pg").QueryConfig<I>): Promise<QueryResult<R>>;
        <R extends import("pg").QueryResultRow = any, I = any[]>(queryTextOrConfig: string | import("pg").QueryConfig<I>, values?: import("pg").QueryConfigValues<I>): Promise<QueryResult<R>>;
        <R extends any[] = any[], I = any[]>(queryConfig: import("pg").QueryArrayConfig<I>, callback: (err: Error, result: import("pg").QueryArrayResult<R>) => void): void;
        <R extends import("pg").QueryResultRow = any, I = any[]>(queryTextOrConfig: string | import("pg").QueryConfig<I>, callback: (err: Error, result: QueryResult<R>) => void): void;
        <R extends import("pg").QueryResultRow = any, I = any[]>(queryText: string, values: import("pg").QueryConfigValues<I>, callback: (err: Error, result: QueryResult<R>) => void): void;
    };
    getConnectionStats: () => PoolStats;
    logConnectionStats: () => void;
    healthCheck: () => Promise<HealthCheckResponse>;
};
export default _default;
//# sourceMappingURL=database.d.ts.map