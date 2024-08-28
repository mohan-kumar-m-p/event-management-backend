import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { Accommodation } from '../accommodation/accommodation.entity';

@Entity()
export class Manager {
  @PrimaryGeneratedColumn('uuid')
  managerId: string;

  @Column()
  name: string;

  @ManyToOne(() => School, (school) => school.managers)
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

  // @Column({ type: 'text', nullable: true })
  // qrCode: string;

  @ManyToOne(() => Accommodation, (accommodation) => accommodation.managers)
  @JoinColumn({ name: 'accommodationId' })
  accommodation: Accommodation;
}
