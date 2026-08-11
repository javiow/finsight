export type Track = "review" | "qa";

export interface ReviewCase {
  readonly track: "review";
  readonly id: string;
  readonly expect: "violation" | "pass";
  readonly rule: string;
  readonly prompt: string;
  readonly sourcePath: string;
}

export interface QaCase {
  readonly track: "qa";
  readonly id: string;
  readonly must: readonly string[];
  readonly mustNot: readonly string[];
  readonly falsePremise: boolean;
  readonly prompt: string;
  readonly sourcePath: string;
}

export type Case = ReviewCase | QaCase;

export interface JudgeVerdict {
  readonly pass: boolean;
  readonly reasoning: string;
}

export interface CaseResult {
  readonly caseId: string;
  readonly track: Track;
  readonly pass: boolean;
  readonly reasoning: string;
  readonly subjectResponse: string;
}

export interface TrackSummary {
  readonly total: number;
  readonly passed: number;
  readonly failed: readonly string[];
}

export interface Summary {
  readonly overallPass: boolean;
  readonly tracks: Readonly<Record<Track, TrackSummary>>;
  readonly failedDetails: readonly { caseId: string; reasoning: string }[];
}

export interface ValidationIssue {
  readonly message: string;
}

export interface CaseReportEntry {
  readonly id: string;
  readonly track: Track;
  readonly pass: boolean;
  readonly reasoning: string;
  readonly prompt: string;
  readonly subjectResponse: string;
  readonly context: string;
  readonly falsePremise: boolean;
}

export interface ReportData {
  readonly generatedAt: string;
  readonly summary: Summary;
  readonly entries: readonly CaseReportEntry[];
}
