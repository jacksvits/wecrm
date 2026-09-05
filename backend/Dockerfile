FROM node:20-slim

WORKDIR /app

RUN apt-get update -qq && apt-get install -y -qq openssl wget ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*

# Устанавливаем сертификаты Минцифры (требуются для API MAX)
# Файлы .cer на gu-st.ru уже в PEM-формате (Base64), просто копируем как .crt
RUN wget -q https://gu-st.ru/content/Other/doc/russian_trusted_root_ca.cer -O /usr/local/share/ca-certificates/russian_trusted_root_ca.crt &&     wget -q https://gu-st.ru/content/Other/doc/russian_trusted_sub_ca.cer -O /usr/local/share/ca-certificates/russian_trusted_sub_ca.crt &&     update-ca-certificates

COPY package*.json ./
RUN npm install

COPY . .
RUN mkdir -p /app/uploads
RUN npx prisma generate

EXPOSE 4000

CMD ["./entrypoint.sh"]
