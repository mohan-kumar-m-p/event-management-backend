import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../shared/base.entity';
import { OrganizerRole } from '../shared/roles';

@Entity({ name: 'organizer' })
export class Organizer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: OrganizerRole, array: true, nullable: true })
  roles: OrganizerRole[];
}
