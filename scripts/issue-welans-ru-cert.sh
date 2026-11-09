#!/bin/bash
# Выпуск Let's Encrypt сертификата для welans.ru ПОСЛЕ переноса A-записи DNS на 89.23.5.137.
# Заменяет временный самоподписанный сертификат в /etc/nginx/sites-available/welans-extra.
set -e
sudo certbot certonly --webroot -w /var/www/certbot -d welans.ru -d www.welans.ru
sudo sed -i 's#/etc/nginx/ssl/welans.ru.crt#/etc/letsencrypt/live/welans.ru/fullchain.pem#; s#/etc/nginx/ssl/welans.ru.key#/etc/letsencrypt/live/welans.ru/privkey.pem#' /etc/nginx/sites-available/welans-extra
sudo nginx -t && sudo systemctl reload nginx
echo "Сертификат Let's Encrypt для welans.ru установлен"
