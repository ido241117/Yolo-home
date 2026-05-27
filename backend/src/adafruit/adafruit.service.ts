import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildEncryptionKey, decrypt } from '../common/encryption';
import { HardwareConfig } from '../room/entities/hardware-config.entity';

const AIO_BASE = 'https://io.adafruit.com/api/v2';

interface AioDataPoint {
  value: string;
  created_at: string;
  updated_at?: string;
}

@Injectable()
export class AdafruitService {
  private readonly encryptionKey: Buffer;

  constructor(
    @InjectRepository(HardwareConfig)
    private readonly hardwareConfigs: Repository<HardwareConfig>,
    private readonly config: ConfigService,
  ) {
    this.encryptionKey = buildEncryptionKey(
      this.config.get<string>('ENCRYPTION_KEY', 'default_dev_key_change_me'),
    );
  }

  private async getConfig(roomId: string): Promise<HardwareConfig> {
    const config = await this.hardwareConfigs.findOne({
      where: { room: { id: roomId } },
      relations: { room: true },
    });
    if (!config) throw new NotFoundException(`Hardware config not found for room ${roomId}`);
    return config;
  }

  private decryptKey(config: HardwareConfig): string {
    return decrypt(config.adafruitKeyEncrypted, this.encryptionKey);
  }

  private resolveFeedKey(config: HardwareConfig, logicalKey: string): string {
    return config.feedMapping?.[logicalKey] ?? logicalKey;
  }

  private async aioGet<T>(username: string, apiKey: string, path: string): Promise<T> {
    const res = await fetch(`${AIO_BASE}/${username}${path}`, {
      headers: { 'X-AIO-Key': apiKey },
    });
    if (!res.ok) {
      throw new BadGatewayException(`Adafruit IO error ${res.status}: ${path}`);
    }
    return res.json() as Promise<T>;
  }

  private async aioPost<T>(
    username: string,
    apiKey: string,
    path: string,
    body: unknown,
  ): Promise<T> {
    const res = await fetch(`${AIO_BASE}/${username}${path}`, {
      method: 'POST',
      headers: { 'X-AIO-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new BadGatewayException(`Adafruit IO error ${res.status}: ${path}`);
    }
    return res.json() as Promise<T>;
  }

  async readFeed(roomId: string, feedKey: string): Promise<string> {
    const cfg = await this.getConfig(roomId);
    const key = this.decryptKey(cfg);
    const feed = this.resolveFeedKey(cfg, feedKey);
    const data = await this.aioGet<AioDataPoint>(
      cfg.adafruitUsername,
      key,
      `/feeds/${feed}/data/last`,
    );
    return data.value;
  }

  async writeFeed(roomId: string, feedKey: string, value: string): Promise<void> {
    const cfg = await this.getConfig(roomId);
    const key = this.decryptKey(cfg);
    const feed = this.resolveFeedKey(cfg, feedKey);
    await this.aioPost(cfg.adafruitUsername, key, `/feeds/${feed}/data`, { value });
  }

  async getLastValue(
    roomId: string,
    feedKey: string,
  ): Promise<{ value: string; updatedAt: Date }> {
    const cfg = await this.getConfig(roomId);
    const key = this.decryptKey(cfg);
    const feed = this.resolveFeedKey(cfg, feedKey);
    const data = await this.aioGet<AioDataPoint>(
      cfg.adafruitUsername,
      key,
      `/feeds/${feed}/data/last`,
    );
    return {
      value: data.value,
      updatedAt: new Date(data.updated_at ?? data.created_at),
    };
  }

  async getFeedHistory(
    roomId: string,
    feedKey: string,
    limit = 50,
    startTime?: string,
    endTime?: string,
  ): Promise<Array<{ value: string; createdAt: Date }>> {
    const cfg = await this.getConfig(roomId);
    const key = this.decryptKey(cfg);
    const feed = this.resolveFeedKey(cfg, feedKey);
    const params = new URLSearchParams({ limit: String(limit) });
    if (startTime) params.set('start_time', startTime);
    if (endTime) params.set('end_time', endTime);
    const data = await this.aioGet<AioDataPoint[]>(
      cfg.adafruitUsername,
      key,
      `/feeds/${feed}/data?${params.toString()}`,
    );
    return data.map((d) => ({ value: d.value, createdAt: new Date(d.created_at) }));
  }

  async testConnection(username: string, apiKey: string): Promise<boolean> {
    try {
      const res = await fetch(`${AIO_BASE}/${username}/feeds`, {
        headers: { 'X-AIO-Key': apiKey },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async testConnectionForRoom(roomId: string): Promise<boolean> {
    const cfg = await this.getConfig(roomId);
    return this.testConnection(cfg.adafruitUsername, this.decryptKey(cfg));
  }
}
