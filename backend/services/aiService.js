import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * Ask Gemini to assess a candidate and return a summary + match score.
 * @param {string} name  – candidate name
 * @param {string} role  – role the candidate applied for
 * @param {string} resumeUrl – path to resume file (optional)
 * @returns {Promise<{ summary: string, matchScore: number }>}
 */
export async function generateCandidateInsight(name, role, resumeUrl) {
  console.log('AI starting analysis for:', name, '| Role:', role, '| Resume:', resumeUrl || 'None');

  const hasResume = resumeUrl && resumeUrl.length > 0;
  const resumeContext = hasResume
    ? `Resume: Uploaded (${resumeUrl.split('/').pop()})`
    : 'Resume: Not provided';

  const prompt = `You are an expert technical recruiter. Assess the following candidate and return ONLY a valid JSON object with no markdown formatting, no code fences, and no extra text.

Candidate Name: ${name}
Role Applied For: ${role || 'Not specified'}
${resumeContext}

IMPORTANT SCORING GUIDELINES:
- If the candidate has a resume uploaded, assume they have relevant experience and provide a score between 70-95.
- If no resume is provided, assume the candidate has basic skills in the listed role and provide a realistic score between 60-85 based on the role name alone.
- Consider the role's typical requirements when scoring.
- Be optimistic but realistic in your assessment.

Return exactly this JSON structure:
{"summary": "One concise sentence (max 20 words) assessing this candidate's fit for the role", "matchScore": <integer between 60 and 95>}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip markdown code fences if the model wraps its response
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned invalid JSON');
  }

  if (typeof parsed.summary !== 'string' || typeof parsed.matchScore !== 'number') {
    throw new Error('AI response missing required fields');
  }

  // Clamp score to 0-100
  parsed.matchScore = Math.max(0, Math.min(100, Math.round(parsed.matchScore)));

  console.log('AI Response:', { summary: parsed.summary, matchScore: parsed.matchScore });

  return { summary: parsed.summary, matchScore: parsed.matchScore };
}
