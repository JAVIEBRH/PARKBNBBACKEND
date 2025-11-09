import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

// Listing schemas
export const listingBasicSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  type: z.enum(['outdoor', 'indoor', 'covered', 'garage', 'street']),
});

export const listingAddressSchema = z.object({
  street: z.string().min(3, 'Ingresa una calle válida'),
  city: z.string().min(2, 'Ingresa una ciudad válida'),
  state: z.string().min(2, 'Ingresa un estado válido'),
  zipCode: z.string().optional(),
  country: z.string().default('US'),
});

export const pricingSchema = z.object({
  hourlyRate: z.number().min(1, 'La tarifa por hora debe ser mayor a 0'),
  dailyRate: z.number().min(0).optional(),
  weeklyRate: z.number().min(0).optional(),
  monthlyRate: z.number().min(0).optional(),
});

// Booking schemas
export const declineBookingSchema = z.object({
  reason: z.string().min(10, 'Por favor proporciona una razón (mínimo 10 caracteres)'),
});

// Bank account schema
export const bankAccountSchema = z.object({
  accountNumber: z.string().min(5, 'Número de cuenta inválido'),
  bankName: z.string().min(2, 'Nombre del banco requerido'),
  accountHolderName: z.string().min(2, 'Nombre del titular requerido'),
});




