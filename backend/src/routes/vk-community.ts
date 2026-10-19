import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { processVkMessage } from '../vk-community/processor.js';

// ===== Плагин «ВК сообщество»: VK Callback API webhook =====
// Публичный путь остаётся прежним (/api/vk/webhook) — URL задан в настройках
// Callback API группы ВК и не должен меняться.
const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { type, object, group_id, secret } = req.body;

    // Find settings for this group
    const settings = await prisma.vkCommunitySettings.findFirst({
      where: { groupId: group_id },
    });

    if (!settings) {
      console.log('[VK Webhook] No settings for group', group_id);
      return res.status(200).send('ok');
    }

    // Verify secret if configured
    if (settings.callbackSecret && secret !== settings.callbackSecret) {
      console.warn('[VK Webhook] Invalid secret for group', group_id);
      return res.status(403).send('invalid secret');
    }

    if (type === 'confirmation') {
      console.log('[VK Webhook] Confirmation request for group', group_id);
      return res.status(200).send(settings.confirmationString || 'ok');
    }

    if (type === 'message_new' || type === 'message_reply') {
      const msg = object?.message;
      if (!msg) {
        return res.status(200).send('ok');
      }

      console.log(`[VK Webhook] ${type} from peer ${msg.peer_id}, msg_id=${msg.id}`);

      // Process the message immediately
      await processVkMessage(msg, settings);
      return res.status(200).send('ok');
    }

    // Acknowledge other events
    return res.status(200).send('ok');
  } catch (err: any) {
    console.error('[VK Webhook] Error:', err);
    return res.status(200).send('ok'); // Always return 200 to VK
  }
});

export default router;
