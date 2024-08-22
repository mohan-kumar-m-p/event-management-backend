import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Accommodation } from '../accommodation/accommodation.entity';
import { School } from '../school/school.entity';

@Entity()
export class Coach {
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

  @Column({ length: 12 })
  aadhaarNumber: string;

  @Column()
  phone: string;

  @Column()
  emailId: string;

  @Column({ type: 'int', default: 5 })
  mealsRemaining: number;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  qrCode: string;

  @ManyToOne(() => Accommodation, (accommodation) => accommodation.coaches)
  @JoinColumn({ name: 'accommodationId' })
  accommodation: Accommodation;
}
