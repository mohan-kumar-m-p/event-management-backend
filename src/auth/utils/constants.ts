import * as dotenv from 'dotenv';

dotenv.config({ path: `.env` });

export const jwtConstants: Record<string, string> = {
  secret: process.env.JWT_SECRET,
};
