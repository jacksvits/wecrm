import { prisma } from '../lib/prisma.js';
import { processVkMessage, VkMessage } from './processor.js';

export class VkGroupWorker {
  private timer?: NodeJS.Timeout;
  private isRunning = false;
  private settings: any = null;

  async start() {
    this.settings = await prisma.vkGroupSettings.findFirst();
    if (!this.settings || !this.settings.isActive) {
      console.log('[VK Worker] No active VK group settings found. Exiting.');
      return;
    }
    console.log(`[VK Worker] Starting polling for group ${this.settings.groupId}`);
    this.isRunning = true;
    await this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) clearTimeout(this.timer);
  }

  private async loop() {
    console.log('[VK Worker] loop() called, isRunning=' + this.isRunning);
    if (!this.isRunning) return;
    try {
      console.log('[VK Worker] Calling tick()...');
      await this.tick();
      console.log('[VK Worker] tick() completed');
    } catch (err) {
      console.error('[VK Worker] Tick error:', err);
    }
    console.log('[VK Worker] Scheduling next tick in 60s');
    this.timer = setTimeout(() => this.loop(), 60000);
  }

  private async tick() {
    console.log('[VK Worker] tick() started');

    // Get all unique peerIds from existing tasks (including completed ones)
    const taskPeers = await prisma.task.findMany({
      where: { vkGroupId: this.settings.groupId, vkPeerId: { not: null } },
      distinct: ['vkPeerId'],
      select: { vkPeerId: true },
    });
    const peerIds = new Set<number>(taskPeers.map(t => t.vkPeerId!).filter(Boolean));

    // Also add peers from getConversations (for new clients)
    try {
      const convs = await this.api('messages.getConversations', { count: 200 });
      if (convs?.items) {
        for (const item of convs.items) {
          peerIds.add(item.conversation.peer.id);
        }
        console.log('[VK Worker] Conversations peers: ' + convs.items.length);
      }
    } catch (e) {
      console.log('[VK Worker] getConversations error:', e);
    }

    console.log('[VK Worker] Total peers to check: ' + peerIds.size);

    for (const peerId of peerIds) {
      try {
        const history = await this.api('messages.getHistory', { peer_id: peerId, count: 50 });
        if (!history?.items?.length) continue;

        const messages = history.items
          .filter((m: VkMessage) => m.out !== 1)
          .sort((a: VkMessage, b: VkMessage) => a.id - b.id);

        for (const msg of messages) {
          try {
            await processVkMessage(msg, this.settings);
          } catch (err) {
            console.error(`[VK Worker] processVkMessage error for msg ${msg.id} peer ${msg.peer_id}:`, err);
          }
        }
      } catch (e) {
        console.error('[VK Worker] History error for peer ' + peerId + ':', e);
      }
      // Sleep 350ms between peers to avoid VK flood control
      await new Promise(r => setTimeout(r, 350));
    }
  }

  private async api(method: string, params: Record<string, any> = {}) {
    console.log('[VK Worker] API call: ' + method);
    const qs = new URLSearchParams({
      v: '5.199',
      access_token: this.settings.accessToken,
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    });
    const url = `https://api.vk.com/method/${method}?${qs.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) {
      throw new Error(`VK API error: ${json.error.error_msg} (code ${json.error.error_code})`);
    }
    return json.response;
  }
}
