/**
 * Utility for sending LINE Messaging API push messages.
 * Falls back to mock logging if real keys are not configured.
 */
export async function sendLineMessage(lineUserId: string, text: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  const isMock = !token || token.startsWith('mock-') || process.env.NODE_ENV !== 'production';

  if (isMock) {
    console.log('\n--- 💬 [MOCK LINE BOT SEND] ---');
    console.log(`To LINE User ID: ${lineUserId}`);
    console.log(`Message Content:\n${text}`);
    console.log('-------------------------------\n');
    return true;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[LINE Messaging API Error] Status: ${response.status}, Details:`, errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[LINE Messaging API Network Error]:', error);
    return false;
  }
}
