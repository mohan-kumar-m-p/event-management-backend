import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class FieldEvents extends BaseEntity {
  @PrimaryColumn('uuid')
  eventId: string;

  @Column('uuid')
  athleteRegistrationId: string;
  
  @Column({ nullable: true })
  trial1Score: string;  

  @Column({ nullable: true })
  trial2Score: string;  

  @Column({ nullable: true })
  trial3Score: string;  

  @Column({ nullable: true })
  initialBestScore: string;  

  @Column({ nullable: true })
  initialPosition: string;  

  @Column({ nullable: true })
  trial4Score: string;  

  @Column({ nullable: true })
  trial5Score: string;  

  @Column({ nullable: true })
  trial6Score: string;  

  @Column({ nullable: true })
  finalBestScore: string;  

  @Column({ nullable: true })
  finalPosition: string;  
}
