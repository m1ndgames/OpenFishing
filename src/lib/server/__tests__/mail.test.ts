import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockEnv: Record<string, string | undefined> = {};
const mockSendMail = vi.fn(async () => undefined);
const mockCreateTransport = vi.fn(() => ({ sendMail: mockSendMail }));

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('nodemailer', () => ({ default: { createTransport: mockCreateTransport } }));

const { mailConfigured, sendPasswordResetEmail } = await import('../mail');

const t = {
	resetEmailSubject: 'Reset your password',
	resetEmailIntro: 'Click below to reset',
	resetEmailButton: 'Reset password',
	resetEmailIgnore: 'Ignore if you did not request this',
} as any;

beforeEach(() => {
	for (const k of Object.keys(mockEnv)) delete mockEnv[k];
	mockSendMail.mockClear();
	mockCreateTransport.mockClear();
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

describe('sendPasswordResetEmail', () => {
	beforeEach(() => {
		mockEnv.SMTP_HOST = 'smtp.example.com';
		mockEnv.SMTP_FROM = 'noreply@fish.app';
	});

	it('calls sendMail with the correct recipient, subject, and reset URL', async () => {
		await sendPasswordResetEmail('bob@example.com', 'https://app/reset?token=abc', t);
		expect(mockSendMail).toHaveBeenCalledOnce();
		const opts = mockSendMail.mock.calls[0][0] as any;
		expect(opts.to).toBe('bob@example.com');
		expect(opts.from).toBe('noreply@fish.app');
		expect(opts.subject).toBe('Reset your password');
		expect(opts.text).toContain('https://app/reset?token=abc');
		expect(opts.html).toContain('https://app/reset?token=abc');
	});

	it('uses default port 587 when SMTP_PORT is not set', async () => {
		await sendPasswordResetEmail('a@b.com', 'url', t);
		const cfg = mockCreateTransport.mock.calls[0][0] as any;
		expect(cfg.port).toBe(587);
		expect(cfg.secure).toBe(false);
	});

	it('uses SMTP_PORT when set', async () => {
		mockEnv.SMTP_PORT = '2525';
		await sendPasswordResetEmail('a@b.com', 'url', t);
		const cfg = mockCreateTransport.mock.calls[0][0] as any;
		expect(cfg.port).toBe(2525);
	});

	it('sets secure=true when SMTP_SECURE is "true"', async () => {
		mockEnv.SMTP_SECURE = 'true';
		await sendPasswordResetEmail('a@b.com', 'url', t);
		const cfg = mockCreateTransport.mock.calls[0][0] as any;
		expect(cfg.secure).toBe(true);
	});

	it('sets secure=true implicitly when port is 465', async () => {
		mockEnv.SMTP_PORT = '465';
		await sendPasswordResetEmail('a@b.com', 'url', t);
		const cfg = mockCreateTransport.mock.calls[0][0] as any;
		expect(cfg.secure).toBe(true);
	});

	it('includes auth credentials when SMTP_USER is set', async () => {
		mockEnv.SMTP_USER = 'user@smtp';
		mockEnv.SMTP_PASS = 'secret';
		await sendPasswordResetEmail('a@b.com', 'url', t);
		const cfg = mockCreateTransport.mock.calls[0][0] as any;
		expect(cfg.auth).toEqual({ user: 'user@smtp', pass: 'secret' });
	});

	it('omits auth when SMTP_USER is not set', async () => {
		await sendPasswordResetEmail('a@b.com', 'url', t);
		const cfg = mockCreateTransport.mock.calls[0][0] as any;
		expect(cfg.auth).toBeUndefined();
	});
});
