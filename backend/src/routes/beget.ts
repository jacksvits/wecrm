import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import fs from 'fs';

const router = Router();
const DATA_FILE = '/app/data/beget.json';

router.get('/', async (_req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return res.json(data);
    }
    res.status(404).json({ status: 'error', error: 'Данные не найдены' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// GET /api/beget/account — данные аккаунта для виджетов
// user_* — данные личного кабинета из API Beget (api.beget.com),
// partner_balance / active_referrals / last_transaction_* — партнёрский кабинет (парсер)
router.get('/account', async (_req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      const account = {
        login: raw.login || 'softboeg',
        plan_name: raw.plan_name || 'Партнёрский',
        user_balance: raw.user_balance ?? 0,
        partner_balance: raw.partner_balance ?? raw.balance ?? 0,
        user_days_to_block: raw.user_days_to_block ?? 0,
        user_quota: raw.user_quota ?? 0,
        plan_quota: raw.plan_quota ?? 0,
        user_sites: raw.user_sites ?? 0,
        plan_site: raw.plan_site ?? 0,
        user_domains: raw.user_domains ?? 0,
        server_name: raw.server_name || '—',
        active_referrals: raw.active_referrals ?? 0,
        last_transaction: raw.last_transaction || null,
        last_transaction_amount: raw.last_transaction_amount ?? 0,
        updated_at: raw.updated_at || null,
        status: raw.status || 'ok',
        error: raw.error || null,
      };
      return res.json(account);
    }
    res.status(404).json({ status: 'error', error: 'Данные не найдены' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

// GET /api/beget/domains — список доменов
router.get('/domains', async (_req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return res.json(data.domains || []);
    }
    res.status(404).json({ status: 'error', error: 'Данные не найдены' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});

export default router;
