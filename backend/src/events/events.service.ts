import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventLog } from '../room/entities/event-log.entity';
import { EventQueryDto } from './dto/event-query.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventLog)
    private readonly eventLogs: Repository<EventLog>,
  ) {}

  async findAll(query: EventQueryDto) {
    const qb = this.eventLogs
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.room', 'room')
      .leftJoinAndSelect('e.actor', 'actor')
      .orderBy('e.createdAt', 'DESC')
      .take(query.limit ?? 50);

    if (query.roomId) qb.andWhere('room.id = :roomId', { roomId: query.roomId });
    if (query.userId) qb.andWhere('actor.id = :userId', { userId: query.userId });
    if (query.from) qb.andWhere('e.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('e.createdAt <= :to', { to: query.to });

    return qb.getMany();
  }
}
