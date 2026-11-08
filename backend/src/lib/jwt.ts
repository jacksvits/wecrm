import dotenv from 'dotenv';
dotenv.config();

// Единый источник ключа JWT. В production слабый или отсутствующий ключ
// должен останавливать запуск, а не незаметно включать известный fallback.
const secret = process.env.JWT_SECRET || '';
if (secret.length < 32) {
  throw new Error('JWT_SECRET обязан быть задан и содержать не менее 32 символов');
}
export const JWT_SECRET = secret;
