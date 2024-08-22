import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Manager } from 'src/manager/manager.entity';
import { Coach } from 'src/coach/coach.entity';
import { Block } from 'src/block/block.entity';

@Entity()
export class Accommodation {
  @PrimaryGeneratedColumn('uuid')
  accommodationId: string;

  @Column()
  name: string;

  @Column()
  capacity: number;

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
