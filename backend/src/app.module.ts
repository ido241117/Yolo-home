import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdafruitModule } from './adafruit/adafruit.module';
import { AiModule } from './ai/ai.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventsModule } from './events/events.module';
import { GlobalDevicesModule } from './global-devices/global-devices.module';
import { HealthModule } from './health/health.module';
import { MobileModule } from './mobile/mobile.module';
import { RoomModule } from './room/room.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'dadn'),
        password: config.get<string>('DB_PASSWORD', 'dadn_password'),
        database: config.get<string>('DB_DATABASE', 'dadn'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'true') === 'true',
      }),
    }),
    HealthModule,
    UserModule,
    AuthModule,
    RoomModule,
    DashboardModule,
    MobileModule,
    AdafruitModule,
    AiModule,
    EventsModule,
    GlobalDevicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
