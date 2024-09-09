import { Athlete } from 'src/athlete/athlete.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { School } from '../school/school.entity';
import { BaseEntity } from '../shared/base.entity';

@Entity()
export class CulturalProgram extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Athlete, (athlete) => athlete.culturalPrograms)
  @JoinColumn({ name: 'athleteId' })
  athlete: Athlete;

  @ManyToOne(() => School, (school) => school.athletes)
  @JoinColumn({ name: 'affiliationNumber' })
  school: School;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  time: string;

  @Column()
  category: string;

  @Column({ type: 'text', nullable: true })
  mediaUrl: string;
}
