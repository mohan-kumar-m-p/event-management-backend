import { Entity, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Manager } from 'src/manager/manager.entity';
import { Coach } from 'src/coach/coach.entity';

@Entity()
export class School {
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
}
