import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Cart } from '../../cart/entities/cart.entity';

// Enum de roles de usuario
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nombre?: string;

  @Column({ nullable: true })
  apellido?: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  // Verificación de correo
  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpiresAt?: Date | null;

  // Recuperación de contraseña
  @Column({ nullable: true })
  resetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiresAt?: Date | null;

  // Relación con órdenes
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  // Relación con carritos
  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];
}
