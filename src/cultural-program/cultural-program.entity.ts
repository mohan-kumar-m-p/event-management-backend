import { Athlete } from 'src/athlete/athlete.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { BaseEntity } from '../shared/base.entity';
import { ProgramCategory } from './enum/program-category.enum';

@Entity()
export class CulturalProgram extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Athlete, (athlete) => athlete.culturalProgram)
  @JoinColumn({ name: 'athleteId' })
  athlete: Athlete;

  @ManyToOne(() => School, (school) => school.athletes)
  @JoinColumn({ name: 'affiliationNumber' })
  school: School;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  time: string;

  @Column({
    type: 'enum',
    enum: ProgramCategory,
  })
  category: ProgramCategory;

  @Column({ type: 'text', nullable: true })
  mediaUrl: string;
}
