import type { Result } from "../../contracts/common/Result";
import type { AIEngine } from "../../contracts/ai/AIEngine";
import type {
  ClassifyReportRequest,
  ReportClassification,
  SimilarityRequest,
  SimilarityResult,
  EvidenceAnalysisRequest,
  EvidenceAnalysis,
} from "../../contracts/ai/AIContracts";

export class AIEngineAdapter implements AIEngine {
  constructor(
    private readonly engine: AIEngine
  ) {}

  classifyReport(
    request: ClassifyReportRequest
  ): Promise<Result<ReportClassification>> {
    return this.engine.classifyReport(request);
  }

  detectSimilarity(
    request: SimilarityRequest
  ): Promise<Result<SimilarityResult>> {
    return this.engine.detectSimilarity(request);
  }

  analyzeEvidence(
    request: EvidenceAnalysisRequest
  ): Promise<Result<EvidenceAnalysis>> {
    return this.engine.analyzeEvidence(request);
  }
}