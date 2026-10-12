import type { AIEngine } from "../contracts/ai/AIEngine";
import type { Result } from "../contracts/common/Result";
import type {
  ClassifyReportRequest,
  ReportClassification,
  SimilarityRequest,
  SimilarityResult,
  EvidenceAnalysisRequest,
  EvidenceAnalysis,
} from "../contracts/ai/AIContracts";
import type { ReportCategory, Severity } from "../contracts/data/EmergencyReport";

interface CategoryRule {
  category: ReportCategory;
  strongKeywords: string[];
  weakKeywords: string[];
}

interface SeverityRule {
  severity: Severity;
  keywords: string[];
  weight: number;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "FIRE",
    strongKeywords: ["fire", "flames", "burning", "blaze", "wildfire", "arson", "explosion", "smoke"],
    weakKeywords: ["heat", "sparks", "ash", "charred"],
  },
  {
    category: "FLOOD",
    strongKeywords: ["flood", "flooded", "water rising", "submerged", "river overflow", "inundated", "tsunami"],
    weakKeywords: ["water on road", "puddle", "leak", "high tide"],
  },
  {
    category: "MEDICAL",
    strongKeywords: ["injury", "injured", "bleeding", "unconscious", "medical emergency", "ambulance", "heart attack", "trauma", "casualty", "casualties", "paramedic"],
    weakKeywords: ["pain", "hurt", "sick", "wound", "first aid"],
  },
  {
    category: "BUILDING_COLLAPSE",
    strongKeywords: ["building collapse", "collapsed building", "structure collapse", "caved in", "rubble", "trapped under rubble"],
    weakKeywords: ["wall crack", "damaged roof", "debris"],
  },
  {
    category: "TRAPPED_PERSON",
    strongKeywords: ["trapped", "trapped inside", "cannot get out", "stuck inside", "pinned under", "locked inside"],
    weakKeywords: ["door jammed", "stuck"],
  },
  {
    category: "BLOCKED_ROAD",
    strongKeywords: ["blocked road", "road blocked", "fallen tree", "collapsed road", "traffic obstruction", "landslide", "mudslide", "impassable road"],
    weakKeywords: ["debris on road", "tree down", "blockage"],
  },
  {
    category: "FOOD",
    strongKeywords: ["food supply", "ration", "starving", "hunger", "food distribution", "no food"],
    weakKeywords: ["groceries", "meals"],
  },
  {
    category: "WATER",
    strongKeywords: ["clean water", "potable water", "drinking water", "dehydration", "water station", "bottled water"],
    weakKeywords: ["water supply", "thirsty"],
  },
  {
    category: "SHELTER",
    strongKeywords: ["shelter", "evacuation center", "homeless", "no housing", "cots", "blankets", "refuge"],
    weakKeywords: ["place to stay", "roof"],
  },
];

const SEVERITY_RULES: SeverityRule[] = [
  {
    severity: "CRITICAL",
    keywords: [
      "trapped",
      "unconscious",
      "heavy smoke",
      "spreading fire",
      "explosion",
      "severe bleeding",
      "building collapse",
      "immediate danger",
      "multiple casualties",
      "fatalities",
      "life threatening",
      "dying",
    ],
    weight: 0.4,
  },
  {
    severity: "HIGH",
    keywords: [
      "fire",
      "flames",
      "injury",
      "injured",
      "bleeding",
      "flooded",
      "landslide",
      "submerged",
      "collapsed",
      "structural damage",
      "road blocked",
    ],
    weight: 0.25,
  },
  {
    severity: "MEDIUM",
    keywords: [
      "debris",
      "blocked",
      "water rising",
      "tree down",
      "power outage",
      "food needed",
      "water needed",
    ],
    weight: 0.15,
  },
  {
    severity: "LOW",
    keywords: ["minor", "contained", "resolved", "stable", "small", "inquiry"],
    weight: 0.05,
  },
];

/**
 * RuleBasedAIEngine - Offline heuristic & rule-based classifier implementing AIEngine contract.
 * Purely advisory: returns suggested Category, Severity, Confidence, and human-explainable Rationale.
 */
export class RuleBasedAIEngine implements AIEngine {
  private readonly version = "v1.2-rule-engine";

  async classifyReport(request: ClassifyReportRequest): Promise<Result<ReportClassification>> {
    const rawText = request.text || "";
    const normalizedText = rawText.toLowerCase().trim();

    if (!normalizedText) {
      return {
        ok: true,
        data: {
          category: "OTHER",
          severity: undefined,
          confidence: 0.0,
          model_version: this.version,
          rationale: "No description text provided for analysis.",
        },
      };
    }

    // 1. Category Scoring
    let bestCategory: ReportCategory = "OTHER";
    let highestCategoryScore = 0;
    const matchedCategoryKeywords: string[] = [];

    for (const rule of CATEGORY_RULES) {
      let currentScore = 0;
      const currentMatches: string[] = [];

      for (const kw of rule.strongKeywords) {
        if (normalizedText.includes(kw)) {
          currentScore += 3;
          currentMatches.push(kw);
        }
      }

      for (const kw of rule.weakKeywords) {
        if (normalizedText.includes(kw)) {
          currentScore += 1;
          currentMatches.push(kw);
        }
      }

      if (currentScore > highestCategoryScore) {
        highestCategoryScore = currentScore;
        bestCategory = rule.category;
        matchedCategoryKeywords.length = 0;
        matchedCategoryKeywords.push(...currentMatches);
      }
    }

    // 2. Severity Scoring
    let determinedSeverity: Severity = "LOW";
    let highestSeverityWeight = 0;
    const matchedSeverityKeywords: string[] = [];

    for (const rule of SEVERITY_RULES) {
      for (const kw of rule.keywords) {
        if (normalizedText.includes(kw)) {
          matchedSeverityKeywords.push(kw);
          if (rule.weight > highestSeverityWeight) {
            highestSeverityWeight = rule.weight;
            determinedSeverity = rule.severity;
          }
        }
      }
    }

    // 3. Confidence Calculation
    let confidence = 0.0;
    if (highestCategoryScore >= 6) {
      confidence = 0.92;
    } else if (highestCategoryScore >= 3) {
      confidence = 0.85;
    } else if (highestCategoryScore >= 1) {
      confidence = 0.60;
    } else {
      confidence = 0.30;
      determinedSeverity = "LOW";
    }

    // Capping max confidence at 0.95 (human advisory headroom)
    confidence = Math.min(0.95, confidence);

    // 4. Rationale Construction
    let rationale = "";
    if (matchedCategoryKeywords.length > 0) {
      rationale = `Detected ${bestCategory} indicators: '${matchedCategoryKeywords.join("', '")}'.`;
      if (matchedSeverityKeywords.length > 0) {
        rationale += ` Severity hint ${determinedSeverity} based on '${matchedSeverityKeywords[0]}'.`;
      }
    } else {
      rationale = "No strong emergency category keywords matched in description.";
    }

    let outputSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined = undefined;
    if (determinedSeverity === "CRITICAL" || determinedSeverity === "HIGH" || determinedSeverity === "MEDIUM" || determinedSeverity === "LOW") {
      outputSeverity = determinedSeverity;
    }

    return {
      ok: true,
      data: {
        category: bestCategory,
        severity: outputSeverity,
        confidence: Number(confidence.toFixed(2)),
        model_version: this.version,
        rationale,
      },
    };
  }

  async detectSimilarity(request: SimilarityRequest): Promise<Result<SimilarityResult>> {
    const matches = request.candidate_report_ids.map((id) => ({
      report_id: id,
      similarity: 0.75,
    }));

    return {
      ok: true,
      data: {
        matches,
        model_version: this.version,
      },
    };
  }

  async analyzeEvidence(request: EvidenceAnalysisRequest): Promise<Result<EvidenceAnalysis>> {
    return {
      ok: true,
      data: {
        labels: ["field_evidence", "local_attachment"],
        severity_hint: "MEDIUM",
        confidence: 0.8,
        model_version: this.version,
      },
    };
  }
}
