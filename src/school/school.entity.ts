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

  @Column()
  state: string;

  @Column()
  district: string;

  @Column()
  address: string;

  @Column()
  nameOfPrincipal: string;

  @Column()
  contactName: string;

  @Column()
  contactNumber: string;

  @OneToMany(() => Athlete, (athlete) => athlete.school)
  athletes: Athlete[];

  @OneToMany(() => Manager, (manager) => manager.school)
  managers: Manager[];

  @OneToMany(() => Coach, (coach) => coach.school)
  coaches: Coach[];

  @Column({ type: 'timestamp', nullable: true })
  otp: string;

  @Column({ nullable: true })
  otpExpiry: Date;

  @Column({ nullable: true })
  transport: string;

  @Column({ type: 'date', nullable: true })
  dateOfArrival: Date;

  @Column({ type: 'time', nullable: true })
  timeOfArrival: string;

  @Column({ nullable: true })
  pickUpLocation: string;
}
