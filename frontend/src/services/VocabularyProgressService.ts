import { auth } from '../firebase/config';
import { API_ENDPOINTS } from '../config/api';

const LOCALSTORAGE_KEY = 'vocabularyProgress';

// ==================== Types ====================

export type ProficiencyLevel = 'mastered' | 'somewhat_familiar' | 'not_familiar';

export interface VocabularyProgressData {
    vocabularyId: number;
    masteredCount: number;
    lastTestDate: string;
    currentProficiency?: ProficiencyLevel;
}

export interface VocabularyProgressListResponse {
    progress: VocabularyProgressData[];
    totalCount: number;
}

export interface BatchUpdateResponse {
    updatedCount: number;
    newCount: number;
    failedCount: number;
    errors: string[];
    message: string;
}

// ==================== Helper Functions ====================

/**
 * 根據 masteredCount 計算熟練度
 */
export function getCurrentProficiency(masteredCount: number): ProficiencyLevel {
    if (masteredCount >= 3) return 'mastered';
    if (masteredCount >= 1) return 'somewhat_familiar';
    return 'not_familiar';
}

/**
 * 根據答案計算增量
 */
export function getProficiencyIncrement(proficiency: ProficiencyLevel): number {
    switch (proficiency) {
        case 'mastered': return 1;
        case 'somewhat_familiar': return 1;
        case 'not_familiar': return 0;
        default: return 0;
    }
}

/**
 * 取得熟練度的顯示文字
 */
export function getProficiencyLabel(proficiency: ProficiencyLevel): string {
    switch (proficiency) {
        case 'mastered': return '已熟記';
        case 'somewhat_familiar': return '有點熟';
        case 'not_familiar': return '不熟悉';
    }
}

/**
 * 取得熟練度的顏色
 */
export function getProficiencyColor(proficiency: ProficiencyLevel): 'success' | 'warning' | 'error' {
    switch (proficiency) {
        case 'mastered': return 'success';
        case 'somewhat_familiar': return 'warning';
        case 'not_familiar': return 'error';
    }
}

// ==================== Service Class ====================

/**
 * 單字學習進度服務
 * - 未登入: 使用 localStorage
 * - 已登入: 使用 Database
 */
export class VocabularyProgressService {
    /**
     * 取得進度 (自動判斷來源)
     */
    async getProgress(): Promise<VocabularyProgressData[]> {
        const user = auth.currentUser;
        
        if (user) {
            return await this.getProgressFromDatabase();
        } else {
            return this.getProgressFromLocalStorage();
        }
    }

    /**
     * 更新進度 (自動判斷目標)
     */
    async updateProgress(progress: VocabularyProgressData): Promise<void> {
        const user = auth.currentUser;
        
        if (user) {
            await this.updateProgressToDatabase(progress);
        } else {
            this.updateProgressToLocalStorage(progress);
        }
    }

    /**
     * 取得單個單字進度
     */
    async getVocabularyProgress(vocabularyId: number): Promise<VocabularyProgressData | null> {
        const allProgress = await this.getProgress();
        return allProgress.find(p => p.vocabularyId === vocabularyId) || null;
    }

    /**
     * 取得單字的熟練度
     */
    async getWordProficiency(vocabularyId: number): Promise<ProficiencyLevel> {
        const progress = await this.getVocabularyProgress(vocabularyId);
        return progress ? getCurrentProficiency(progress.masteredCount) : 'not_familiar';
    }

    // ==================== Database 操作 (會員模式) ====================

    private async getProgressFromDatabase(): Promise<VocabularyProgressData[]> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('用戶未登入');

            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.PROGRESS}/${user.uid}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: VocabularyProgressListResponse = await response.json();
            console.log('✅ 從 Database 載入進度:', data.totalCount, '個');
            return data.progress || [];
        } catch (error) {
            console.error('❌ Database 讀取失敗:', error);
            return [];
        }
    }

    private async updateProgressToDatabase(progress: VocabularyProgressData): Promise<void> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('用戶未登入');

            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.PROGRESS}/${user.uid}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(progress)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Database 已更新:', progress.vocabularyId);
        } catch (error) {
            console.error('❌ Database 更新失敗:', error);
            // 降級:失敗時寫入 localStorage
            this.updateProgressToLocalStorage(progress);
        }
    }

    // ==================== localStorage 操作 (訪客模式) ====================

    private getProgressFromLocalStorage(): VocabularyProgressData[] {
        try {
            const data = localStorage.getItem(LOCALSTORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                console.log('✅ 從 localStorage 載入進度:', parsed.length, '個');
                return parsed;
            }
            return [];
        } catch (error) {
            console.error('❌ localStorage 讀取失敗:', error);
            return [];
        }
    }

    private updateProgressToLocalStorage(progress: VocabularyProgressData): void {
        try {
            const allProgress = this.getProgressFromLocalStorage();
            const index = allProgress.findIndex(p => p.vocabularyId === progress.vocabularyId);

            // ✅ 計算 currentProficiency
            const progressWithProficiency: VocabularyProgressData = {
                ...progress,
                currentProficiency: getCurrentProficiency(progress.masteredCount)
            };

            if (index >= 0) {
                allProgress[index] = progressWithProficiency;
            } else {
                allProgress.push(progressWithProficiency);
            }

            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(allProgress));
            console.log('✅ localStorage 已保存:', progress.vocabularyId);
        } catch (error) {
            console.error('❌ localStorage 寫入失敗:', error);
        }
    }

    // ==================== 批量操作 ====================

    /**
     * 批量更新進度
     */
    /* for future enhancement */
    /*
    async batchUpdateProgress(progressList: VocabularyProgressData[]): Promise<BatchUpdateResponse | null> {
        const user = auth.currentUser;
        
        if (user) {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_ENDPOINTS.PROGRESS}/${user.uid}/batch`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ progressList })
                });

                if (response.ok) {
                    const result: BatchUpdateResponse = await response.json();
                    console.log('✅ 批量更新完成:', result.message);
                    return result;
                }
            } catch (error) {
                console.error('❌ 批量更新失敗:', error);
            }
        } else {
            // 未登入:逐個寫入 localStorage
            progressList.forEach(progress => this.updateProgressToLocalStorage(progress));
        }
        
        return null;
    }*/

    // ==================== 清除資料 ====================

    /**
     * 清除訪客進度
     */
    clearGuestProgress(): void {
        localStorage.removeItem(LOCALSTORAGE_KEY);
        console.log('✅ 訪客進度已清除');
    }

    /* for future enhancement */
    /**
     * 清除會員進度
     */
    /*
    async clearMemberProgress(): Promise<void> {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const idToken = await user.getIdToken();
            await fetch(`${API_ENDPOINTS.PROGRESS}/${user.uid}/all`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ 會員進度已清除');
        } catch (error) {
            console.error('❌ 清除會員進度失敗:', error);
        }
    }
    */
    // ==================== 統計資料 ====================

    /**
     * 取得進度統計
     */
    async getProgressStats(): Promise<{
        total: number;
        mastered: number;
        somewhatFamiliar: number;
        notFamiliar: number;
    }> {
        const allProgress = await this.getProgress();
        
        const stats = {
            total: allProgress.length,
            mastered: 0,
            somewhatFamiliar: 0,
            notFamiliar: 0
        };

        allProgress.forEach(progress => {
            const proficiency = getCurrentProficiency(progress.masteredCount);
            switch (proficiency) {
                case 'mastered':
                    stats.mastered++;
                    break;
                case 'somewhat_familiar':
                    stats.somewhatFamiliar++;
                    break;
                case 'not_familiar':
                    stats.notFamiliar++;
                    break;
            }
        });

        return stats;
    }
}

export const vocabularyProgressService = new VocabularyProgressService();