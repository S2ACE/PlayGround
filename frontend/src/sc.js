// src/fast-stable-dictionary-scraper.js
import { chromium } from 'playwright';
import fs from 'fs';

class FastStableDictionaryScraper {
    constructor() {
        this.browsers = [];
        this.concurrency = 4; // 增加到4個並發
        this.results = [];
        this.failed = [];
        this.processed = 0;
        this.startTime = Date.now();
        this.apiBaseUrl = 'https://localhost:44376/api/v1/vocab/en';
        this.consecutiveFailures = 0;
        this.totalFailures = 0;
        this.retryQueue = [];
    }

    async fetchWordsFromAPI(filters = {}) {
        try {
            console.log('🔄 正在從API獲取詞彙列表...');
            
            const queryParams = new URLSearchParams();
            
            if (filters.level) queryParams.append('level', filters.level);
            if (filters.partOfSpeech) queryParams.append('partOfSpeech', filters.partOfSpeech);
            if (filters.limit) queryParams.append('limit', filters.limit);
            if (filters.hasNoDefinition) queryParams.append('hasNoDefinition', 'true');
            if (filters.hasNoExample) queryParams.append('hasNoExample', 'true');
            
            const apiUrl = queryParams.toString() ? 
                `${this.apiBaseUrl}?${queryParams.toString()}` : 
                this.apiBaseUrl;
            
            console.log(`📡 API URL: ${apiUrl}`);
            
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API回應錯誤: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ 從API獲取到 ${data.length} 個詞彙`);
            
            return data.map(word => ({
                id: word.id,
                word: word.word,
                partOfSpeech: word.partofspeech || word.partOfSpeech,
                level: word.level,
                hasDefinition: !!(word.englishdefinition || word.englishDefinition),
                hasExample: !!(word.example)
            }));
            
        } catch (error) {
            console.error(`❌ API獲取失敗: ${error.message}`);
            throw error;
        }
    }

    async init() {
        console.log(`🚀 啟動 ${this.concurrency} 個快速穩定瀏覽器...`);
        console.log('⚡ 快速穩定模式：120分鐘目標 + 詞性精準匹配 + 自動修復');
        
        this.browsers = [];
        
        for (let i = 0; i < this.concurrency; i++) {
            const browserInfo = await this.createBrowser(i + 1);
            this.browsers.push(browserInfo);
        }
        
        console.log('✅ 快速穩定瀏覽器群組啟動完成！');
    }

    async createBrowser(id) {
        let retryCount = 0;
        const maxRetries = 2; // 減少重試次數加快速度
        
        while (retryCount < maxRetries) {
            try {
                console.log(`🏗️  創建瀏覽器 ${id} (嘗試 ${retryCount + 1}/${maxRetries})`);
                
                const browser = await chromium.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox', 
                        '--disable-dev-shm-usage',
                        '--disable-images',
                        '--disable-plugins',
                        '--disable-extensions',
                        '--no-first-run',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-features=VizDisplayCompositor',
                        '--memory-pressure-off',
                        '--max_old_space_size=2048', // 減少記憶體分配加快速度
                        '--disable-background-networking',
                        '--disable-default-apps',
                        '--disable-sync'
                    ]
                });
                
                browser.on('disconnected', () => {
                    console.log(`⚠️  瀏覽器 ${id} 意外關閉，將在下次使用時重建`);
                });
                
                const page = await browser.newPage();
                
                // 縮短超時時間加快速度
                page.setDefaultTimeout(15000);
                page.setDefaultNavigationTimeout(15000);
                
                // 阻攔更多不必要的資源
                await page.route('**/*', (route) => {
                    const url = route.request().url();
                    const resourceType = route.request().resourceType();
                    
                    // 阻攔所有廣告和追蹤相關請求
                    if (
                        // 廣告相關
                        url.includes('cookielaw.org') ||
                        url.includes('cloudflareinsights.com') ||
                        url.includes('amazon-adsystem.com') ||
                        url.includes('pubmatic.com') ||
                        url.includes('rubiconproject.com') ||
                        url.includes('ampproject.org') ||
                        url.includes('polarbyte.com') ||
                        url.includes('adsrvr.org') ||
                        url.includes('3lift.com') ||
                        url.includes('openx.net') ||
                        url.includes('4dex.io') ||
                        url.includes('teads.tv') ||
                        url.includes('lijit.com') ||
                        url.includes('privacymanager.io') ||
                        // 資源類型阻攔
                        ['image', 'media', 'font', 'stylesheet'].includes(resourceType) ||
                        // 其他不必要資源
                        url.includes('beacon') ||
                        url.includes('analytics') ||
                        url.includes('tracking') ||
                        url.includes('prebid') ||
                        url.includes('ads') ||
                        url.includes('doubleclick')
                    ) {
                        route.abort();
                    } else {
                        route.continue();
                    }
                });
                
                // 移除錯誤監聽器減少日誌噪音
                page.setExtraHTTPHeaders({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'max-age=0'
                });
                
                await page.setViewportSize({ width: 1366, height: 768 });
                
                console.log(`✅ 瀏覽器 ${id} 創建成功`);
                
                return { 
                    browser, 
                    page, 
                    busy: false, 
                    id, 
                    isValid: true,
                    createTime: Date.now()
                };
                
            } catch (error) {
                retryCount++;
                console.log(`❌ 瀏覽器 ${id} 創建失敗 (嘗試 ${retryCount}/${maxRetries}): ${error.message}`);
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 縮短等待時間
                }
            }
        }
        
        throw new Error(`無法創建瀏覽器 ${id}`);
    }

    async ensureBrowserValid(browserInfo) {
        try {
            if (!browserInfo.browser.isConnected()) {
                console.log(`🔧 瀏覽器 ${browserInfo.id} 已斷線，快速重建中...`);
                browserInfo.isValid = false;
                
                try {
                    await browserInfo.browser.close();
                } catch (e) {}
                
                const newBrowserInfo = await this.createBrowser(browserInfo.id);
                Object.assign(browserInfo, newBrowserInfo);
                return true;
            }
            
            try {
                await browserInfo.page.evaluate(() => 1);
                return true;
            } catch (error) {
                console.log(`🔧 頁面 ${browserInfo.id} 無效，快速重建頁面...`);
                
                try {
                    await browserInfo.page.close();
                } catch (e) {}
                
                browserInfo.page = await browserInfo.browser.newPage();
                
                await browserInfo.page.route('**/*', (route) => {
                    const url = route.request().url();
                    const resourceType = route.request().resourceType();
                    
                    if (
                        url.includes('cookielaw.org') ||
                        url.includes('cloudflareinsights.com') ||
                        url.includes('amazon-adsystem.com') ||
                        url.includes('pubmatic.com') ||
                        url.includes('rubiconproject.com') ||
                        url.includes('ampproject.org') ||
                        url.includes('polarbyte.com') ||
                        ['image', 'media', 'font', 'stylesheet'].includes(resourceType) ||
                        url.includes('ads') ||
                        url.includes('tracking')
                    ) {
                        route.abort();
                    } else {
                        route.continue();
                    }
                });
                
                await browserInfo.page.setExtraHTTPHeaders({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                });
                
                await browserInfo.page.setViewportSize({ width: 1366, height: 768 });
                
                return true;
            }
            
        } catch (error) {
            console.log(`❌ 無法修復瀏覽器 ${browserInfo.id}: ${error.message}`);
            return false;
        }
    }

    async processWords(words) {
        console.log(`🎯 開始快速穩定處理 ${words.length} 個單字...`);
        console.log(`⚡ 策略：120分鐘目標 + 自動修復 + 詞性精準匹配`);
        
        // 檢查多詞性詞彙
        const wordGroups = {};
        words.forEach(word => {
            if (!wordGroups[word.word]) {
                wordGroups[word.word] = [];
            }
            wordGroups[word.word].push(word);
        });
        
        const multiPOSWords = Object.entries(wordGroups).filter(([word, entries]) => entries.length > 1);
        if (multiPOSWords.length > 0) {
            console.log(`\n🔍 發現 ${multiPOSWords.length} 個多詞性詞彙，將進行精準匹配：`);
            multiPOSWords.slice(0, 5).forEach(([word, entries]) => {
                const posList = entries.map(e => `${e.partOfSpeech}(ID:${e.id})`).join(', ');
                console.log(`   ${word}: ${posList}`);
            });
            console.log('');
        }
        
        const tasks = [...words];
        
        const worker = async (browserInfo) => {
            while (tasks.length > 0) {
                const word = tasks.shift();
                if (!word) break;
                
                // 縮短暫停時間
                if (this.consecutiveFailures >= 15) {
                    console.log(`⏸️  Worker${browserInfo.id}: 連續失敗過多，暫停30秒...`);
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    this.consecutiveFailures = 0;
                }
                
                try {
                    browserInfo.busy = true;
                    
                    const browserValid = await this.ensureBrowserValid(browserInfo);
                    if (!browserValid) {
                        throw new Error('無法修復瀏覽器');
                    }
                    
                    const wordData = await this.fastScrapeWordData(
                        browserInfo.page, word, browserInfo.id
                    );
                    
                    if (wordData) {
                        this.results.push(wordData);
                        this.consecutiveFailures = 0;
                        console.log(`✅ Worker${browserInfo.id}: ${word.word} (${word.partOfSpeech.toUpperCase()}) - ${wordData.posMatched ? '詞性匹配' : '備用匹配'} | ${wordData.englishDefinition ? 'EN' : ''}${wordData.chineseDefinition ? 'CN' : ''}${wordData.example ? 'EX' : ''}`);
                    } else {
                        this.failed.push(word);
                        this.consecutiveFailures++;
                        this.totalFailures++;
                        console.log(`❌ Worker${browserInfo.id}: ${word.word} (${word.partOfSpeech.toUpperCase()}) - 抓取失敗 (連續失敗: ${this.consecutiveFailures})`);
                    }
                    
                    this.processed++;
                    
                    if (this.processed % 50 === 0) {
                        this.showProgress(words.length);
                    }
                    
                } catch (error) {
                    this.failed.push({ ...word, error: error.message });
                    this.processed++;
                    this.consecutiveFailures++;
                    this.totalFailures++;
                    console.log(`❌ Worker${browserInfo.id}: ${word.word} (${word.partOfSpeech.toUpperCase()}) - 錯誤: ${error.message}`);
                    
                    try {
                        await this.ensureBrowserValid(browserInfo);
                    } catch (fixError) {
                        console.log(`🚨 Worker${browserInfo.id}: 無法修復瀏覽器: ${fixError.message}`);
                    }
                    
                } finally {
                    browserInfo.busy = false;
                    
                    // 大幅縮短延遲時間
                    let baseDelay = 1000; // 從3秒縮短到1秒
                    if (this.totalFailures > 30) baseDelay = 1500;
                    if (this.totalFailures > 60) baseDelay = 2000;
                    
                    const randomDelay = baseDelay + Math.random() * 500; // 縮短隨機延遲
                    await new Promise(resolve => setTimeout(resolve, randomDelay));
                }
            }
        };
        
        const workers = this.browsers.map(browser => worker(browser));
        await Promise.all(workers);
        
        return { successful: this.results, failed: this.failed };
    }

    async fastScrapeWordData(page, word, browserID) {
        const maxRetries = 1; // 減少重試次數加快速度
        let attempt = 0;
        
        // 詞性標準化映射
        const posMapping = {
            'n': 'noun', 'noun': 'noun',
            'v': 'verb', 'verb': 'verb',
            'adj': 'adjective', 'adjective': 'adjective',
            'adv': 'adverb', 'adverb': 'adverb',
            'prep': 'preposition', 'preposition': 'preposition',
            'conj': 'conjunction', 'conjunction': 'conjunction',
            'pron': 'pronoun', 'pronoun': 'pronoun',
            'det': 'determiner', 'determiner': 'determiner',
            'excl': 'exclamation', 'exclamation': 'exclamation',
            'indefinite article': 'determiner',
            'definite article': 'determiner'
        };
        
        const standardPOS = posMapping[word.partOfSpeech.toLowerCase()] || word.partOfSpeech.toLowerCase();
        
        while (attempt <= maxRetries) {
            try {
                const wordLower = word.word.toLowerCase().replace(/\s+/g, '-');
                const results = {
                    id: word.id,
                    word: word.word,
                    partOfSpeech: word.partOfSpeech,
                    level: word.level,
                    englishDefinition: '',
                    chineseDefinition: '',
                    example: '',
                    pronunciation: '',
                    posMatched: false
                };

                // 優先嘗試英漢對照頁面
                const combinedUrl = `https://dictionary.cambridge.org/dictionary/english-chinese-traditional/${wordLower}`;
                
                try {
                    // 檢查頁面有效性
                    try {
                        await page.evaluate(() => 1);
                    } catch (pageError) {
                        throw new Error('Page invalid before navigation');
                    }
                    
                    const response = await page.goto(combinedUrl, { 
                        waitUntil: 'domcontentloaded',  
                        timeout: 12000 // 縮短超時時間
                    });
                    
                    if (!response || response.status() !== 200) {
                        throw new Error(`HTTP ${response ? response.status() : 'no response'}`);
                    }
                    
                    // 縮短等待時間
                    await page.waitForTimeout(1000);
                    
                    const combinedData = await page.evaluate(({ partOfSpeech, standardPOS }) => {
                        const data = {
                            englishDef: '',
                            chineseDef: '',
                            example: '',
                            pronunciation: '',
                            posMatched: false
                        };

                        try {
                            // 快速檢查錯誤頁面
                            if (document.title.toLowerCase().includes('error') || 
                                document.querySelector('.error, .no-results')) {
                                return data;
                            }

                            // 尋找詞條區塊
                            const blocks = document.querySelectorAll('.pr.dictionary, .entry-body__el, .pos-body');
                            
                            if (blocks.length === 0) {
                                return data;
                            }
                            
                            // 詞性匹配變體
                            const posVariants = [
                                partOfSpeech.toLowerCase(),
                                standardPOS
                            ].filter(Boolean);
                            
                            // 快速精確匹配
                            for (let block of blocks) {
                                const posEl = block.querySelector('.pos, .posgram .pos');
                                if (posEl) {
                                    const blockPOS = posEl.textContent.trim().toLowerCase();
                                    
                                    if (posVariants.some(variant => 
                                        blockPOS === variant || 
                                        blockPOS.includes(variant)
                                    )) {
                                        
                                        const defEl = block.querySelector('.def');
                                        if (defEl) data.englishDef = defEl.textContent.trim();
                                        
                                        const transEl = block.querySelector('.trans');
                                        if (transEl) data.chineseDef = transEl.textContent.trim();
                                        
                                        const exEl = block.querySelector('.eg');
                                        if (exEl) data.example = exEl.textContent.trim();
                                        
                                        const pronEl = block.querySelector('.ipa, .pron .ipa');
                                        if (pronEl) data.pronunciation = pronEl.textContent.trim();
                                        
                                        if (data.englishDef || data.chineseDef) {
                                            data.posMatched = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            // 快速備用：使用第一個可用的定義
                            if (!data.englishDef && !data.chineseDef && blocks.length > 0) {
                                const firstBlock = blocks[0];
                                
                                const firstDef = firstBlock.querySelector('.def');
                                if (firstDef) data.englishDef = firstDef.textContent.trim();
                                
                                const firstTrans = firstBlock.querySelector('.trans');
                                if (firstTrans) data.chineseDef = firstTrans.textContent.trim();
                                
                                const firstEx = firstBlock.querySelector('.eg');
                                if (firstEx) data.example = firstEx.textContent.trim();
                                
                                const firstPron = firstBlock.querySelector('.ipa, .pron .ipa');
                                if (firstPron) data.pronunciation = firstPron.textContent.trim();
                            }
                        } catch (evalError) {
                            // 忽略錯誤繼續
                        }

                        return data;
                    }, { partOfSpeech: word.partOfSpeech, standardPOS: standardPOS });

                    results.englishDefinition = combinedData.englishDef;
                    results.chineseDefinition = combinedData.chineseDef;
                    results.example = combinedData.example;
                    results.pronunciation = combinedData.pronunciation;
                    results.posMatched = combinedData.posMatched;

                    if (results.englishDefinition || results.chineseDefinition) {
                        return results;
                    }

                } catch (error) {
                    // 如果英漢頁面失敗，快速嘗試純英文頁面
                    const englishUrl = `https://dictionary.cambridge.org/dictionary/english/${wordLower}`;
                    
                    try {
                        try {
                            await page.evaluate(() => 1);
                        } catch (pageError) {
                            throw new Error('Page invalid before English navigation');
                        }
                        
                        const response = await page.goto(englishUrl, { 
                            waitUntil: 'domcontentloaded', 
                            timeout: 12000 
                        });
                        
                        if (!response || response.status() !== 200) {
                            throw new Error(`HTTP ${response ? response.status() : 'no response'}`);
                        }
                        
                        await page.waitForTimeout(1000);

                        const englishData = await page.evaluate(({ partOfSpeech, standardPOS }) => {
                            const data = { def: '', example: '', pron: '', posMatched: false };
                            
                            try {
                                const blocks = document.querySelectorAll('.pr.dictionary, .entry-body__el, .pos-body');
                                
                                const posVariants = [
                                    partOfSpeech.toLowerCase(),
                                    standardPOS
                                ].filter(Boolean);
                                
                                for (let block of blocks) {
                                    const posEl = block.querySelector('.pos');
                                    if (posEl) {
                                        const blockPOS = posEl.textContent.trim().toLowerCase();
                                        
                                        if (posVariants.some(variant => 
                                            blockPOS === variant || 
                                            blockPOS.includes(variant)
                                        )) {
                                            
                                            const defEl = block.querySelector('.def');
                                            if (defEl) data.def = defEl.textContent.trim();
                                            
                                            const exEl = block.querySelector('.eg');
                                            if (exEl) data.example = exEl.textContent.trim();
                                            
                                            const pronEl = block.querySelector('.ipa');
                                            if (pronEl) data.pron = pronEl.textContent.trim();
                                            
                                            if (data.def) {
                                                data.posMatched = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                // 備用
                                if (!data.def && blocks.length > 0) {
                                    const firstBlock = blocks[0];
                                    const firstDef = firstBlock.querySelector('.def');
                                    if (firstDef) data.def = firstDef.textContent.trim();
                                    
                                    const firstEx = firstBlock.querySelector('.eg');
                                    if (firstEx) data.example = firstEx.textContent.trim();
                                    
                                    const firstPron = firstBlock.querySelector('.ipa');
                                    if (firstPron) data.pron = firstPron.textContent.trim();
                                }
                            } catch (evalError) {
                                // 忽略錯誤
                            }
                            
                            return data;
                        }, { partOfSpeech: word.partOfSpeech, standardPOS: standardPOS });

                        results.englishDefinition = englishData.def || results.englishDefinition;
                        results.example = englishData.example || results.example;
                        results.pronunciation = englishData.pron || results.pronunciation;
                        
                        if (englishData.posMatched && !results.posMatched) {
                            results.posMatched = true;
                        }

                    } catch (englishError) {
                        // 忽略英文頁面錯誤
                    }
                }

                // 如果有任何內容就返回
                if (results.englishDefinition || results.chineseDefinition || results.example) {
                    return results;
                }

                // 快速重試
                attempt++;
                if (attempt <= maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 縮短重試等待
                }

            } catch (error) {
                attempt++;
                if (attempt <= maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        return null;
    }

    showProgress(total) {
        const elapsed = (Date.now() - this.startTime) / 60000;
        const rate = this.processed / elapsed;
        const eta = (total - this.processed) / rate;
        const successRate = ((this.results.length / this.processed) * 100).toFixed(1);
        
        const posMatchedCount = this.results.filter(r => r.posMatched).length;
        const posMatchRate = this.results.length > 0 ? ((posMatchedCount / this.results.length) * 100).toFixed(1) : '0.0';
        
        console.log(`📊 進度: [${this.processed}/${total}] (${((this.processed/total)*100).toFixed(1)}%)`);
        console.log(`   ✅ 成功: ${this.results.length} | ❌ 失敗: ${this.failed.length} | 📈 成功率: ${successRate}%`);
        console.log(`   🎯 詞性匹配: ${posMatchedCount}/${this.results.length} (${posMatchRate}%)`);
        console.log(`   🚨 總失敗: ${this.totalFailures} | 連續失敗: ${this.consecutiveFailures}`);
        console.log(`   ⚡ 速度: ${rate.toFixed(1)} 個/分鐘 | ⏰ 預計剩餘: ${eta.toFixed(1)} 分鐘`);
        
        // 120分鐘目標檢查
        if (rate > 0) {
            const projectedTime = total / rate;
            const timeStatus = projectedTime <= 120 ? '🎯' : projectedTime <= 180 ? '⚠️' : '❌';
            console.log(`   📍 預計總時間: ${projectedTime.toFixed(1)} 分鐘 ${timeStatus} (目標: 120分鐘)`);
            
            if (projectedTime > 120 && this.processed > 100) {
                console.log(`   🚀 建議：可考慮增加 concurrency 到 5-6 個以達到120分鐘目標`);
            }
        }
        console.log('');
    }

    async close() {
        console.log('🔄 關閉快速穩定瀏覽器群組...');
        for (const browserInfo of this.browsers) {
            try {
                if (browserInfo.browser && browserInfo.browser.isConnected()) {
                    await browserInfo.browser.close();
                }
            } catch (error) {
                console.log(`⚠️  關閉瀏覽器 ${browserInfo.id} 時出錯: ${error.message}`);
            }
        }
    }
}

// SQL 生成函數
function generateFastStableSQL(results) {
    if (results.length === 0) return;
    
    const sqlStatements = results.map(item => {
        const escaped = {
            englishDef: item.englishDefinition.replace(/'/g, "''"),
            chineseDef: item.chineseDefinition.replace(/'/g, "''"),
            example: item.example.replace(/'/g, "''"),
            pronunciation: item.pronunciation.replace(/'/g, "''")
        };
        
        const posMatchLabel = item.posMatched ? '✓詞性匹配' : '⚠️備用匹配';
        
        return `-- ${item.word} (${item.partOfSpeech.toUpperCase()}) - Level ${item.level} - ${posMatchLabel}
UPDATE [Languages_Dev].[dbo].[Vocabulary] 
SET EnglishDefinition = N'${escaped.englishDef}', 
    ChineseDefinition = N'${escaped.chineseDef}', 
    Example = N'${escaped.example}', 
    Pronunciation = N'${escaped.pronunciation}', 
    UpdatedDate = GETDATE() 
WHERE id = ${item.id};`;
    });
    
    const posMatchedCount = results.filter(r => r.posMatched).length;
    const posMatchRate = ((posMatchedCount / results.length) * 100).toFixed(1);
    
    const sqlContent = `-- 快速穩定版詞典數據更新腳本（120分鐘目標）
-- 處理詞彙: ${results.length} 個
-- 詞性精準匹配: ${posMatchedCount}/${results.length} (${posMatchRate}%)
-- 生成時間: ${new Date().toISOString()}
-- 特色：120分鐘目標 + 自動修復 + 詞性精準匹配

USE [Languages_Dev];
GO

BEGIN TRANSACTION;

${sqlStatements.join('\n\n')}

COMMIT;

SELECT COUNT(*) as UpdatedWords FROM [Languages_Dev].[dbo].[Vocabulary] 
WHERE id IN (${results.map(w => w.id).join(', ')}) 
AND (EnglishDefinition IS NOT NULL OR ChineseDefinition IS NOT NULL);

PRINT '快速穩定版完成: ${results.length} 個單字已更新，詞性匹配率: ${posMatchRate}%';`;
    
    fs.writeFileSync('fast_stable_dictionary_update.sql', sqlContent);
    console.log('📝 快速穩定版 SQL 腳本已生成: fast_stable_dictionary_update.sql');
}

async function main() {
    console.log('⚡ 快速穩定版詞典爬蟲啟動！');
    console.log('🎯 目標：120分鐘內完成 + 詞性精準匹配 + 自動修復');
    console.log('💎 特色：確保 ACCESS(noun) 和 ACCESS(verb) 獲得不同定義');
    console.log('🚀 配置：4個並發 + 快速重試 + 資源阻攔 + 縮短延遲');
    console.log('⚠️  注意：速度優先，適度犧牲穩定性以達到120分鐘目標\n');
    
    const scraper = new FastStableDictionaryScraper();
    
    try {
        const apiFilters = {
            // limit: 5000,  // 設定你的目標數量
            // hasNoDefinition: true,
        };
        
        const words = await scraper.fetchWordsFromAPI(apiFilters);
        
        if (words.length === 0) {
            console.log('⚠️  沒有符合條件的詞彙');
            return;
        }
        
        // 動態計算目標速度
        const targetMinutes = 120;
        const requiredRate = Math.ceil(words.length / targetMinutes);
        
        console.log(`📊 即將處理 ${words.length} 個詞彙`);
        console.log(`⚡ 目標速度: ${requiredRate} 個/分鐘 (120分鐘完成)`);
        console.log(`⚡ 預期成功率: 70-85% (速度優先)`);
        console.log(`🎯 目標時間: ${targetMinutes} 分鐘\n`);
        
        if (requiredRate > 70) {
            console.log(`⚠️  警告：所需速度 (${requiredRate}/分鐘) 較高，建議考慮：`);
            console.log(`   - 增加 concurrency 到 5-6`);
            console.log(`   - 或分批處理以提高成功率\n`);
        }
        
        const startTime = Date.now();
        
        await scraper.init();
        const results = await scraper.processWords(words);
        await scraper.close();
        
        const totalTime = (Date.now() - startTime) / 60000;
        const actualSuccessRate = (results.successful.length / words.length) * 100;
        
        const posMatchedCount = results.successful.filter(r => r.posMatched).length;
        const posMatchRate = results.successful.length > 0 ? 
            ((posMatchedCount / results.successful.length) * 100).toFixed(1) : '0.0';
        
        console.log(`\n🎉 快速穩定版爬取完成！`);
        console.log(`⏱️  實際用時: ${totalTime.toFixed(1)} 分鐘`);
        console.log(`✅ 成功: ${results.successful.length} 個`);
        console.log(`❌ 失敗: ${results.failed.length} 個`);
        console.log(`📈 最終成功率: ${actualSuccessRate.toFixed(1)}%`);
        console.log(`🎯 詞性匹配率: ${posMatchedCount}/${results.successful.length} (${posMatchRate}%)`);
        console.log(`⚡ 實際速度: ${(words.length / totalTime).toFixed(1)} 個/分鐘`);
        
        // 120分鐘目標評估
        console.log(`\n📊 120分鐘目標評估：`);
        if (totalTime <= 120) {
            console.log(`   🎯 時間目標達成！ (${totalTime.toFixed(1)} <= 120分鐘)`);
        } else {
            console.log(`   ⚠️  時間目標未達成 (${totalTime.toFixed(1)} > 120分鐘)`);
            const suggestionRate = Math.ceil(words.length / 120);
            console.log(`   💡 建議：需要 ${suggestionRate} 個/分鐘的速度才能120分鐘完成`);
        }
        
        if (actualSuccessRate >= 70) {
            console.log(`   ✅ 成功率達標 (目標70%+)`);
        } else {
            console.log(`   ⚠️  成功率未達標 (${actualSuccessRate.toFixed(1)}% < 70%)`);
        }
        
        if (parseFloat(posMatchRate) >= 60) {
            console.log(`   ✅ 詞性匹配率良好 (${posMatchRate}% >= 60%)`);
        } else {
            console.log(`   ⚠️  詞性匹配率可改善 (${posMatchRate}% < 60%)`);
        }
        
        let hasEng = 0, hasChi = 0, hasEx = 0, hasPron = 0;
        results.successful.forEach(w => {
            if (w.englishDefinition) hasEng++;
            if (w.chineseDefinition) hasChi++;
            if (w.example) hasEx++;
            if (w.pronunciation) hasPron++;
        });
        
        console.log(`\n📋 資料品質報告:`);
        console.log(`   📝 英文定義: ${hasEng}/${results.successful.length} (${((hasEng/results.successful.length)*100).toFixed(1)}%)`);
        console.log(`   🀄 中文定義: ${hasChi}/${results.successful.length} (${((hasChi/results.successful.length)*100).toFixed(1)}%)`);
        console.log(`   💬 例句: ${hasEx}/${results.successful.length} (${((hasEx/results.successful.length)*100).toFixed(1)}%)`);
        console.log(`   🔊 發音: ${hasPron}/${results.successful.length} (${((hasPron/results.successful.length)*100).toFixed(1)}%)`);
        console.log(`   🎯 詞性精準: ${posMatchedCount}/${results.successful.length} (${posMatchRate}%)`);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const report = {
            metadata: {
                mode: 'fast-stable-120min-target',
                totalWords: words.length,
                successful: results.successful.length,
                failed: results.failed.length,
                successRate: actualSuccessRate.toFixed(1) + '%',
                posMatchRate: posMatchRate + '%',
                timeMinutes: totalTime.toFixed(1),
                targetTime: 120,
                targetAchieved: totalTime <= 120,
                speed: (words.length / totalTime).toFixed(1) + ' words/minute'
            },
            results: results.successful,
            failures: results.failed
        };
        
        fs.writeFileSync(`fast_stable_results_${timestamp}.json`, JSON.stringify(report, null, 2));
        
        if (results.successful.length > 0) {
            generateFastStableSQL(results.successful);
        }
        
        console.log(`\n📁 檔案已生成:`);
        console.log(`   📊 fast_stable_results_${timestamp}.json`);
        console.log(`   📝 fast_stable_dictionary_update.sql`);
        
        if (totalTime > 120) {
            console.log(`\n💡 下次優化建議:`);
            console.log(`   - 將 concurrency 增加到 ${Math.min(8, Math.ceil(4 * (totalTime / 120)))}`);
            console.log(`   - 或考慮分批處理以維持成功率`);
        } else {
            console.log(`\n🎉 恭喜達到120分鐘目標！可以用相同設定處理剩餘詞彙`);
        }
        
    } catch (error) {
        console.error(`❌ 執行錯誤: ${error.message}`);
        console.error(error.stack);
    }
}

main().catch(console.error);
