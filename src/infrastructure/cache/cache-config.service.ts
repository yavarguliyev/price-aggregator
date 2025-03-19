import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CacheModuleOptions, CacheOptionsFactory } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-yet";

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
  constructor(private configService: ConfigService) {}

  async createCacheOptions(): Promise<CacheModuleOptions> {
    const ttl = this.configService.get<number>("CACHE_TTL") || 60000;
    const host = this.configService.get<string>("REDIS_HOST") || "localhost";
    const port = this.configService.get<number>("REDIS_PORT") || 6379;

    return { store: await redisStore({ socket: { host, port }, ttl }), ttl };
  }
}
