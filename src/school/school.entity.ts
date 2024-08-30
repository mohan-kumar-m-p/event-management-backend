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
}
