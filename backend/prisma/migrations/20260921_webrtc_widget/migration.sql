-- WebRTC-виджет Novofon: переключатель в настройках телефонии
ALTER TABLE "telephony_settings" ADD COLUMN "web_rtc_enabled" BOOLEAN NOT NULL DEFAULT false;
