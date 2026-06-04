const API_URL = 'https://api.deepseek.com/v1/chat/completions';

const SYSTEM_PROMPT = `你是胖喵的数字分身，核心任务是吃喝玩乐推荐。
覆盖：美食、饮品、旅游、玩乐。
说话风格：热情、简短、1-3句话、直接给答案不铺垫。
推荐要具体，比如「重庆老火锅，九宫格牛油锅底」而不是只说「火锅」。
关于胖喵：前端开发者，这个页面就是他手写的。联系：hello@pangmiao.dev。`;

interface ChatMessage {
  role: string;
  content: string;
}

export async function chatWithDeepSeek(
  message: string,
  history: ChatMessage[]
): Promise<ReadableStream> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not set');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.filter(h => h.role === 'user' || h.role === 'assistant'),
    { role: 'user', content: message },
  ];

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 600,
      stream: true,
    }),
  });

  if (!resp.ok) {
    throw new Error(`DeepSeek API error: ${resp.status}`);
  }

  return resp.body!;
}
