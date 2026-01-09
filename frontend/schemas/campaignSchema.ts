import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  type: z.enum(['email', 'sms', 'direct_mail', 'ringless_voicemail']),
  template: z.string().min(10, 'Template must be at least 10 characters'),
  subject: z.string().max(500).optional(),
  leads: z.array(z.string().uuid()).min(1, 'At least one lead is required'),
  scheduledFor: z.date().min(new Date(), 'Scheduled date must be in the future').optional().or(z.null()),
  status: z.enum(['draft', 'scheduled', 'active']).default('draft'),
}).refine(
  (data) => {
    if (data.type === 'email' && !data.subject) {
      return false;
    }
    return true;
  },
  {
    message: 'Subject is required for email campaigns',
    path: ['subject'],
  }
);

export type CampaignFormData = z.infer<typeof campaignSchema>;
