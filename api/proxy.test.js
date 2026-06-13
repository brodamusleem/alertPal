import test from 'node:test';
import assert from 'node:assert/strict';

import { scoreReceiptConfidence } from './proxy.js';

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
