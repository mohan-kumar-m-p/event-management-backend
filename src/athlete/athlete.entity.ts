import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Accommodation } from '../accommodation/accommodation.entity';
import { Event } from '../event/event.entity';
import { School } from '../school/school.entity';
import { BaseEntity } from '../shared/base.entity';

@Entity()
export class Athlete extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  registrationId: string;

  @Column()
  name: string;

  @ManyToOne(() => School, (school) => school.athletes)
  @JoinColumn({ name: 'affiliationNumber' })
  school: School;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ length: 1 }) // (M/F)
  gender: string;

  @Column({ length: 12 })
  aadhaarNumber: string;

  @Column({ length: 5 }) // last 5 digits of aadhaar
  chestNumber: string;

  @Column()
  phone: string;

  @Column()
  emailId: string;

  @Column()
  nameOfFather: string;

  @Column()
  nameOfMother: string;

  @Column()
  class: string;

  @Column()
  admissionNumber: string;

  @Column({ type: 'int', default: 5 })
  mealsRemaining: number;

  @Column({ default: false })
  paid: boolean;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  // @Column({ type: 'text', nullable: true })
  // qrCode: string;

  @ManyToOne(() => Accommodation, (accommodation) => accommodation.athletes)
  @JoinColumn({ name: 'accommodationId' })
  accommodation: Accommodation;

  @ManyToMany(() => Event, (event) => event.athletes)
  @JoinTable({
    name: 'athlete_events',
    joinColumn: {
      name: 'athleteId',
      referencedColumnName: 'registrationId',
    },
    inverseJoinColumn: {
      name: 'eventId',
      referencedColumnName: 'eventId',
    },
  })
  events: Event[];
}
