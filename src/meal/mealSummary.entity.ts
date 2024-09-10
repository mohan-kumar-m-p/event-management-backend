import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class MealSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 0 })
  totalMeals: number;

  @Column({ default: 0 })
  mealsConsumed: number;
}
