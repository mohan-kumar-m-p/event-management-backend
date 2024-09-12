import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class HighJump extends BaseEntity {
  @PrimaryColumn('uuid')
  eventId: string;

  @Column('uuid')
  registrationId: string;

  @Column({ type: 'json', nullable: true })
  score: Record<string, any>;

  @Column({ nullable: true })
  position: string;
}
