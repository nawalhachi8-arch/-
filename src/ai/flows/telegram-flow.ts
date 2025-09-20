'use server';
/**
 * @fileOverview A flow to send messages to a Telegram chat.
 *
 * - sendTelegramMessage - A function that sends a message to a hardcoded chat.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Hardcoded values for simplicity
const TELEGRAM_BOT_TOKEN = "8365032928:AAF9D7xhT16s98i30mJQrdXMOw-SmaAj35w";
const TELEGRAM_CHAT_ID = "7519641546";


export async function sendTelegramMessage(message: string): Promise<{ ok: boolean, description?: string }> {
  return await telegramFlow(message);
}

const telegramFlow = ai.defineFlow(
  {
    name: 'telegramFlow',
    inputSchema: z.string(),
    outputSchema: z.object({
      ok: z.boolean(),
      description: z.string().optional(),
    }),
  },
  async (message) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        throw new Error("Telegram token or chat ID are not set in the code.");
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Telegram API error:', data.description);
        return { ok: false, description: data.description };
      }

      return { ok: true };
    } catch (error: any) {
      console.error('Failed to send Telegram message:', error);
      return { ok: false, description: error.message || 'Unknown fetch error' };
    }
  }
);
