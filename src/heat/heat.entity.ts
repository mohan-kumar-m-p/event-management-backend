import { AthleteHeat } from 'src/athlete-heat/athlete-heat.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Round } from '../round/round.entity';
import { BaseEntity } from '../shared/base.entity';
@Entity()
export class Heat extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  heatId: string;

  @Column()
  heatName: string;

  @Column('simple-array')
  athletePlacements: string[];

  @ManyToOne(() => Round, (round) => round.heats)
  round: Round;

  @OneToMany(() => AthleteHeat, (athleteHeat) => athleteHeat.heat)
  athleteHeats: AthleteHeat[];
}
