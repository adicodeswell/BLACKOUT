import type { MessageDto } from "../../src/contracts/network/MessageDto";
import type { EmergencyReportDto } from "../../src/contracts/data/EmergencyReport";
import type { LocationDto } from "../../src/contracts/geo/LocationDto";

describe("BLACKOUT contract smoke tests", () => {
  it("creates a valid message shape", () => {
    const message: MessageDto = {
      protocol_version: 1,
      message_id: "test-message",
      origin_device_id: "device-a",
      message_type: "DIRECT",
      created_at: Date.now(),
      ttl: 8,
      hop_count: 0,
      priority: "CRITICAL_EMERGENCY",
      payload_hash: "sha256:test",
      payload: {
        text: "test",
      },
      signature: "test-signature",
    };

    expect(message.protocol_version).toBe(1);
    expect(message.ttl).toBeGreaterThan(0);
  });

  it("creates a valid location shape", () => {
    const location: LocationDto = {
      latitude: 22.5726,
      longitude: 88.3639,
      accuracy_m: 10,
      captured_at: Date.now(),
    };

    expect(location.latitude).toBeGreaterThanOrEqual(-90);
    expect(location.latitude).toBeLessThanOrEqual(90);
    expect(location.longitude).toBeGreaterThanOrEqual(-180);
    expect(location.longitude).toBeLessThanOrEqual(180);
  });

  it("allows emergency reports without GPS", () => {
    const report: EmergencyReportDto = {
      report_id: "report-test",
      reporter_device_id: "device-a",
      category: "FIRE",
      description: "Test fire report",
      created_at: Date.now(),
      severity: "HIGH",
      verification_state: "UNVERIFIED",
      evidence_ids: [],
    };

    expect(report.location).toBeUndefined();
  });
});
