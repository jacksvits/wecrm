-- User-Agent push-подписки: детализация устройств в виджете Директора.
ALTER TABLE "push_subscriptions" ADD COLUMN "userAgent" TEXT;
