import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { BaseEntity } from '../shared/base.entity';

@Entity()
export class School extends BaseEntity {
  @PrimaryColumn()
  affiliationNumber: string;

  @Column()
  name: string;

  @Column()
  emailId: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  nameOfPrincipal: string;

  @Column({ nullable: true })
  contactName: string;

  @Column({ nullable: true })
  contactNumber: string;

  @OneToMany(() => Athlete, (athlete) => athlete.school)
  athletes: Athlete[];

  @OneToMany(() => Manager, (manager) => manager.school)
  managers: Manager[];

  @OneToMany(() => Coach, (coach) => coach.school)
  coaches: Coach[];

  @Column({ nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiry: Date;

  @Column({ nullable: true })
  transport: string;

  @Column({ type: 'date', nullable: true })
  dateOfArrival: Date;

  @Column({ type: 'time', nullable: true })
  timeOfArrival: string;

  @Column({ nullable: true })
  pickUpLocation: string;

  @Column({ default: 'false' })
  accommodationRequired: string;

  @Column({ default: 'false' })
  isPaid: string;
}
