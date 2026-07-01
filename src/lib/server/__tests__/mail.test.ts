import { describe, it, expect, beforeEach } from 'vitest';

const mockEnv: Record<string, string | undefined> = {};

import { vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: async () => undefined }) } }));

const { mailConfigured } = await import('../mail');

beforeEach(() => {
	for (const k of Object.keys(mockEnv)) delete mockEnv[k];
});

describe('mailConfigured', () => {
	it('is false when nothing is set', () => {
		expect(mailConfigured()).toBe(false);
	});

	it('is false with only a host', () => {
		mockEnv.SMTP_HOST = 'smtp.example.com';
		expect(mailConfigured()).toBe(false);
	});

	it('is true with host + from address', () => {
		mockEnv.SMTP_HOST = 'smtp.example.com';
		mockEnv.SMTP_FROM = 'OpenFishing <noreply@example.com>';
		expect(mailConfigured()).toBe(true);
	});
});
