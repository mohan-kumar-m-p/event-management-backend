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

@Entity()
export class Manager extends BaseEntity {
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

  @Column({ nullable: true })
  bedNumber: number;

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiry: Date;

  @Column({ default: 'false' })
  needAccomodation: string;

  @Column({ default: 'false' })
  isPaid: string;
}
