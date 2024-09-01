import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Block } from '../block/block.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { BaseEntity } from '../shared/base.entity';

@Entity()
export class Accommodation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  accommodationId: string;

  @Column()
  name: string;

  @Column()
  capacity: number;

  @Column({ nullable: true })
  vacancies: number;

  @ManyToOne(() => Block, (block) => block.accommodations)
  @JoinColumn({ name: 'blockId' })
  block: Block;

  @OneToMany(() => Athlete, (athlete) => athlete.accommodation)
  athletes: Athlete[];

  @OneToMany(() => Manager, (manager) => manager.accommodation)
  managers: Manager[];

  @OneToMany(() => Coach, (coach) => coach.accommodation)
  coaches: Coach[];
}
