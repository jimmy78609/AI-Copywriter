// api/generate.js - Vercel 無服務器函數

export default async function handler(req, res) {
  // 設定 CORS 標頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: '只允許 POST 請求',
      method: req.method 
    });
  }

  console.log('收到生成請求:', req.body);

  try {
    const { prompt, provider = 'google', stepNumber } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: '請提供 prompt 參數' 
      });
    }

    let response;
    let usedProvider = provider;

    // 根據服務商調用對應 API
    switch (provider) {
      case 'google':
        response = await callGoogleAPI(prompt);
        break;
      case 'openai':
        response = await callOpenAI(prompt);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt);
        break;
      default:
        return res.status(400).json({ 
          error: `不支援的 AI 服務商: ${provider}` 
        });
    }

    // 成功回應
    console.log('生成成功，回應長度:', response.length);
    
    res.status(200).json({ 
      success: true,
      content: response,
      provider: usedProvider,
      stepNumber: stepNumber,
      timestamp: new Date().toISOString(),
      length: response.length
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    
    // 錯誤分類和回應
    let errorMessage = '服務暫時無法使用，請稍後再試';
    let statusCode = 500;
    
    if (error.message.includes('API_KEY')) {
      errorMessage = 'API Key 設定有問題，請檢查環境變數';
      statusCode = 401;
    } else if (error.message.includes('429')) {
      errorMessage = 'API 使用量超限，請稍後再試';
      statusCode = 429;
    } else if (error.message.includes('401')) {
      errorMessage = 'API Key 無效或權限不足';
      statusCode = 401;
    } else if (error.message.includes('quota')) {
      errorMessage = 'API 額度不足，請檢查帳戶餘額';
      statusCode = 402;
    } else if (error.message.includes('timeout')) {
      errorMessage = '請求超時，請稍後再試';
      statusCode = 408;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

// Google Gemini API 調用
async function callGoogleAPI(prompt) {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY 環境變數未設定');
  }

  console.log('調用 Google Gemini API...');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `你是一位專業的療癒師文案寫手，擅長寫出溫暖、自然、不具強迫性的文案。請用繁體中文回覆。\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Google API 錯誤:', response.status, errorData);
    
    if (response.status === 400) {
      throw new Error('Google API 請求格式錯誤，請檢查 API Key');
    } else if (response.status === 403) {
      throw new Error('Google API 權限不足或 API Key 無效');
    } else if (response.status === 429) {
      throw new Error('Google API 使用量超限');
    } else {
      throw new Error(`Google API 錯誤 (${response.status}): ${errorData}`);
    }
  }

  const data = await response.json();
  console.log('Google API 回應:', data);

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('Google API 回應格式異常:', data);
    throw new Error('Google API 回應格式異常，請稍後再試');
  }

  const content = data.candidates[0].content.parts[0].text;
  console.log('Google API 成功，內容長度:', content.length);
  
  return content;
}

// OpenAI API 調用
async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 環境變數未設定');
  }

  console.log('調用 OpenAI GPT-4 API...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一位專業的療癒師文案寫手，擅長寫出溫暖、自然、不具強迫性的文案。請用繁體中文回覆。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.8
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API 錯誤:', response.status, errorData);
    
    if (response.status === 401) {
      throw new Error('OpenAI API Key 無效');
    } else if (response.status === 429) {
      throw new Error('OpenAI API 使用量超限');
    } else {
      throw new Error(`OpenAI API 錯誤: ${errorData.error?.message || response.status}`);
    }
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  console.log('OpenAI API 成功，內容長度:', content.length);
  
  return content;
}

// Anthropic API 調用
async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 環境變數未設定');
  }

  console.log('調用 Anthropic Claude API...');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `你是一位專業的療癒師文案寫手，擅長寫出溫暖、自然、不具強迫性的文案。請用繁體中文回覆。\n\n${prompt}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Anthropic API 錯誤:', response.status, errorData);
    
    if (response.status === 401) {
      throw new Error('Anthropic API Key 無效');
    } else if (response.status === 429) {
      throw new Error('Anthropic API 使用量超限');
    } else {
      throw new Error(`Anthropic API 錯誤: ${errorData.error?.message || response.status}`);
    }
  }

  const data = await response.json();
  const content = data.content[0].text;
  console.log('Anthropic API 成功，內容長度:', content.length);
  
  return content;
}