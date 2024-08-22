import { Athlete } from 'src/athlete/athlete.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  eventId: string;

  @Column()
  name: string;

  @Column()
  group: string;

  @Column()
  gender: string;

  @Column()
  price: string;

  @ManyToMany(() => Athlete, (athlete) => athlete.events)
  athletes: Athlete[];
}
