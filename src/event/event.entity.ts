import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { BaseEntity } from '../shared/base.entity';
import { EventCategory } from './enums/event-category.enum';
import { EventSportGroup } from './enums/event-sport-group.enum';
import { EventType } from './enums/event-type.enum';
import { Round } from '../round/round.entity';

@Entity()
export class Event extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  eventId: string;

  @Column() // 100m / Long Jump / 4x100m
  name: string;

  @Column({
    type: 'enum',
    enum: EventCategory,
  })
  category: EventCategory;

  @Column({
    type: 'enum',
    enum: EventSportGroup,
  })
  sportGroup: EventSportGroup;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  type: EventType;

  @Column()
  gender: string;

  @ManyToMany(() => Athlete, (athlete) => athlete.events)
  athletes: Athlete[];

  @OneToMany(() => Round, (round) => round.event)
  rounds: Round[];
}
