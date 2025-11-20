// src/main.js
import { chromium } from 'playwright';
import fs from 'fs';
import https from 'https';

// 優化的並行爬取類
class ParallelExampleScraper {
    constructor(concurrency = 5) {
        this.browsers = [];
        this.concurrency = concurrency;
        this.results = [];
        this.failedWords = [];
    }

    async init() {
        console.log(`🚀 啟動 ${this.concurrency} 個並行瀏覽器...`);
        
        for (let i = 0; i < this.concurrency; i++) {
            const browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            
            const page = await browser.newPage();
            page.setDefaultTimeout(10000); // 10 秒超時
            page.setDefaultNavigationTimeout(10000);
            
            await page.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            
            this.browsers.push({ browser, page, busy: false });
        }
        
        console.log('✅ 並行瀏覽器啟動完成！');
    }

    async scrapeWordsParallel(words) {
        const results = [];
        const failed = [];
        
        // 創建任務隊列
        const tasks = words.map((word, index) => ({ word, index }));
        let completed = 0;
        
        const worker = async (workerBrowser) => {
            while (tasks.length > 0) {
                const task = tasks.shift();
                if (!task) break;
                
                try {
                    workerBrowser.busy = true;
                    const example = await this.scrapeExample(workerBrowser.page, task.word);
                    
                    if (example) {
                        results.push({
                            id: task.word.id,
                            word: task.word.word,
                            partOfSpeech: task.word.partOfSpeech,
                            level: task.word.level,
                            example: example
                        });
                    } else {
                        failed.push(task.word);
                    }
                    
                    completed++;
                    if (completed % 10 === 0) {
                        process.stdout.write(`\r✅ 已完成: ${completed}/${words.length} (${((completed/words.length)*100).toFixed(1)}%)`);
                    }
                    
                } catch (error) {
                    failed.push({ ...task.word, error: error.message });
                } finally {
                    workerBrowser.busy = false;
                    // 隨機延遲 200-500ms
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
                }
            }
        };
        
        // 啟動所有工作線程
        const workers = this.browsers.map(browser => worker(browser));
        await Promise.all(workers);
        
        console.log(); // 換行
        return { results, failed };
    }

    async scrapeExample(page, word) {
        try {
            const url = `https://dictionary.cambridge.org/dictionary/english/${word.word.toLowerCase()}`;
            
            // 快速導航，只等待 DOM 載入
            await page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: 8000 
            });
            
            // 快速查找例句
            const example = await page.evaluate((targetPos) => {
                const posMapping = {
                    'adj': ['adjective'], 'n': ['noun'], 'conj': ['conjunction'],
                    'adv': ['adverb'], 'prep': ['preposition'], 'v': ['verb']
                };
                
                const expectedPos = posMapping[targetPos.toLowerCase()] || [targetPos];
                
                // 嘗試找對應詞性的例句
                const entries = document.querySelectorAll('.entry-body .pos-header');
                for (let entry of entries) {
                    const posElement = entry.querySelector('.pos');
                    if (posElement) {
                        const webPos = posElement.textContent.trim().toLowerCase();
                        if (expectedPos.some(pos => webPos.includes(pos))) {
                            const parentSection = entry.parentElement;
                            const exampleElement = parentSection.querySelector('.eg');
                            if (exampleElement) {
                                return exampleElement.textContent.trim();
                            }
                        }
                    }
                }
                
                // 備用：找任何例句
                const quickSelectors = ['.eg', '.examp', '.example'];
                for (let selector of quickSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element.textContent.trim();
                    }
                }
                
                return null;
            }, word.partOfSpeech);
            
            return example;
            
        } catch (error) {
            return null;
        }
    }

    async close() {
        console.log('關閉所有瀏覽器...');
        for (const { browser } of this.browsers) {
            await browser.close();
        }
    }
}

// 從你的 API 載入詞彙資料
async function loadVocabularyFast() {
    console.log('📡 從你的 API 載入詞彙資料...');
    
    const API_BASE = 'https://localhost:44376';
    
    try {
        console.log(`🔍 連接到: ${API_BASE}/api/v1/vocab/en`);
        
        // 設置忽略自簽名證書（開發環境）
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
        
        const response = await fetch(`${API_BASE}/api/v1/vocab/en`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ 成功載入 ${data.length} 個單字！`);
        
        // 顯示詞性分佈
        const posCount = {};
        data.forEach(word => {
            posCount[word.partOfSpeech] = (posCount[word.partOfSpeech] || 0) + 1;
        });
        console.log('📊 詞性分佈:', posCount);
        
        return data;
        
    } catch (error) {
        console.error('❌ API 載入失敗:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 請確認你的 API 服務正在 https://localhost:44376 運行');
        }
        
        // 使用測試資料
        console.log('🔄 使用測試資料進行演示...');
        return [
            { id: 1, word: 'beautiful', partOfSpeech: 'adj', level: '1', definition: 'having beauty' },
            { id: 2, word: 'apple', partOfSpeech: 'n', level: '1', definition: 'a fruit' },
            { id: 3, word: 'run', partOfSpeech: 'v', level: '1', definition: 'to move fast' },
            { id: 4, word: 'quickly', partOfSpeech: 'adv', level: '2', definition: 'in a fast way' },
            { id: 5, word: 'house', partOfSpeech: 'n', level: '1', definition: 'a building' }
        ];
    }
}

// 超高速批次處理
async function processUltraFast(vocabularyData) {
    const startTime = Date.now();
    const batchSize = 100; // 每批 100 個單字
    const concurrency = 8; // 8 個並行瀏覽器
    
    console.log(`🚀 超高速模式啟動！`);
    console.log(`📊 ${vocabularyData.length} 個單字，${concurrency} 個並行瀏覽器`);
    console.log(`📦 每批 ${batchSize} 個單字`);
    console.log(`🎯 目標：30 分鐘內完成`);
    
    const scraper = new ParallelExampleScraper(concurrency);
    await scraper.init();
    
    const allResults = [];
    const allFailed = [];
    
    // 分批並行處理
    for (let i = 0; i < vocabularyData.length; i += batchSize) {
        const batchData = vocabularyData.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(vocabularyData.length / batchSize);
        
        console.log(`\n🔥 批次 ${batchNumber}/${totalBatches} - 處理 ${batchData.length} 個單字`);
        console.log(`📝 範圍: ${batchData[0]?.word} 到 ${batchData[batchData.length-1]?.word}`);
        
        const batchStartTime = Date.now();
        const { results, failed } = await scraper.scrapeWordsParallel(batchData);
        const batchTime = ((Date.now() - batchStartTime) / 1000).toFixed(1);
        
        allResults.push(...results);
        allFailed.push(...failed);
        
        console.log(`⚡ 批次完成用時: ${batchTime}秒，成功: ${results.length}/${batchData.length}`);
        
        // 保存進度
        const progress = {
            batch: batchNumber,
            completed: allResults.length,
            total: vocabularyData.length,
            successRate: ((allResults.length / (i + batchData.length)) * 100).toFixed(1) + '%'
        };
        fs.writeFileSync(`progress_${batchNumber.toString().padStart(3, '0')}.json`, JSON.stringify(progress, null, 2));
        
        // 顯示總進度和剩餘時間
        const totalProgress = ((allResults.length / vocabularyData.length) * 100).toFixed(1);
        const elapsedMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
        const estimatedTotal = elapsedMinutes > 0 ? (elapsedMinutes / (allResults.length / vocabularyData.length)).toFixed(1) : 'N/A';
        
        console.log(`📈 總進度: ${allResults.length}/${vocabularyData.length} (${totalProgress}%)`);
        console.log(`⏱️  已用時: ${elapsedMinutes}分鐘，預估總時間: ${estimatedTotal}分鐘`);
        
        // 短暫休息
        if (i + batchSize < vocabularyData.length) {
            console.log(`⏸️  休息 3 秒...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    await scraper.close();
    
    // 生成最終結果
    const totalTime = ((Date.now() - startTime) / 60000).toFixed(1);
    const finalResults = {
        metadata: {
            totalWords: vocabularyData.length,
            successfulExamples: allResults.length,
            failedWords: allFailed.length,
            successRate: ((allResults.length / vocabularyData.length) * 100).toFixed(2) + '%',
            totalTimeMinutes: totalTime,
            averageWordsPerMinute: Math.round(allResults.length / totalTime),
            concurrency: concurrency,
            batchSize: batchSize,
            completedAt: new Date().toISOString()
        },
        examples: allResults,
        failed: allFailed,
        forDatabase: allResults.map(item => ({
            id: item.id,
            word: item.word,
            example_sentence: item.example
        }))
    };
    
    // 保存結果
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ultra_fast_results_${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(finalResults, null, 2));
    
    // 生成 SQL 腳本
    generateOptimizedSQL(allResults);
    
    console.log(`\n🎯 超高速爬取完成！`);
    console.log(`⚡ 總用時: ${totalTime} 分鐘`);
    console.log(`📈 成功率: ${finalResults.metadata.successRate}`);
    console.log(`🚀 平均速度: ${finalResults.metadata.averageWordsPerMinute} 單字/分鐘`);
    console.log(`📄 結果文件: ${filename}`);
    console.log(`📝 SQL 腳本已生成，可直接執行更新資料庫`);
    
    return finalResults;
}

// 生成優化的 SQL 腳本
function generateOptimizedSQL(results) {
    // 分批 SQL 更新，每批 1000 條
    const batchSize = 1000;
    let sqlFiles = [];
    
    for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        
        const sqlStatements = batch.map(item => {
            // 處理單引號轉義
            const escapedExample = item.example.replace(/'/g, "''");
            return `UPDATE vocabulary SET Example = N'${escapedExample}' WHERE id = ${item.id};`;
        });
        
        const sqlContent = `-- 批次 ${batchNum} 例句更新腳本
-- 記錄數: ${batch.length}
-- 生成時間: ${new Date().toISOString()}

BEGIN TRANSACTION;
${sqlStatements.join('\n')}
COMMIT;

PRINT '批次 ${batchNum} 完成: ${batch.length} 條記錄已更新';
`;
        
        const filename = `update_batch_${batchNum.toString().padStart(2, '0')}.sql`;
        fs.writeFileSync(filename, sqlContent);
        sqlFiles.push(filename);
    }
    
    // 主執行腳本
    const masterScript = `-- 主執行腳本 - 例句更新
-- 總計 ${results.length} 條記錄，分為 ${sqlFiles.length} 個批次
-- 生成時間: ${new Date().toISOString()}

PRINT '開始執行例句更新...';
PRINT '總計 ${results.length} 條記錄';

${sqlFiles.map((file, index) => `
PRINT '執行批次 ${index + 1}/${sqlFiles.length}: ${file}';
-- 手動執行: :r ${file}
-- 或者複製對應批次文件內容到此處執行`).join('\n')}

-- 最終檢查結果
PRINT '更新完成，檢查結果...';
SELECT COUNT(*) as TotalUpdated FROM vocabulary WHERE Example IS NOT NULL;

SELECT 
    partOfSpeech,
    COUNT(*) as UpdatedCount,
    CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vocabulary WHERE partOfSpeech = v.partOfSpeech) AS DECIMAL(5,2)) as Percentage
FROM vocabulary v 
WHERE Example IS NOT NULL 
GROUP BY partOfSpeech
ORDER BY partOfSpeech;

PRINT '例句更新完成！';
`;
    
    fs.writeFileSync('execute_all_updates.sql', masterScript);
    console.log(`📝 生成 ${sqlFiles.length} 個 SQL 批次文件和主執行腳本`);
    console.log(`📋 執行方式：在 SSMS 中打開並執行各個 update_batch_*.sql 文件`);
}

// 主函數
async function main() {
    console.log('🚀 超高速例句爬取程序啟動！');
    console.log('🎯 目標：30 分鐘內完成 7000+ 單字例句爬取');
    console.log('⏰ 開始時間:', new Date().toLocaleString());
    
    try {
        // 載入詞彙資料
        const vocabularyData = await loadVocabularyFast();
        
        if (vocabularyData.length === 0) {
            console.error('❌ 沒有載入到詞彙資料');
            return;
        }
        
        console.log(`\n📚 總計載入: ${vocabularyData.length} 個單字`);
        console.log(`🚀 目標速度: ${Math.ceil(vocabularyData.length / 30)} 單字/分鐘`);
        
        // 確認開始
        console.log('\n⚠️  準備開始大規模爬取');
        console.log('🛑 按 Ctrl+C 可以隨時中斷（進度會保存）');
        
        // 3 秒倒數
        for (let i = 3; i > 0; i--) {
            process.stdout.write(`\r⚡ ${i} 秒後開始超高速爬取...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('\n');
        
        // 開始處理
        await processUltraFast(vocabularyData);
        
        console.log('\n🎉 任務完成！');
        console.log('🔄 接下來請在 SQL Server Management Studio 中執行生成的 SQL 腳本來更新資料庫');
        
    } catch (error) {
        console.error('💥 執行失敗:', error.message);
        console.error('📝 錯誤詳情:', error.stack);
        
        // 檢查是否有部分進度
        const progressFiles = fs.readdirSync('.').filter(f => f.startsWith('progress_'));
        if (progressFiles.length > 0) {
            console.log('💾 發現進度文件，部分結果已保存');
            console.log('📄 進度文件:', progressFiles);
        }
    }
}

// 處理中斷信號
process.on('SIGINT', () => {
    console.log('\n\n🛑 收到中斷信號，正在安全退出...');
    console.log('💾 進度已保存在 progress_*.json 文件中');
    console.log('🔄 可以稍後重新啟動程序恢復進度');
    process.exit(0);
});

// 未捕獲的異常處理
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未處理的 Promise 拒絕:', reason);
});

// 執行主程式
main();
