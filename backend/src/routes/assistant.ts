import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

async function callOllama(messages: any[]) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json() as any;
  return {
    text: data.message?.content || '',
    finishReason: data.done ? 'stop' : '',
    model: OLLAMA_MODEL,
  };
}

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const result = await callOllama(messages);
    res.json(result);
  } catch (e: any) {
    console.error('[Assistant] Ollama error:', e);
    res.status(502).json({ error: e.message || 'Ошибка при обращении к AI' });
  }
});

export default router;
