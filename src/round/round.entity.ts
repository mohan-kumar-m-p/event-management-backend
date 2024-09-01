import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../shared/base.entity';
import { Event } from '../event/event.entity';
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
  event: Event;

  @Column()
  date: Date;

  @Column({ type: 'time' })
  time: string;
}
