import { NextResponse } from 'next/server';

export function validateRequired(body: Record<string, any>, fields: string[]) {
  const missing = fields.filter((f) => {
    const val = body[f];
    return val === undefined || val === null || val === '';
  });
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    );
  }
  return null;
}

export function validateNumber(value: any, field: string, min?: number, max?: number) {
  const num = Number(value);
  if (isNaN(num)) {
    return NextResponse.json({ error: `${field} must be a valid number` }, { status: 400 });
  }
  if (min !== undefined && num < min) {
    return NextResponse.json({ error: `${field} must be at least ${min}` }, { status: 400 });
  }
  if (max !== undefined && num > max) {
    return NextResponse.json({ error: `${field} must be at most ${max}` }, { status: 400 });
  }
  return null;
}

export function validateEnum(value: any, field: string, allowed: string[]) {
  if (!allowed.includes(value)) {
    return NextResponse.json(
      { error: `${field} must be one of: ${allowed.join(', ')}` },
      { status: 400 }
    );
  }
  return null;
}

export function handleApiError(err: unknown, defaultMessage: string) {
  console.error(defaultMessage, err);
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}

import { z } from 'zod';

export const institutionRegisterSchema = z.object({
  name: z.string().min(1, 'Institution name is required').max(200, 'Name too long'),
  location: z.string().min(5, 'Location must be at least 5 characters').max(300),
  owner: z.string().min(2, 'Owner name required').max(150),
  license_number: z.string().min(1, 'License number required').max(100),
  services: z.string().min(1, 'Services required').max(500, 'Too many services'),
});

export function validateInstitution(body: FormData | Record<string, any>): NextResponse | null {
  let data: Record<string, any>;
  if (body instanceof FormData) {
    data = Object.fromEntries(body.entries());
  } else {
    data = body;
  }
  const services = data.services as string;
  if (!services || typeof services !== 'string') {
    return NextResponse.json({ error: 'Services must be a string' }, { status: 400 });
  }
  const result = institutionRegisterSchema.safeParse({
    name: data.name,
    location: data.location,
    owner: data.owner,
    license_number: data.license_number,
    services,
  });
  if (!result.success) {
    const errors = result.error.format();
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }
  return null;
}

