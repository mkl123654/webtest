const http = require('http');
const fs = require('fs');
const path = require('path');

// ===== Config =====
const PORT = process.env.PORT || 3456;
const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error('❌ 请设置环境变量 DEEPSEEK_API_KEY');
  console.error('   PowerShell: $env:DEEPSEEK_API_KEY="sk-..."');
  console.error('   CMD:       set DEEPSEEK_API_KEY=sk-...');
  process.exit(1);
}

const SYSTEM_PROMPT = `你是**胖喵**的数字分身，运行在胖喵的个人主页上。你的核心任务就是给访客做吃喝玩乐推荐。

## 你的能力

你是吃喝玩乐推荐专家，覆盖：
- 🍽️ **美食**：各地特色菜、街头小吃、网红餐厅、深夜食堂等
- 🧋 **饮品**：奶茶、咖啡、精酿啤酒、鸡尾酒、茶饮等
- ✈️ **旅游**：周末出游、城市周边、古镇、徒步、露营、打卡地等
- 🎮 **玩乐**：聚会活动、密室逃脱、桌游、沉浸式剧场、DIY手作、KTV等

当访客描述心情或偏好时，主动给出具体推荐（店名/菜名/地点/玩法），每条推荐带一句简短理由。

## 关于胖喵

胖喵是本站的开发者，一个正在学习前端的新手。如果有人问起他，可以简单介绍：前端开发者，正在学 HTML/CSS/JS，这个页面就是他手写的。联系方式：hello@pangmiao.dev。

## 说话风格

- 热情、有活力，像朋友安利好吃好玩的一样
- **简短直接，1-3 句话搞定，不要废话**
- 推荐要具体：「重庆老火锅，九宫格牛油锅底！」不要只说「火锅」
- 别铺垫，直接给答案

## 边界

- 推荐内容可以发挥你的知识，但别太离谱
- 如果访客的问题和吃喝玩乐完全无关，礼貌引导回推荐话题
- 不知道的事情老实说不知道`;

// ===== MIME types =====
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// ===== Helpers =====
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({ raw: body }); }
    });
    req.on('error', reject);
  });
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain; charset=utf-8' });
  fs.createReadStream(filePath).pipe(res);
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ===== Server =====
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // --- Serve index.html ---
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return serveFile(res, path.join(__dirname, 'index.html'));
  }

  // --- Chat API ---
  if (req.method === 'POST' && url.pathname === '/api/chat') {
    const { message, history } = await readBody(req);

    if (!message) return sendJSON(res, 400, { error: 'message is required' });

    // Build messages: system prompt + history + new message
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        if (h.role === 'user') messages.push({ role: 'user', content: h.content });
        if (h.role === 'assistant') messages.push({ role: 'assistant', content: h.content });
      }
    }
    messages.push({ role: 'user', content: message });

    // Call DeepSeek API
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      const apiResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 600,
          stream: true,
        }),
      });

      if (!apiResp.ok) {
        const errText = await apiResp.text();
        console.error('DeepSeek API error:', apiResp.status, errText);
        res.write(`data: ${JSON.stringify({ type: 'error', error: '回复出了点问题，稍后再试～' })}\n\n`);
        return res.end();
      }

      const reader = apiResp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const json = JSON.parse(raw);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ type: 'text', text: delta })}\n\n`);
            }
          } catch {}
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (err) {
      console.error('DeepSeek API error:', err.message);
      res.write(`data: ${JSON.stringify({ type: 'error', error: '回复出了点问题，稍后再试～' })}\n\n`);
    }

    return res.end();
  }

  // --- 404 ---
  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n🐱 胖喵个人主页已启动: http://localhost:${PORT}\n`);
  console.log('   数字分身使用 DeepSeek 驱动\n');
});
