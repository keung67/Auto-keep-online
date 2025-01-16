// app.ts
import { serve } from "https://deno.land/std@0.218.0/http/server.ts";

// 設定 URL
const urls = [
  'https://new-api-latest-4gv0.onrender.com/about'
];

const websites = [
  
];

// 基本函數
function isInPauseTime(hour: number): boolean {
  return hour >= 1 && hour < 5;
}

function getRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function getRandomVersion(): number {
  return Math.floor(Math.random() * (131 - 100 + 1)) + 100;
}

function getRandomUserAgent(): string {
  const agents = [
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomVersion()}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomVersion()}.0.0.0 Safari/537.36`
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

// URL 檢查函數
async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'X-Forwarded-For': getRandomIP()
      }
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

// 主要檢查邏輯
async function checkUrls() {
  const now = new Date();
  const hour = now.getHours();
  const timestamp = now.toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' });

  // 檢查所有 24 小時 URLs
  for (const url of urls) {
    const success = await checkUrl(url);
    console.log(`${timestamp} ${url}: ${success ? '成功' : '失敗'}`);
  }

  // 檢查特定時段 URLs
  if (!isInPauseTime(hour)) {
    for (const url of websites) {
      const success = await checkUrl(url);
      console.log(`${timestamp} ${url}: ${success ? '成功' : '失敗'}`);
    }
  }
}

// 服務處理函數
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  if (url.pathname === "/check") {
    await checkUrls();
    return new Response("檢查完成", {
      headers: { "content-type": "text/plain" },
    });
  }
  
  return new Response("URL 檢查服務運行中", {
    headers: { "content-type": "text/plain" },
  });
}

// 啟動服務
serve(handler);
