// 24小時不間斷訪問的URL數組
const defaultUrls = [            
  'https://new-api-latest-4gv0.onrender.com/about'
];

// 指定時間段(1:00～5:00)訪問的URL數組
const defaultWebsites = [
   
];

// 從環境變數獲取URL數組
function getUrlsFromEnv(prefix: string): string[] {
  const envUrls: string[] = [];
  let index = 1;
  while (true) {
    const url = Deno.env.get(`${prefix}${index}`);
    if (!url) break;
    envUrls.push(url);
    index++;
  }
  return envUrls;
}

// 讀取默認URL和環境變數中的URL
const urls = [...defaultUrls, ...getUrlsFromEnv('URL_')];
const websites = [...defaultWebsites, ...getUrlsFromEnv('WEBSITE_')];

// 檢查是否在暫停時間內 (1:00-5:00)
function isInPauseTime(hour: number): boolean {
  return hour >= 1 && hour < 5;
}

// 生成隨機IP
function getRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// 生成隨機版本號
function getRandomVersion(): number {
  return Math.floor(Math.random() * (131 - 100 + 1)) + 100;
}

// 獲取隨機 User-Agent
function getRandomUserAgent(): string {
  const agents = [
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomVersion()}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${getRandomVersion()}.0.0.0 Safari/537.36`,
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/${getRandomVersion()}.0.0.0`,
    `Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1`
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

interface RequestResult {
  index: number;
  url: string;
  status: number;
  success: boolean;
  timestamp: string;
}

async function axiosLikeRequest(url: string, index: number, retryCount = 0): Promise<RequestResult> {
  try {
    // 隨機延遲 1-6 秒
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 5000));
    
    const config = {
      method: 'get',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'X-Forwarded-For': getRandomIP(),
        'X-Real-IP': getRandomIP(),
        'Origin': 'https://glitch.com',
        'Referer': 'https://glitch.com/'
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const status = response.status;
    const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' });
    
    return {
      index,
      url,
      status,
      success: status === 200,
      timestamp
    };
    
  } catch (error) {
    if (retryCount < 2) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      return axiosLikeRequest(url, index, retryCount + 1);
    }
    const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' });
    console.error(`${timestamp} 訪問失敗: ${url} 狀態碼: 500`);
    return {
      index,
      url,
      status: 500,
      success: false,
      timestamp
    };
  }
}

async function handleScheduled() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Hong_Kong' }));
  const hour = now.getHours();

  // 24小時訪問
  const results = await Promise.all(urls.map((url, index) => axiosLikeRequest(url, index)));
  
  results.sort((a, b) => a.index - b.index).forEach(result => {
    if (result.success) {
      console.log(`${result.timestamp} 訪問成功: ${result.url}`);
    } else {
      console.error(`${result.timestamp} 訪問失敗: ${result.url} 狀態碼: ${result.status}`);
    }
  });

  // 檢查是否在暫停時間
  if (!isInPauseTime(hour)) {
    const websiteResults = await Promise.all(websites.map((url, index) => axiosLikeRequest(url, index)));
    
    websiteResults.sort((a, b) => a.index - b.index).forEach(result => {
      if (result.success) {
        console.log(`${result.timestamp} 訪問成功: ${result.url}`);
      } else {
        console.error(`${result.timestamp} 訪問失敗: ${result.url} 狀態碼: ${result.status}`);
      }
    });
  } else {
    console.log(`當前處於暫停時間 1:00-5:00 --- ${now.toLocaleString()}`);
  }
}

// 啟動定時任務
if (import.meta.main) {
  await handleScheduled();
}
