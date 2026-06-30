import type { Payment, Subscription } from '@softtime/shared';
import { apiClient } from '@/shared/api/client';

function parseSubscription(raw: unknown): Subscription {
  const r = raw as Record<string, unknown>;
  return {
    ...(r as unknown as Subscription),
    periodStart: r.periodStart ? new Date(r.periodStart as string) : new Date(),
    periodEnd: r.periodEnd ? new Date(r.periodEnd as string) : new Date(),
    nextBillingAt: r.nextBillingAt ? new Date(r.nextBillingAt as string) : null,
  };
}

function parsePayment(raw: unknown): Payment {
  const r = raw as Record<string, unknown>;
  return {
    ...(r as unknown as Payment),
    periodStart: new Date(r.periodStart as string),
    periodEnd: new Date(r.periodEnd as string),
    createdAt: new Date(r.createdAt as string),
  };
}

export async function getSubscriptionApi(): Promise<Subscription> {
  const res = await apiClient.get<unknown>('/subscription');
  return parseSubscription(res.data);
}

export async function getPaymentsApi(): Promise<Payment[]> {
  const res = await apiClient.get<unknown[]>('/payments');
  return res.data.map(parsePayment);
}
