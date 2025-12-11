"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeAndAnonymize = analyzeAndAnonymize;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
const ErrorHandler_1 = require("../utils/ErrorHandler");
const genAI = new generative_ai_1.GoogleGenerativeAI(config_1.config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
async function analyzeAndAnonymize(content) {
    if (!config_1.config.geminiApiKey) {
        throw new ErrorHandler_1.AppError('Gemini API key not configured', 500);
    }
    const prompt = `Tu es un expert en sécurité aéroportuaire. Analyse ce signalement d'incident et effectue les tâches suivantes:

1. **Anonymisation**: Remplace TOUS les noms de personnes, numéros de badge, identifiants, noms de compagnies spécifiques par des termes génériques (ex: [EMPLOYÉ_A], [BADGE_XXX], [COMPAGNIE_X]).

2. **Catégorisation**: Classe l'incident dans UNE des catégories suivantes:
   - SECURITE_PHYSIQUE
   - SECURITE_AERIENNE
   - PROCEDURE_NON_RESPECTEE
   - INCIDENT_TECHNIQUE
   - COMPORTEMENT_SUSPECT
   - AUTRE

3. **Sévérité**: Évalue la sévérité (low, medium, high, critical)

4. **Analyse**: Fournis une brève analyse professionnelle de l'incident.

Signalement original:
"""
${content}
"""

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
  "anonymizedContent": "Le texte anonymisé ici",
  "category": "CATEGORIE_ICI",
  "severity": "medium",
  "analysis": "Analyse professionnelle ici"
}`;
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new ErrorHandler_1.AppError('Invalid AI response format', 500);
        }
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate response structure
        if (!parsed.anonymizedContent || !parsed.category || !parsed.severity || !parsed.analysis) {
            throw new ErrorHandler_1.AppError('Incomplete AI analysis', 500);
        }
        return parsed;
    }
    catch (error) {
        if (error instanceof ErrorHandler_1.AppError)
            throw error;
        console.error('AI Analysis error:', error);
        throw new ErrorHandler_1.AppError('Failed to analyze incident with AI', 500);
    }
}
//# sourceMappingURL=AIService.js.map