import { Exclude } from 'class-transformer';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Accommodation } from '../accommodation/accommodation.entity';
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
export class Coach extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  coachId: string;

  @Column()
  name: string;

  @ManyToOne(() => School, (school) => school.coaches)
  @JoinColumn({ name: 'affiliationNumber' })
  school: School;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ length: 1 }) // (M/F)
  gender: string;

  @Column({ unique: true, nullable: true, length: 12 })
  aadhaarNumber: string;

  @Column()
  phone: string;

  @Column()
  emailId: string;

  @Column({ type: 'int', default: 5 })
  mealsRemaining: number;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @ManyToOne(() => Accommodation, (accommodation) => accommodation.coaches)
  @JoinColumn({ name: 'accommodationId' })
  accommodation: Accommodation;

  @Column({ nullable: true })
  bedNumber: number;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiry: Date;

  @Column({ type: 'json', default: defaultMealDetails })
  mealDetails: Record<string, any>;

  @Exclude()
  @Column({ update: false })
  password: string;
}
