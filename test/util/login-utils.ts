import type { Express } from 'express';
import request from 'supertest';

/**
 * Port of `LogInUtils` — authenticates and hands back the raw JWT.
 */
export async function getTokenForLogin(username: string, password: string, app: Express): Promise<string> {
   const response = await request(app)
      .post('/api/authenticate')
      .set('Content-Type', 'application/json')
      .send(`{"password": "${password}", "username": "${username}"}`);

   const authResponse = JSON.parse(response.text) as { id_token: string };
   return authResponse.id_token;
}
