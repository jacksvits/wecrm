import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

interface ChatMessage {
  role: string;
  content: string;
}

// GET /api/assistant/models — список установленных моделей
router.get('/models', authMiddleware, async (_req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }
    const data = await response.json() as any;
    const models = (data.models || []).map((m: any) => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
      parameter_size: m.details?.parameter_size || '',
      family: m.details?.family || '',
    }));
    res.json({ models, default: DEFAULT_MODEL });
  } catch (e: any) {
    console.error('[Assistant] Error fetching models:', e);
    res.status(502).json({ error: e.message || 'Ошибка получения списка моделей' });
  }
});

// POST /api/assistant/chat — чат с выбранной моделью
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const selectedModel = model || DEFAULT_MODEL;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: selectedModel,
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
    res.json({
      text: data.message?.content || '',
      finishReason: data.done ? 'stop' : '',
      model: selectedModel,
    });
  } catch (e: any) {
    console.error('[Assistant] Error:', e);
    res.status(502).json({ error: e.message || 'Ошибка при обращении к AI' });
  }
});

// POST /api/assistant/image — генерация картинки через Pollinations AI
router.post('/image', authMiddleware, async (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024 } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt required' });
    }
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const seed = Date.now();
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
    res.json({ imageUrl, prompt: prompt.trim() });
  } catch (e: any) {
    console.error('[Assistant] Image error:', e);
    res.status(502).json({ error: e.message || 'Ошибка генерации изображения' });
  }
});

export default router;
