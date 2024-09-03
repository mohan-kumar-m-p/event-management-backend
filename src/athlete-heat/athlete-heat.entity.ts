import { Entity, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Heat } from '../heat/heat.entity';

@Entity()
export class AthleteHeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Athlete, (athlete) => athlete.athleteHeats)
  athlete: Athlete;

  @ManyToOne(() => Heat, (heat) => heat.athleteHeats)
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
