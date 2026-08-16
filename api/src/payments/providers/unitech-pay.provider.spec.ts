import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { UnitechPayProvider } from './unitech-pay.provider';

describe('UnitechPayProvider.verifyWebhook', () => {
  const apiKey = 'test-api-key';
  let provider: UnitechPayProvider;

  beforeEach(() => {
    const config = {
      get: (key: string) => (key === 'UNITECHPAY_API_KEY' ? apiKey : undefined),
    } as unknown as ConfigService;
    provider = new UnitechPayProvider(config);
  });

  const payload = {
    event: 'payment_completed' as const,
    transaction_id: 18,
    reference: 'wave_66a1b2_1716540000',
    amount: 5000,
    status: 'completed',
    method: 'wave',
    commission: 75,
    net_amount: 4925,
    timestamp: 1716540300,
  };
  const rawBody = Buffer.from(JSON.stringify(payload));
  const validSignature = createHmac('sha256', apiKey).update(rawBody).digest('hex');

  it('accepte une signature valide et normalise l\'événement', () => {
    const event = provider.verifyWebhook(rawBody, {
      'x-unitechpay-signature': validSignature,
    });

    expect(event).toEqual({
      eventIdProvider: '18',
      type: 'payment_completed',
      providerRef: 'wave_66a1b2_1716540000',
      montant: 5000,
      frais: 75,
      raw: payload,
    });
  });

  it('rejette une signature invalide', () => {
    expect(() =>
      provider.verifyWebhook(rawBody, { 'x-unitechpay-signature': 'signature-bidon' }),
    ).toThrow(BadRequestException);
  });

  it('rejette un corps modifié même avec la signature d\'origine', () => {
    const tampered = Buffer.from(
      JSON.stringify({ ...payload, amount: 999999 }),
    );
    expect(() =>
      provider.verifyWebhook(tampered, { 'x-unitechpay-signature': validSignature }),
    ).toThrow(BadRequestException);
  });

  it('rejette une requête sans en-tête de signature', () => {
    expect(() => provider.verifyWebhook(rawBody, {})).toThrow(BadRequestException);
  });
});

describe('UnitechPayProvider.createIntent', () => {
  const apiKey = 'test-api-key';
  let provider: UnitechPayProvider;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const config = {
      get: (key: string) => (key === 'UNITECHPAY_API_KEY' ? apiKey : undefined),
    } as unknown as ConfigService;
    provider = new UnitechPayProvider(config);
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  it('refuse un moyen mobile money sans numéro de téléphone client', async () => {
    await expect(
      provider.createIntent({ montant: 5000, ticketRef: '42', methode: 'wave' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('appelle create_wave_payment pour Wave et renvoie la référence et le lien de paiement', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { transaction_id: 1, reference: 'wave_ref_1', payment_url: 'https://pay.wave.com/x', amount: 5000, status: 'pending' },
      }),
    });

    const result = await provider.createIntent({
      montant: 5000, ticketRef: '42', methode: 'wave', customerPhone: '+221 77 000 00 00',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('action=create_wave_payment'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({ providerRef: 'wave_ref_1', launchUrl: 'https://pay.wave.com/x', status: 'pending' });
  });

  it('appelle create_orange_maxit pour Orange Money', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { transaction_id: 2, reference: 'om_ref_1', payment_url: 'https://maxit.example/x', amount: 5000, status: 'pending' },
      }),
    });

    await provider.createIntent({
      montant: 5000, ticketRef: '42', methode: 'orange_money', customerPhone: '+221 77 000 00 00',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('action=create_orange_maxit'),
      expect.anything(),
    );
  });

  it('rejette si UnitechPay refuse la création (success=false)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: 'Solde marchand insuffisant' }),
    });

    await expect(
      provider.createIntent({ montant: 5000, ticketRef: '42', methode: 'wave', customerPhone: '+221 77 000 00 00' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('UnitechPayProvider.getStatus', () => {
  let provider: UnitechPayProvider;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    const config = {
      get: (key: string) => (key === 'UNITECHPAY_API_KEY' ? 'test-api-key' : undefined),
    } as unknown as ConfigService;
    provider = new UnitechPayProvider(config);
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  it('retrouve la transaction sous data (tableau) et mappe completed → succeeded', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [{ reference: 'ref-1', status: 'completed' }] }),
    });
    await expect(provider.getStatus('ref-1')).resolves.toBe('succeeded');
  });

  it('retrouve la transaction sous data.transactions', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: { transactions: [{ reference: 'ref-1', status: 'failed' }] } }),
    });
    await expect(provider.getStatus('ref-1')).resolves.toBe('failed');
  });

  it('retrouve la transaction sous un tableau racine `transactions`', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ transactions: [{ reference: 'ref-1', status: 'expired' }] }),
    });
    await expect(provider.getStatus('ref-1')).resolves.toBe('expired');
  });

  it('retrouve la transaction si la réponse est directement un tableau', async () => {
    fetchMock.mockResolvedValue({
      json: async () => [{ reference: 'ref-1', status: 'completed' }],
    });
    await expect(provider.getStatus('ref-1')).resolves.toBe('succeeded');
  });

  it('ne plante jamais sur une forme de réponse inattendue — reste "pending"', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: { message: 'unexpected shape' } }),
    });
    await expect(provider.getStatus('ref-1')).resolves.toBe('pending');
  });

  it('reste "pending" si aucune transaction ne correspond à la référence', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [{ reference: 'autre-ref', status: 'completed' }] }),
    });
    await expect(provider.getStatus('ref-1')).resolves.toBe('pending');
  });
});
