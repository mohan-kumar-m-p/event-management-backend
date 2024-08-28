import { Athlete } from 'src/athlete/athlete.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EventCategory } from './enums/event-category.enum';
import { EventType } from './enums/event-type.enum';
import { EventSportGroup } from './enums/event-sport-group.enum';

@Entity()
export class Event {
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

  @Column({ nullable: true })
  price: string;

  @ManyToMany(() => Athlete, (athlete) => athlete.events)
  athletes: Athlete[];
}
