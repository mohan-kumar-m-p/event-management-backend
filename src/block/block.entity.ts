import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Accommodation } from '../accommodation/accommodation.entity';
import { BaseEntity } from '../shared/base.entity';
@Entity()
export class Block extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  blockId: string;

  @Column()
  name: string;

  @Column()
  capacity: number;

  @OneToMany(() => Accommodation, (accommodation) => accommodation.block)
  accommodations: Accommodation[];
}
