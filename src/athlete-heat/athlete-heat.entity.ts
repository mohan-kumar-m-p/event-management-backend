import {
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
} from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Heat } from '../heat/heat.entity';

@Entity()
export class AthleteHeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Athlete, (athlete) => athlete.athleteHeats)
  @JoinColumn({ name: 'registrationId' })
  athlete: Athlete;

  @ManyToOne(() => Heat, (heat) => heat.athleteHeats)
  @JoinColumn({ name: 'heatId' })
  heat: Heat;

  @Column()
  lane: number;

  @Column({ nullable: true })
  position: number;

  @Column({ nullable: true })
  time: string;

  @Column({ default: false })
  qualifiedNextRound: boolean;
}
