import Redis from 'ioredis';
export declare class RedisService {
    private readonly redis;
    constructor(redis: Redis);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(...keys: string[]): Promise<void>;
    incr(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<void>;
    keys(pattern: string): Promise<string[]>;
}
