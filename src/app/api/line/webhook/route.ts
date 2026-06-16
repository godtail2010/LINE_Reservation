import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      // Handle text messages sent to the bot
      if (event.type === 'message' && event.message.type === 'text') {
        const replyToken = event.replyToken;
        const userMessage = event.message.text;

        // If the user says "予約" (booking) or similar, send them the LIFF link
        let replyText = `ご相談ありがとうございます！✨\nサロンのご予約は、下の「予約する」メニューまたは以下のリンクより承っております。👇\n\nhttps://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || 'mock-liff-id'}`;

        if (userMessage.includes('営業時間') || userMessage.includes('時間') || userMessage.includes('営業')) {
          replyText = `AURA Salon & Spa の営業時間はこちらになります。\n\n■営業時間: 10:00 - 20:00\n■定休日: 不定休\n\nご予約はこちらからどうぞ！👇\nhttps://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || 'mock-liff-id'}`;
        }

        // Send reply message
        if (token && !token.startsWith('mock-')) {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              replyToken: replyToken,
              messages: [
                {
                  type: 'text',
                  text: replyText,
                },
              ],
            }),
          });
        } else {
          console.log('\n--- 💬 [MOCK LINE BOT REPLY] ---');
          console.log(`Reply Token: ${replyToken}`);
          console.log(`Message Reply:\n${replyText}`);
          console.log('--------------------------------\n');
        }
      }
      
      // Handle user adding/following the bot
      if (event.type === 'follow') {
        const replyToken = event.replyToken;
        const welcomeText = `友だち追加ありがとうございます！✨\n「AURA Salon & Spa」公式アカウントです。\n\nこちらから簡単にご予約・空き状況の確認ができます！👇\nhttps://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || 'mock-liff-id'}`;

        if (token && !token.startsWith('mock-')) {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              replyToken: replyToken,
              messages: [
                {
                  type: 'text',
                  text: welcomeText,
                },
              ],
            }),
          });
        } else {
          console.log('\n--- 💬 [MOCK LINE BOT FOLLOW WELCOME] ---');
          console.log(`Welcome Message Sent:\n${welcomeText}`);
          console.log('-----------------------------------------\n');
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LINE Webhook Error]:', error);
    // Always return 200 to LINE Webhook so it doesn't try to retrying failed requests indefinitely
    return NextResponse.json({ success: true });
  }
}
