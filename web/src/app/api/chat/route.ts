import { NextRequest } from 'next/server';
import { chatWithDeepSeek } from '@/lib/deepseek';

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  const stream = await chatWithDeepSeek(message, history || []);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
