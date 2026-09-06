import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Provider: OpenRouter (OpenAI-compatible API, works from Russia)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';

// Fallback: direct Gemini (may be geo-blocked)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface OpenRouterMessage {
  role: string;
  content: string;
}

interface OpenRouterChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
  error?: { message: string };
}

async function callOpenRouter(messages: OpenRouterMessage[]) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://welans.cc',
      'X-Title': 'WeCRM Assistant',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json() as OpenRouterResponse;
  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  return {
    text: data.choices?.[0]?.message?.content || '',
    finishReason: data.choices?.[0]?.finish_reason || '',
    model: OPENROUTER_MODEL,
  };
}

async function callGemini(messages: any[]) {
  const geminiBody = {
    contents: messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  };

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    finishReason: data.candidates?.[0]?.finishReason || '',
    model: GEMINI_MODEL,
  };
}

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    let result;

    // Try OpenRouter first (works from Russia)
    if (OPENROUTER_API_KEY) {
      const openRouterMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
      result = await callOpenRouter(openRouterMessages);
    }
    // Fallback to direct Gemini
    else if (GEMINI_API_KEY) {
      result = await callGemini(messages);
    }
    else {
      return res.status(500).json({
        error: 'AI провайдер не настроен. Добавьте OPENROUTER_API_KEY или GEMINI_API_KEY в .env',
      });
    }

    res.json(result);
  } catch (e: any) {
    console.error('[Assistant] Error:', e);
    res.status(502).json({ error: e.message || 'Ошибка при обращении к AI' });
  }
});

export default router;

