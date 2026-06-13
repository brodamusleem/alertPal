import test from 'node:test';
import assert from 'node:assert/strict';

import { detectTextPatterns, scoreReceiptConfidence } from './proxy.js';
import { verifyTransaction } from '../src/mockDb.js';

test('real references are rated as high confidence in mock analysis', () => {
  const real = scoreReceiptConfidence({
    ref: 'OP2026061108731',
    is_likely_fake: false,
    fake_signals: [],
  });

  assert.equal(real.confidence, 'high');
  assert.equal(real.is_likely_fake, false);
});

test('fake or suspicious references are not rated as high confidence', () => {
  const fake = scoreReceiptConfidence({
    ref: 'FLASH00001234AB',
    is_likely_fake: true,
    fake_signals: ['Reference looks fabricated'],
  });

  assert.notEqual(fake.confidence, 'high');
  assert.equal(fake.confidence, 'low');
  assert.equal(fake.is_likely_fake, true);
});

test('unreadable uploads are suspicious instead of defaulting to a real receipt', async () => {
  delete process.env.ANTHROPIC_API_KEY;

  const extracted = await detectTextPatterns({
    base64Image: 'not-a-real-image',
    mimeType: 'image/png',
  });

  assert.equal(extracted.ref, null);
  assert.equal(extracted.amount, null);
  assert.equal(extracted.confidence, 'low');
  assert.equal(extracted.is_likely_fake, true);
});

test('verification checks fake records before real records', () => {
  const result = verifyTransaction('FLASH00001234AB', 15000, 'completed');

  assert.equal(result.found, false);
  assert.equal(result.fake_found, true);
  assert.equal(result.fraud_risk, 'high');
});

test('unknown references are treated as suspicious', () => {
  const result = verifyTransaction('UNKNOWN202606130001', 15000, 'completed');

  assert.equal(result.found, false);
  assert.equal(result.fake_found, false);
  assert.equal(result.fraud_risk, 'high');
});
