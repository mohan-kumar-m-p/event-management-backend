import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class HighJump extends BaseEntity {
  @PrimaryColumn('uuid')
  eventId: string;

  @Column('uuid')
  athleteRegistrationId: string;

  @Column({ nullable: true })
  bestScore: string;

  @Column({ nullable: true })
  position: string;
}
