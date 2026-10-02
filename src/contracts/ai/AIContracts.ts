export interface ClassifyReportRequest {
  report_id: string;
  text: string;
}

export interface ReportClassification {
  category: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  model_version: string;
}

export interface SimilarityRequest {
  source_report_id: string;
  candidate_report_ids: string[];
}

export interface SimilarityResult {
  matches: Array<{
    report_id: string;
    similarity: number;
  }>;
  model_version: string;
}

export interface EvidenceAnalysisRequest {
  evidence_id: string;
  local_uri: string;
}

export interface EvidenceAnalysis {
  labels: string[];
  severity_hint?: string;
  confidence: number;
  model_version: string;
}

export interface ModelMetadata {
  model_id: string;
  version: string;
  task: string;
  input_schema: string;
  output_schema: string;
  quantization?: string;
  file_size_bytes?: number;
  model_hash: string;
  license?: string;
}