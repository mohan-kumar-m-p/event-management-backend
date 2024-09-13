import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class HighJump extends BaseEntity {
@PrimaryGeneratedColumn()
  id: string;

  @Column('uuid')
  eventId: string;

  @Column('uuid')
  registrationId: string;

  @Column({ type: 'json', nullable: true })
  score: Record<string, any>;

  @Column({ nullable: true })
  position: string;
}
