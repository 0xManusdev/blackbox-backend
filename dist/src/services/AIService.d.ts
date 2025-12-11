export interface AIAnalysisResult {
    anonymizedContent: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    analysis: string;
}
export declare function analyzeAndAnonymize(content: string): Promise<AIAnalysisResult>;
