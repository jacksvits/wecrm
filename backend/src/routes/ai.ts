import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

async function callOllamaJSON(systemPrompt: string, userText: string) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      stream: false,
      format: 'json',
      options: { temperature: 0.3, num_predict: 2048 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  const raw = data.message?.content || '';

  // Try to extract JSON from markdown code blocks
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Invalid JSON from Ollama: ${jsonStr.substring(0, 200)}`);
  }
}

const TASK_SYSTEM_PROMPT = `You are a CRM task parser. Extract task fields from the user's description and return ONLY a JSON object with no markdown formatting.

Fields:
- title (string, required, max 200 chars)
- description (string, detailed description)
- status (string, one of: open, in_progress, load, cancelled, win)
- priority (string, one of: low, medium, high, urgent)
- dueDate (string, ISO 8601 date or null if not specified)
- assigneeName (string, name of responsible person or null)
- curatorNames (array of strings, names of curators or empty array)
- projectName (string, project name or null)
- contactName (string, contact/company name or null)

Rules:
- Infer status from urgency words ("срочно" -> urgent, "важно" -> high, etc.)
- Infer dueDate from date references ("завтра", "через 3 дня", "15 сентября")
- Return ONLY valid JSON, no explanations.`;

const DEAL_SYSTEM_PROMPT = `You are a CRM deal parser. Extract deal fields from the user's description and return ONLY a JSON object with no markdown formatting.

Fields:
- title (string, required, max 200 chars)
- value (number or null, deal amount in rubles)
- status (string, one of: new, in_progress, negotiation, won, lost)
- contactName (string, contact/company name or null)
- projectName (string, project name or null)
- description (string, detailed description)

Rules:
- Extract value from money mentions ("100 тыс", "1.5 млн", "50000 руб")
- Infer status from context ("подписали договор" -> won, "переговоры" -> negotiation)
- Return ONLY valid JSON, no explanations.`;

// POST /api/ai/generate-task
router.post('/generate-task', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const result = await callOllamaJSON(TASK_SYSTEM_PROMPT, text);
    res.json(result);
  } catch (e: any) {
    console.error('[AI] generate-task error:', e);
    res.status(502).json({ error: e.message || 'Ошибка генерации задачи' });
  }
});

// POST /api/ai/generate-deal
router.post('/generate-deal', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const result = await callOllamaJSON(DEAL_SYSTEM_PROMPT, text);
    res.json(result);
  } catch (e: any) {
    console.error('[AI] generate-deal error:', e);
    res.status(502).json({ error: e.message || 'Ошибка генерации сделки' });
  }
});

export default router;
