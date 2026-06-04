const { execSync } = require('child_process');

const PORTS = [3000, 3001, 3002, 3005, 4000];

for (const port of PORTS) {
  try {
    const result = execSync(`netstat -ano | findstr ":${port} "`, {
      encoding: 'utf8',
      windowsHide: true,
    });
    const lines = result.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && pid !== '0') {
          execSync(`taskkill /F /PID ${pid}`, { windowsHide: true });
          console.log(`释放端口 ${port} (PID ${pid})`);
        }
      }
    }
  } catch {
    // 端口空闲，跳过
  }
}

console.log('端口清理完成');
