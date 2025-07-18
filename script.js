// 🌱 療癒師文案生成器 - 完整前端功能

// 頁面載入時初始化
window.onload = function() {
    loadSavedApiKey();
    updateApiInfo();
};

// API提供商改變時更新資訊
document.addEventListener('DOMContentLoaded', function() {
    const providerSelect = document.getElementById('apiProvider');
    if (providerSelect) {
        providerSelect.addEventListener('change', updateApiInfo);
    }
});

// 更新API資訊顯示
function updateApiInfo() {
    const provider = document.getElementById('apiProvider')?.value;
    const apiInfo = document.querySelector('.api-info');
    
    if (!apiInfo) return;
    
    const infoTexts = {
        google: {
            description: '💡 Google Gemini 有免費額度，每月可免費使用15次',
            links: '<a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio (免費申請)</a>'
        },
        openai: {
            description: '💡 OpenAI 新用戶贈送$5額度，約可使用150-200次',
            links: '<a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a>'
        },
        anthropic: {
            description: '💡 Anthropic Claude 品質最高，需要付費但成本很低',
            links: '<a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>'
        }
    };
    
    const info = infoTexts[provider] || infoTexts.google;
    apiInfo.innerHTML = `
        <small>${info.description}</small>
        <br>
        <small>🔗 申請連結：</small>
        <div class="api-links">${info.links}</div>
    `;
}

// 顯示教學彈窗
function showTutorial() {
    const modal = document.getElementById('tutorialModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// 關閉教學彈窗
function closeTutorial() {
    const modal = document.getElementById('tutorialModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 點擊彈窗外部關閉
window.onclick = function(event) {
    const modal = document.getElementById('tutorialModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// 保存和讀取API Key
function saveApiKey() {
    try {
        const apiKey = document.getElementById('apiKey')?.value;
        const provider = document.getElementById('apiProvider')?.value;
        if (apiKey) {
            localStorage.setItem('healingCopywriter_apiKey', apiKey);
            localStorage.setItem('healingCopywriter_provider', provider);
        }
    } catch (error) {
        console.log('保存API Key失敗:', error);
    }
}

function loadSavedApiKey() {
    try {
        const savedKey = localStorage.getItem('healingCopywriter_apiKey');
        const savedProvider = localStorage.getItem('healingCopywriter_provider');
        
        if (savedKey && document.getElementById('apiKey')) {
            document.getElementById('apiKey').value = savedKey;
        }
        if (savedProvider && document.getElementById('apiProvider')) {
            document.getElementById('apiProvider').value = savedProvider;
        }
    } catch (error) {
        console.log('載入API Key失敗:', error);
    }
}

// 顯示載入狀態
function showLoading(message = '正在生成溫暖文案...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingStep = document.getElementById('loadingStep');
    
    if (overlay) overlay.style.display = 'flex';
    if (loadingStep) loadingStep.textContent = message;
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// 顯示錯誤訊息
function showError(message) {
    hideLoading();
    
    // 移除舊的錯誤訊息
    const oldError = document.querySelector('.error-message');
    if (oldError) oldError.remove();
    
    // 創建新的錯誤訊息
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `❌ ${message}`;
    
    // 插入到表單前面
    const form = document.getElementById('copywritingForm');
    if (form) {
        form.parentNode.insertBefore(errorDiv, form);
        
        // 5秒後自動移除
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// 顯示成功訊息
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = `✅ ${message}`;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// API調用函數
async function callAI(prompt) {
    const apiKey = document.getElementById('apiKey')?.value?.trim();
    const provider = document.getElementById('apiProvider')?.value || 'google';
    
    if (!apiKey) {
        throw new Error('請輸入API Key');
    }

    saveApiKey();

    switch (provider) {
        case 'openai':
            return await callOpenAI(prompt, apiKey);
        case 'anthropic':
            return await callAnthropic(prompt, apiKey);
        case 'google':
        default:
            return await callGoogle(prompt, apiKey);
    }
}

// Google Gemini API調用
async function callGoogle(prompt, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Google API 錯誤:', response.status, errorText);
        
        if (response.status === 400) {
            throw new Error('Google API Key 可能無效，請檢查是否正確');
        } else if (response.status === 403) {
            throw new Error('Google API 權限不足，請檢查 API Key 權限設定');
        } else if (response.status === 429) {
            throw new Error('Google API 使用量超限，請稍後再試或檢查額度');
        } else {
            throw new Error(`Google API 錯誤 (${response.status})，請稍後再試`);
        }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Google API 回應格式異常:', data);
        throw new Error('Google API 回應格式異常，請稍後再試');
    }

    return data.candidates[0].content.parts[0].text;
}

// OpenAI API調用
async function callOpenAI(prompt, apiKey) {
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
        const error = await response.json();
        console.error('OpenAI API 錯誤:', error);
        
        if (response.status === 401) {
            throw new Error('OpenAI API Key 無效，請檢查是否正確');
        } else if (response.status === 429) {
            throw new Error('OpenAI API 使用量超限，請檢查額度或稍後再試');
        } else if (response.status === 402) {
            throw new Error('OpenAI 帳戶餘額不足，請檢查付費狀態');
        } else {
            throw new Error(`OpenAI API錯誤: ${error.error?.message || '未知錯誤'}`);
        }
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Anthropic API調用
async function callAnthropic(prompt, apiKey) {
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
        const error = await response.json();
        console.error('Anthropic API 錯誤:', error);
        
        if (response.status === 401) {
            throw new Error('Anthropic API Key 無效，請檢查是否正確');
        } else if (response.status === 429) {
            throw new Error('Anthropic API 使用量超限，請稍後再試');
        } else if (response.status === 402) {
            throw new Error('Anthropic 帳戶餘額不足，請檢查付費狀態');
        } else {
            throw new Error(`Anthropic API錯誤: ${error.error?.message || '未知錯誤'}`);
        }
    }

    const data = await response.json();
    return data.content[0].text;
}

// 主要生成函數
async function generateContent() {
    // 收集表單資料
    const formData = {
        serviceType: document.getElementById('serviceType')?.value || '',
        targetClient: document.getElementById('targetClient')?.value || '',
        clientPain: document.getElementById('clientPain')?.value || '',
        serviceHelp: document.getElementById('serviceHelp')?.value || '',
        transformation: document.getElementById('transformation')?.value || '',
        background: document.getElementById('background')?.value || '',
        contactMethod: document.getElementById('contactMethod')?.value || 'line',
        contactInfo: document.getElementById('contactInfo')?.value || ''
    };

    // 檢查必填欄位
    if (!formData.serviceType || !formData.targetClient || !formData.clientPain) {
        showError('請至少填寫服務類型、服務對象和他們的困擾');
        return;
    }

    const apiKey = document.getElementById('apiKey')?.value?.trim();
    if (!apiKey) {
        showError('請輸入API Key才能使用AI生成功能');
        return;
    }

    // 顯示載入狀態
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.classList.add('loading');
        generateBtn.textContent = '生成中...';
        generateBtn.disabled = true;
    }

    showLoading('正在生成溫暖文案...');

    try {
        // 清空之前的內容
        for (let i = 1; i <= 5; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                stepElement.innerHTML = '生成中...';
                stepElement.classList.remove('empty');
            }
        }

        // 隱藏完整文案
        const finalCopy = document.getElementById('finalCopy');
        if (finalCopy) finalCopy.style.display = 'none';

        // 依序生成各步驟文案
        await generateStep1(formData);
        await generateStep2(formData);
        await generateStep3(formData);
        await generateStep4(formData);
        await generateStep5(formData);
        
        // 生成完整文案
        generateFinalContent();
        
        hideLoading();
        showSuccess('文案生成完成！');
        
    } catch (error) {
        console.error('生成錯誤:', error);
        showError(`生成失敗: ${error.message}`);
    } finally {
        // 恢復按鈕狀態
        if (generateBtn) {
            generateBtn.classList.remove('loading');
            generateBtn.textContent = '🌸 生成溫暖文案';
            generateBtn.disabled = false;
        }
        hideLoading();
    }
}

// 生成各步驟文案
async function generateStep1(data) {
    const prompt = `
請為療癒師寫一段「自然分享」的文案開場，要求：
- 像朋友聊天一樣真誠
- 針對${data.targetClient}
- 提到他們的困擾：${data.clientPain}
- 服務類型：${data.serviceType}
- 語氣溫暖、自然，不要有推銷感
- 字數約150-200字
- 用繁體中文
    `;

    try {
        showLoading('正在生成自然分享內容...');
        const content = await callAI(prompt);
        document.getElementById('step1').innerHTML = content;
    } catch (error) {
        document.getElementById('step1').innerHTML = `生成失敗: ${error.message}`;
        throw error;
    }
}

async function generateStep2(data) {
    const prompt = `
請為療癒師寫一段「建立共鳴」的文案，要求：
- 展現對${data.targetClient}困擾的理解和同理心
- 提到他們的痛點：${data.clientPain}
- 讓讀者感到「你懂我」
- 語氣溫暖、理解，不批判
- 字數約200-250字
- 用繁體中文
    `;

    try {
        showLoading('正在生成建立共鳴內容...');
        const content = await callAI(prompt);
        document.getElementById('step2').innerHTML = content;
    } catch (error) {
        document.getElementById('step2').innerHTML = `生成失敗: ${error.message}`;
        throw error;
    }
}

async function generateStep3(data) {
    const prompt = `
請為療癒師寫一段「展現專業」的文案，要求：
- 溫和地建立信任感
- 提到背景：${data.background}
- 服務類型：${data.serviceType}
- 強調陪伴而非治療
- 語氣專業但溫暖
- 字數約200-250字
- 用繁體中文
    `;

    try {
        showLoading('正在生成展現專業內容...');
        const content = await callAI(prompt);
        document.getElementById('step3').innerHTML = content;
    } catch (error) {
        document.getElementById('step3').innerHTML = `生成失敗: ${error.message}`;
        throw error;
    }
}

async function generateStep4(data) {
    const prompt = `
請為療癒師寫一段「溫柔邀請」的文案，要求：
- 分享服務能帶來的美好改變：${data.transformation}
- 服務如何幫助：${data.serviceHelp}
- 用溫暖的語氣描述未來的可能
- 不要有強迫性或誇大的詞彙
- 字數約250-300字
- 用繁體中文
    `;

    try {
        showLoading('正在生成溫柔邀請內容...');
        const content = await callAI(prompt);
        document.getElementById('step4').innerHTML = content;
    } catch (error) {
        document.getElementById('step4').innerHTML = `生成失敗: ${error.message}`;
        throw error;
    }
}

async function generateStep5(data) {
    const contactMethods = {
        line: '加LINE',
        message: '私訊',
        phone: '電話',
        form: '填寫表單'
    };

    const prompt = `
請為療癒師寫一段「簡單行動」的文案，要求：
- 邀請透過${contactMethods[data.contactMethod]}聯繫：${data.contactInfo}
- 強調沒有壓力、完全自由選擇
- 語氣溫暖、不強迫
- 讓人感到安心和被支持
- 字數約200-250字
- 用繁體中文
    `;

    try {
        showLoading('正在生成簡單行動內容...');
        const content = await callAI(prompt);
        document.getElementById('step5').innerHTML = content;
        
        // 顯示完整文案
        const finalCopy = document.getElementById('finalCopy');
        if (finalCopy) finalCopy.style.display = 'block';
    } catch (error) {
        document.getElementById('step5').innerHTML = `生成失敗: ${error.message}`;
        throw error;
    }
}

// 生成完整文案
function generateFinalContent() {
    const steps = [];
    for (let i = 1; i <= 5; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (stepElement && !stepElement.innerHTML.includes('生成失敗')) {
            steps.push(stepElement.innerHTML);
        }
    }
    
    const finalContent = steps.join('\n\n');
    const finalCopyContent = document.getElementById('finalCopyContent');
    if (finalCopyContent) {
        finalCopyContent.innerHTML = finalContent;
    }
}

// 複製功能
async function copyStep(stepNumber) {
    const stepElement = document.getElementById(`step${stepNumber}`);
    if (!stepElement) return;
    
    try {
        const stepContent = stepElement.innerText;
        await navigator.clipboard.writeText(stepContent);
        showSuccess(`第${stepNumber}步文案已複製到剪貼板`);
    } catch (error) {
        console.error('複製失敗:', error);
        showError('複製失敗，請手動選取文字複製');
    }
}

async function copyFinalCopy() {
    const finalElement = document.getElementById('finalCopyContent');
    if (!finalElement) return;
    
    try {
        const finalContent = finalElement.innerText;
        await navigator.clipboard.writeText(finalContent);
        showSuccess('完整文案已複製到剪貼板');
    } catch (error) {
        console.error('複製失敗:', error);
        showError('複製失敗，請手動選取文字複製');
    }
}
