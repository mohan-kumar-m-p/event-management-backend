import { Exclude } from 'class-transformer';
import { AthleteHeat } from 'src/athlete-heat/athlete-heat.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Accommodation } from '../accommodation/accommodation.entity';
import { CulturalProgram } from '../cultural-program/cultural-program.entity';
import { Event } from '../event/event.entity';
import { School } from '../school/school.entity';
import { BaseEntity } from '../shared/base.entity';

const defaultMealDetails = {
  // TODO : change this back to 27th, 28th, 29th, 30 September
  '2024-09-15': 5,
  '2024-09-16': 5,
  '2024-09-17': 5,
  '2024-09-18': 5,
  '2024-09-19': 5,
};

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

  @Column({ nullable: true, unique: true, length: 12 })
  aadhaarNumber: string;

  @Column({ nullable: true, length: 5 }) // last 5 digits of aadhaar
  chestNumber: string;

  @Column()
  phone: string;

  @Column({ unique: true })
  emailId: string;

  @Column({ nullable: true })
  nameOfFather: string;

  @Column({ nullable: true })
  nameOfMother: string;

  @Column()
  class: string;

  @Column({ type: 'int', default: 5 })
  mealsRemaining: number;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @ManyToOne(() => Accommodation, (accommodation) => accommodation.athletes)
  @JoinColumn({ name: 'accommodationId' })
  accommodation: Accommodation;

  @Column({ nullable: true })
  bedNumber: number;

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

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiry: Date;

  @OneToMany(() => AthleteHeat, (athleteHeat) => athleteHeat.athlete)
  athleteHeats: AthleteHeat[];

  @OneToMany(
    () => CulturalProgram,
    (culturalProgram) => culturalProgram.athlete,
  )
  culturalPrograms: CulturalProgram[];

  @Column({ type: 'json', default: defaultMealDetails })
  mealDetails: Record<string, any>;

  @Exclude()
  @Column({ update: false })
  password: string;
}
