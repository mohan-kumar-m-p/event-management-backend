import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class HighJump extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  registrationId: string;

  @Column('uuid')
  eventId: string;

  @Column({ type: 'json', nullable: true })
  scores: number[][];
}
