import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Accommodation } from 'src/accommodation/accommodation.entity';
@Entity()
export class Block {
  @PrimaryGeneratedColumn('uuid')
  blockId: string;

  @Column()
  name: string;

  @Column()
  capacity: number;

  @OneToMany(() => Accommodation, (accommodation) => accommodation.block)
  accommodations: Accommodation[];
}
