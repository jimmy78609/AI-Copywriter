// 🌱 療癒師文案生成器 - 詳細診斷版

// 頁面載入時初始化
window.onload = function() {
    loadSavedApiKey();
    updateApiInfo();
    checkBackendAvailability();
};

// 檢查後端API是否可用
async function checkBackendAvailability() {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'test',
                provider: 'google'
            })
        });
        
        console.log('後端API檢查結果:', response.status);
        
        if (response.ok || response.status === 400) {
            console.log('✅ 後端API可用');
            window.backendAvailable = true;
            showBackendStatus('✅ 後端服務可用');
        } else if (response.status === 401) {
            console.log('⚠️ 後端API無權限 - 缺少環境變數');
            window.backendAvailable = false;
            showBackendStatus('⚠️ 後端缺少API Key設定');
        } else {
            console.log('❌ 後端API不可用');
            window.backendAvailable = false;
            showBackendStatus('❌ 後端服務不可用');
        }
    } catch (error) {
        console.log('❌ 後端API連線失敗:', error);
        window.backendAvailable = false;
        showBackendStatus('❌ 後端連線失敗');
    }
}

// 顯示後端狀態
function showBackendStatus(message) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
        background: #333; color: white; padding: 8px 15px; border-radius: 5px;
        font-size: 12px; z-index: 1000; opacity: 0.8;
    `;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => statusDiv.remove(), 3000);
}

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
            links: '<a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio (免費申請)</a>',
            backend: window.backendAvailable ? '✅ 後端支援' : '❌ 後端不支援'
        },
        openai: {
            description: '💡 OpenAI 新用戶贈送$5額度，約可使用150-200次',
            links: '<a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a>',
            backend: '❌ 後端未設定'
        },
        anthropic: {
            description: '💡 Anthropic Claude 品質最高，需要付費但成本很低',
            links: '<a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>',
            backend: '❌ 後端未設定'
        }
    };
    
    const info = infoTexts[provider] || infoTexts.google;
    
    apiInfo.innerHTML = `
        <small>${info.description}</small>
        <br>
        <small>🔗 申請連結：</small>
        <div class="api-links">${info.links}</div>
        <br>
        <small>🔧 後端狀態：${info.backend}</small>
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

// 顯示詳細錯誤訊息
function showError(message, details = '') {
    hideLoading();
    
    // 移除舊的錯誤訊息
    const oldError = document.querySelector('.error-message');
    if (oldError) oldError.remove();
    
    // 創建詳細錯誤訊息
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    
    let errorContent = `❌ ${message}`;
    if (details) {
        errorContent += `<br><small style="opacity: 0.8;">詳細信息: ${details}</small>`;
    }
    
    // 添加診斷建議
    const suggestions = getDiagnosticSuggestions(message);
    if (suggestions) {
        errorContent += `<br><br><strong>💡 解決建議:</strong><br>${suggestions}`;
    }
    
    errorDiv.innerHTML = errorContent;
    
    // 插入到表單前面
    const form = document.getElementById('copywritingForm');
    if (form) {
        form.parentNode.insertBefore(errorDiv, form);
        
        // 10秒後自動移除（延長時間讓用戶看清楚）
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

// 診斷建議系統
function getDiagnosticSuggestions(errorMessage) {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('failed to fetch')) {
        return `
            • 🌐 <strong>網路問題</strong>: 檢查網路連線或嘗試手機熱點<br>
            • 🔒 <strong>CORS限制</strong>: 瀏覽器阻止直接調用API<br>
            • 🏢 <strong>防火牆</strong>: 公司網路可能阻擋外部API<br>
            • 🔧 <strong>建議</strong>: 嘗試使用後端模式或更換網路環境
        `;
    }
    
    if (message.includes('api key') && message.includes('無效')) {
        return `
            • 🔑 <strong>API Key錯誤</strong>: 檢查是否完整複製<br>
            • 📅 <strong>權限問題</strong>: 確認API Key尚未過期<br>
            • 🌍 <strong>地區限制</strong>: 某些地區可能無法使用<br>
            • 🔧 <strong>建議</strong>: 重新申請或檢查API Key設定
        `;
    }
    
    if (message.includes('使用量超限') || message.includes('429')) {
        return `
            • 📊 <strong>額度用完</strong>: API調用次數已達上限<br>
            • ⏰ <strong>等待重置</strong>: 通常每月1號重置免費額度<br>
            • 💰 <strong>付費升級</strong>: 考慮升級到付費方案<br>
            • 🔧 <strong>建議</strong>: 稍後再試或使用其他服務商
        `;
    }
    
    if (message.includes('anthropic') || message.includes('claude')) {
        return `
            • 🚫 <strong>Claude API未設定</strong>: 後端缺少Anthropic API Key<br>
            • 💰 <strong>需要付費</strong>: Claude API沒有免費額度<br>
            • 🔧 <strong>建議</strong>: 使用Google Gemini (有免費額度)
        `;
    }
    
    return null;
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

// 主要API調用函數 - 智能診斷模式
async function callAI(prompt) {
    const apiKey = document.getElementById('apiKey')?.value?.trim();
    const provider = document.getElementById('apiProvider')?.value || 'google';
    
    console.log(`🔍 開始API調用 - 提供商: ${provider}, 有API Key: ${!!apiKey}, 後端可用: ${window.backendAvailable}`);
    
    // 如果選擇Claude但沒有API Key且後端不支援
    if (provider === 'anthropic' && !apiKey && !window.backendAvailable) {
        throw new Error('Claude API需要您自己的API Key，後端未提供此服務', 'anthropic_no_backend');
    }
    
    // 如果有API Key，優先使用前端直調
    if (apiKey) {
        try {
            console.log('🚀 嘗試前端直調API...');
            return await callDirectAPI(prompt, apiKey, provider);
        } catch (error) {
            console.error('❌ 前端API調用失敗:', error);
            
            // 詳細錯誤分析
            if (error.message.includes('Failed to fetch')) {
                // 如果是CORS錯誤且後端可用，切換到後端
                if (window.backendAvailable && provider === 'google') {
                    console.log('🔄 切換到後端模式...');
                    showLoading('前端調用失敗，切換到後端服務...');
                    return await callBackendAPI(prompt, provider);
                } else {
                    throw new Error('網路連線失敗或CORS限制', `前端調用${provider} API失敗，可能是網路問題或瀏覽器安全限制`);
                }
            } else {
                throw error;
            }
        }
    } else if (window.backendAvailable && provider === 'google') {
        // 沒有API Key但後端支援Google
        console.log('🔄 使用後端Google API...');
        return await callBackendAPI(prompt, provider);
    } else {
        throw new Error('請輸入API Key或選擇其他服務商', `${provider}服務需要API Key，或者選擇Google Gemini使用後端服務`);
    }
}

// 前端直接調用API
async function callDirectAPI(prompt, apiKey, provider) {
    console.log(`📡 前端直調 ${provider} API...`);
    
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

// 後端API調用
async function callBackendAPI(prompt, provider) {
    console.log(`🔧 後端調用 ${provider} API...`);
    
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: prompt,
            provider: provider
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || `後端API錯誤 (${response.status})`;
        throw new Error(errorMsg, `後端回應: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ 後端API調用成功');
    return data.content;
}

// Google Gemini API調用
async function callGoogle(prompt, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
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
        console.error('Google API 詳細錯誤:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
        });
        
        if (response.status === 400) {
            throw new Error('Google API Key 可能無效，請檢查是否正確', `HTTP ${response.status}: ${errorText}`);
        } else if (response.status === 403) {
            throw new Error('Google API 權限不足，請檢查 API Key 權限設定', `HTTP ${response.status}: ${errorText}`);
        } else if (response.status === 429) {
            throw new Error('Google API 使用量超限，請稍後再試或檢查額度', `HTTP ${response.status}: ${errorText}`);
        } else {
            throw new Error(`Google API 錯誤 (${response.status})，請稍後再試`, errorText);
        }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Google API 回應格式異常:', data);
        throw new Error('Google API 回應格式異常，請稍後再試', JSON.stringify(data));
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
        console.error('OpenAI API 詳細錯誤:', error);
        
        if (response.status === 401) {
            throw new Error('OpenAI API Key 無效，請檢查是否正確', JSON.stringify(error));
        } else if (response.status === 429) {
            throw new Error('OpenAI API 使用量超限，請檢查額度或稍後再試', JSON.stringify(error));
        } else if (response.status === 402) {
            throw new Error('OpenAI 帳戶餘額不足，請檢查付費狀態', JSON.stringify(error));
        } else {
            throw new Error(`OpenAI API錯誤: ${error.error?.message || '未知錯誤'}`, JSON.stringify(error));
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
        console.error('Anthropic API 詳細錯誤:', error);
        
        if (response.status === 401) {
            throw new Error('Anthropic API Key 無效，請檢查是否正確', JSON.stringify(error));
        } else if (response.status === 429) {
            throw new Error('Anthropic API 使用量超限，請稍後再試', JSON.stringify(error));
        } else if (response.status === 402) {
            throw new Error('Anthropic 帳戶餘額不足，請檢查付費狀態', JSON.stringify(error));
        } else {
            throw new Error(`Anthropic API錯誤: ${error.error?.message || '未知錯誤'}`, JSON.stringify(error));
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
    const provider = document.getElementById('apiProvider')?.value || 'google';
    
    console.log('🎬 開始生成文案...', { provider, hasApiKey: !!apiKey, backendAvailable: window.backendAvailable });

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
        console.error('🔥 生成錯誤詳情:', error);
        const details = error.stack ? error.stack.substring(0, 200) : error.toString();
        showError(`生成失敗: ${error.message}`, details);
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
