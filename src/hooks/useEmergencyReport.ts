import { useState, useCallback } from 'react';
import type { ReportCategory, Severity, EmergencyReportDto } from '../contracts/data/EmergencyReport';
import type { LocationDto } from '../contracts/geo/LocationDto';
import type { EvidenceType } from '../contracts/data/EvidenceDto';
import type { DeliveryHandle } from '../contracts/network/MessageDto';
import type { BlackoutError } from '../contracts/common/BlackoutError';
import type { EmergencyReportService } from '../services/EmergencyReportService';

export interface LocationState {
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
  location: LocationDto | null;
  error?: BlackoutError;
}

export interface LocalEvidenceItem {
  type: EvidenceType;
  local_uri: string;
}

export interface SubmissionState {
  status: 'IDLE' | 'SUBMITTING' | 'LOCAL_SAVED' | 'ERROR';
  localReport: EmergencyReportDto | null;
  deliveryHandle?: DeliveryHandle;
  broadcastAttempted: boolean;
  networkError?: BlackoutError;
  error?: BlackoutError;
}

export interface FormValidationErrors {
  category?: string;
  description?: string;
}

export function useEmergencyReport(reportService: EmergencyReportService) {
  // Form State
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [severity, setSeverity] = useState<Severity>('UNKNOWN');
  const [description, setDescription] = useState<string>('');
  const [observedAt, setObservedAt] = useState<number | null>(null);

  // Location State
  const [attachLocation, setAttachLocation] = useState<boolean>(true);
  const [locationState, setLocationState] = useState<LocationState>({
    status: 'IDLE',
    location: null,
  });

  // Evidence State (Metadata tracking for Phase 8 integration)
  const [evidenceItems, setEvidenceItems] = useState<LocalEvidenceItem[]>([]);

  // Submission & Delivery State
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: 'IDLE',
    localReport: null,
    broadcastAttempted: false,
  });

  // Validation Errors State
  const [validationErrors, setValidationErrors] = useState<FormValidationErrors>({});

  const validateForm = useCallback((): boolean => {
    const errors: FormValidationErrors = {};

    if (!category) {
      errors.category = 'Please select an emergency category';
    }

    if (!description || description.trim().length === 0) {
      errors.description = 'Please provide a brief description of the emergency';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [category, description]);

  const addEvidenceMetadata = useCallback((item: LocalEvidenceItem) => {
    setEvidenceItems((prev) => [...prev, item]);
  }, []);

  const removeEvidenceMetadata = useCallback((index: number) => {
    setEvidenceItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const submitReport = useCallback(async () => {
    if (!validateForm() || !category) {
      return;
    }

    setSubmissionState({
      status: 'SUBMITTING',
      localReport: null,
      broadcastAttempted: false,
    });

    if (attachLocation) {
      setLocationState((prev) => ({
        ...prev,
        status: 'LOADING',
      }));
    }

    try {
      const result = await reportService.submitReport({
        request: {
          category,
          severity,
          description: description.trim(),
          observed_at: observedAt ?? undefined,
          source_type: 'USER',
        },
        attachLocation,
      });

      if (result.ok) {
        setSubmissionState({
          status: 'LOCAL_SAVED',
          localReport: result.data.localReport,
          deliveryHandle: result.data.deliveryHandle,
          broadcastAttempted: result.data.broadcastAttempted,
          networkError: result.data.networkError,
        });

        if (result.data.location) {
          setLocationState({
            status: 'SUCCESS',
            location: result.data.location,
          });
        } else if (result.data.locationError) {
          setLocationState({
            status: 'ERROR',
            location: null,
            error: result.data.locationError,
          });
        } else {
          setLocationState({
            status: 'IDLE',
            location: null,
          });
        }
      } else {
        setSubmissionState({
          status: 'ERROR',
          localReport: null,
          broadcastAttempted: false,
          error: result.error,
        });

        if (attachLocation) {
          setLocationState({
            status: 'ERROR',
            location: null,
            error: result.error,
          });
        }
      }
    } catch (err) {
      const fallbackError: BlackoutError = {
        code: 'CANCELLED',
        message: err instanceof Error ? err.message : String(err),
        retryable: true,
        module: 'APP',
      };

      setSubmissionState({
        status: 'ERROR',
        localReport: null,
        broadcastAttempted: false,
        error: fallbackError,
      });

      if (attachLocation) {
        setLocationState({
          status: 'ERROR',
          location: null,
          error: fallbackError,
        });
      }
    }
  }, [category, severity, description, observedAt, attachLocation, validateForm, reportService]);

  const resetForm = useCallback(() => {
    setCategory(null);
    setSeverity('UNKNOWN');
    setDescription('');
    setObservedAt(null);
    setAttachLocation(true);
    setLocationState({ status: 'IDLE', location: null });
    setEvidenceItems([]);
    setSubmissionState({ status: 'IDLE', localReport: null, broadcastAttempted: false });
    setValidationErrors({});
  }, []);

  return {
    // Form Values & Setters
    category,
    setCategory,
    severity,
    setSeverity,
    description,
    setDescription,
    observedAt,
    setObservedAt,

    // Location State & Toggle
    attachLocation,
    setAttachLocation,
    locationState,

    // Evidence State & Actions
    evidenceItems,
    addEvidenceMetadata,
    removeEvidenceMetadata,

    // Validation & Submission
    validationErrors,
    submissionState,
    submitReport,
    resetForm,
  };
}
