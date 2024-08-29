import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdOn: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  modifiedOn: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedOn: Date;

  @Column({ nullable: true, type: 'jsonb' })
  extensors: Record<string, string>;
}
