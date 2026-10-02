import type { Result } from "../common/Result";
import type {
  ClassifyReportRequest,
  ReportClassification,
  SimilarityRequest,
  SimilarityResult,
  EvidenceAnalysisRequest,
  EvidenceAnalysis,
} from "./AIContracts";

export interface AIEngine {
  classifyReport(
    request: ClassifyReportRequest
  ): Promise<Result<ReportClassification>>;

  detectSimilarity(
    request: SimilarityRequest
  ): Promise<Result<SimilarityResult>>;

  analyzeEvidence(
    request: EvidenceAnalysisRequest
  ): Promise<Result<EvidenceAnalysis>>;
}