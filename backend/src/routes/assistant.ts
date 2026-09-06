import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Provider configs
const PROVIDERS = {
  pollinations: {
    // Free API, no key needed, works from any IP
    url: 'https://text.pollinations.ai/openai',
    model: 'openai',
  },
  deepseek: {
    key: process.env.DEEPSEEK_API_KEY,
    url: 'https://api.deepseek.com/chat/completions',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },
  together: {
    key: process.env.TOGETHER_API_KEY,
    url: 'https://api.together.xyz/v1/chat/completions',
    model: process.env.TOGETHER_MODEL || 'meta-llama/Llama-3-8b-chat-hf',
  },
  openrouter: {
    key: process.env.OPENROUTER_API_KEY,
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
  },
  gemini: {
    key: process.env.GEMINI_API_KEY,
    model: 'gemini-3.6-flash',
    url: '',
  },
};

interface ChatMessage {
  role: string;
  content: string;
}

async function callOpenAICompatible(
  url: string,
  apiKey: string | undefined,
  model: string,
  messages: ChatMessage[],
  extraHeaders: Record<string, string> = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  return {
    text: data.choices?.[0]?.message?.content || '',
    finishReason: data.choices?.[0]?.finish_reason || '',
    model,
  };
}

async function callGemini(apiKey: string, model: string, messages: any[]) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const geminiBody = {
    contents: messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  };

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    finishReason: data.candidates?.[0]?.finishReason || '',
    model,
  };
}

async function chatWithAI(messages: any[]) {
  const openaiMessages = messages.map((m: any) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  // 1. Pollinations AI — free, no key, works from any IP
  try {
    return await callOpenAICompatible(
      PROVIDERS.pollinations.url,
      undefined,
      PROVIDERS.pollinations.model,
      openaiMessages
    );
  } catch (e: any) {
    console.error('[Assistant] Pollinations AI failed:', e.message);
  }

  // 2. DeepSeek (if key and balance available)
  if (PROVIDERS.deepseek.key) {
    try {
      return await callOpenAICompatible(
        PROVIDERS.deepseek.url,
        PROVIDERS.deepseek.key,
        PROVIDERS.deepseek.model,
        openaiMessages
      );
    } catch (e: any) {
      console.error('[Assistant] DeepSeek failed:', e.message);
    }
  }

  // 3. Together AI
  if (PROVIDERS.together.key) {
    try {
      return await callOpenAICompatible(
        PROVIDERS.together.url,
        PROVIDERS.together.key,
        PROVIDERS.together.model,
        openaiMessages
      );
    } catch (e: any) {
      console.error('[Assistant] Together AI failed:', e.message);
    }
  }

  // 4. OpenRouter
  if (PROVIDERS.openrouter.key) {
    try {
      return await callOpenAICompatible(
        PROVIDERS.openrouter.url,
        PROVIDERS.openrouter.key,
        PROVIDERS.openrouter.model,
        openaiMessages,
        {
          'HTTP-Referer': process.env.FRONTEND_URL || 'https://welans.cc',
          'X-Title': 'WeCRM Assistant',
        }
      );
    } catch (e: any) {
      console.error('[Assistant] OpenRouter failed:', e.message);
    }
  }

  // 5. Fallback to direct Gemini
  if (PROVIDERS.gemini.key) {
    try {
      return await callGemini(PROVIDERS.gemini.key, PROVIDERS.gemini.model, messages);
    } catch (e: any) {
      console.error('[Assistant] Gemini failed:', e.message);
    }
  }

  throw new Error(
    'Ни один AI-провайдер не доступен. ' +
    'Pollinations AI (бесплатный) временно недоступен. ' +
    'Добавьте DEEPSEEK_API_KEY, TOGETHER_API_KEY, OPENROUTER_API_KEY или GEMINI_API_KEY в .env'
  );
}

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const result = await chatWithAI(messages);
    res.json(result);
  } catch (e: any) {
    console.error('[Assistant] Error:', e);
    res.status(502).json({ error: e.message || 'Ошибка при обращении к AI' });
  }
});

export default router;
