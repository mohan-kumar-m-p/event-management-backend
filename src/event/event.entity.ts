import { Athlete } from 'src/athlete/athlete.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EventGroup } from './enums/event-group.enum';
import { EventType } from './enums/event-type.enum';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  eventId: string;

  @Column() // 100m / Long Jump / 4x100m
  name: string;

  @Column({
    type: 'enum',
    enum: EventGroup,
  })
  group: EventGroup;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  type: EventType;

  @Column()
  gender: string;

  @Column({ nullable: true })
  price: string;

  @ManyToMany(() => Athlete, (athlete) => athlete.events)
  athletes: Athlete[];
}
