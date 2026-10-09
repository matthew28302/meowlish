import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DNS trước khi import module (vitest hoisting).
const resolveMx = vi.fn();
vi.mock('node:dns/promises', () => ({
  default: { resolveMx: (...a: unknown[]) => resolveMx(...a) },
  resolveMx: (...a: unknown[]) => resolveMx(...a),
}));

import {
  checkEmailDeliverable,
  emailDomain,
  __clearDeliverabilityCache,
} from '@/lib/mailDeliverability';

describe('mailDeliverability', () => {
  beforeEach(() => {
    resolveMx.mockReset();
    __clearDeliverabilityCache();
  });

  it('tach domain dung', () => {
    expect(emailDomain('admin@example.com')).toBe('example.com');
    expect(emailDomain('  A.B@Example.COM ')).toBe('example.com');
    expect(emailDomain('khongco-at')).toBeNull();
    expect(emailDomain('a@b@')).toBeNull();
  });

  it('co MX => deliverable', async () => {
    resolveMx.mockResolvedValue([{ exchange: 'mx1.example.com', priority: 10 }]);
    const r = await checkEmailDeliverable('admin@example.com');
    expect(r.deliverable).toBe(true);
    expect(r.knownUndeliverable).toBe(false);
  });

  it('NXDOMAIN => chan gui (truong hop that cua meowlish.com)', async () => {
    const err: any = new Error('queryMx ENOTFOUND');
    err.code = 'NXDOMAIN';
    resolveMx.mockRejectedValue(err);
    const r = await checkEmailDeliverable('admin@meowlish.com');
    expect(r.knownUndeliverable).toBe(true);
    expect(r.deliverable).toBe(false);
  });

  it('ENODATA (domain ton tai nhung khong co MX) => chan gui', async () => {
    const err: any = new Error('no MX');
    err.code = 'ENODATA';
    resolveMx.mockRejectedValue(err);
    const r = await checkEmailDeliverable('a@meowlish.io.vn');
    expect(r.knownUndeliverable).toBe(true);
  });

  it('MX rong => chan gui', async () => {
    resolveMx.mockResolvedValue([]);
    const r = await checkEmailDeliverable('a@nodomain.mx');
    expect(r.knownUndeliverable).toBe(true);
  });

  it('loi DNS khong xac dinh => FAIL-OPEN, van cho gui', async () => {
    const err: any = new Error('timeout');
    err.code = 'ETIMEOUT';
    resolveMx.mockRejectedValue(err);
    const r = await checkEmailDeliverable('a@example.com');
    expect(r.knownUndeliverable).toBe(false);
    expect(r.deliverable).toBe(true);
  });

  it('email khong hop le => chan gui', async () => {
    const r = await checkEmailDeliverable('khong-phai-email');
    expect(r.knownUndeliverable).toBe(true);
  });

  it('cache: goi DNS 1 lan cho 2 lan check', async () => {
    resolveMx.mockResolvedValue([{ exchange: 'mx1.example.com', priority: 10 }]);
    await checkEmailDeliverable('a@cached.example');
    await checkEmailDeliverable('b@cached.example');
    expect(resolveMx).toHaveBeenCalledTimes(1);
  });
});