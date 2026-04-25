/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoomType = 'single' | 'double' | 'couple' | 'triple';
export type ItemCategory = 'beverage' | 'food' | 'service' | 'misc';

export interface Guest {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  email?: string;
  address?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  stock: number;
}

export interface Charge {
  id: string;
  itemId: string;
  quantity: number;
  priceAtTime: number;
  timestamp: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  timestamp: number;
  refId?: string; // e.g., bookingId
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'pix';
}

export interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  checkIn: number;
  checkOut: number;
  basePrice: number;
  charges: Charge[];
  status: 'active' | 'completed' | 'canceled' | 'reserved';
  adults: number;
  children: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'pix';
  registeredBy?: string;
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  pricePerNight: number;
  status: 'vago' | 'sujo' | 'manuntencao';
}

export type UserRole = 'admin' | 'receptionist';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string; // Optional because we might not want it in current user state
  role: UserRole;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AppUser | null;
}
