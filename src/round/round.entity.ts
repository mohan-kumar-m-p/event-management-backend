import { Heat } from 'src/heat/heat.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Event } from '../event/event.entity';
import { BaseEntity } from '../shared/base.entity';
import { Round as RoundEnum } from './enums/round.enum';

@Entity()
export class Round extends BaseEntity {
  @PrimaryColumn()
  roundId: string;

  @Column({
    type: 'enum',
    enum: RoundEnum,
  })
  round: RoundEnum;

  @ManyToOne(() => Event, (event) => event.rounds)
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ nullable: true, type: 'date' })
  date: Date;

  @Column({ nullable: true, type: 'time' })
  time: string;

  @Column({ default: false })
  completed: boolean;

  @OneToMany(() => Heat, (heat) => heat.round)
  heats: Heat[];
}
