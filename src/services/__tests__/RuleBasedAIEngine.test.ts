import { RuleBasedAIEngine } from '../RuleBasedAIEngine';

describe('RuleBasedAIEngine Unit Tests', () => {
  const engine = new RuleBasedAIEngine();

  test('1. Commercial building fire with heavy smoke', async () => {
    const res = await engine.classifyReport({
      report_id: 'test-1',
      text: 'Commercial building fire with heavy smoke',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.category).toBe('FIRE');
      expect(res.data.severity).toBe('CRITICAL');
      expect(res.data.confidence).toBeGreaterThanOrEqual(0.85);
      expect(res.data.rationale).toContain('FIRE');
    }
  });

  test('2. Person unconscious and bleeding after accident', async () => {
    const res = await engine.classifyReport({
      report_id: 'test-2',
      text: 'Person unconscious and bleeding after accident',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.category).toBe('MEDICAL');
      expect(res.data.severity).toBe('CRITICAL');
      expect(res.data.confidence).toBeGreaterThanOrEqual(0.85);
    }
  });

  test('3. Road blocked by fallen tree', async () => {
    const res = await engine.classifyReport({
      report_id: 'test-3',
      text: 'Road blocked by fallen tree',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.category).toBe('BLOCKED_ROAD');
      expect(res.data.confidence).toBeGreaterThanOrEqual(0.8);
    }
  });

  test('4. Water rising across the street', async () => {
    const res = await engine.classifyReport({
      report_id: 'test-4',
      text: 'Water rising across the street',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.category).toBe('FLOOD');
    }
  });

  test('5. Something happened nearby', async () => {
    const res = await engine.classifyReport({
      report_id: 'test-5',
      text: 'Something happened nearby',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.confidence).toBeLessThan(0.5);
    }
  });

  test('6. Empty text description', async () => {
    const res = await engine.classifyReport({
      report_id: 'test-6',
      text: '',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.category).toBe('OTHER');
      expect(res.data.confidence).toBe(0.0);
    }
  });
});
