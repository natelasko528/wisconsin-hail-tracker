import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number').optional().or(z.literal('')),
  propertyAddress: z.string().min(5, 'Address must be at least 5 characters'),
  propertyCity: z.string().optional(),
  propertyCounty: z.string().optional(),
  propertyZip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional().or(z.literal('')),
  propertyValue: z.number().min(0).optional().or(z.null()),
  propertyType: z.enum(['residential', 'commercial', 'industrial', 'mixed']).optional(),
  hailEventId: z.string().uuid().optional().or(z.null()),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
  score: z.number().min(0).max(100).default(0),
  tags: z.array(z.string()).default([]),
  assignedTo: z.string().uuid().optional().or(z.null()),
  nextFollowUpAt: z.date().optional().or(z.null()),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export const noteSchema = z.object({
  text: z.string().min(1, 'Note cannot be empty').max(5000, 'Note is too long'),
  author: z.string().optional(),
});

export type NoteFormData = z.infer<typeof noteSchema>;
