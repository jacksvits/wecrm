-- Почтовый клиент: подпись (HTML) per-аккаунт и опции автоподстановки
-- («новое письмо», «ответ», «пересылка»)

ALTER TABLE "mail_accounts" ADD COLUMN "signature" TEXT NOT NULL DEFAULT '',
ADD COLUMN "sig_on_new" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sig_on_reply" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sig_on_forward" BOOLEAN NOT NULL DEFAULT true;
