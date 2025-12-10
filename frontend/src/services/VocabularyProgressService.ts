import { auth } from '../firebase/config';
import { API_ENDPOINTS } from '../config/api';

const LOCALSTORAGE_KEY = 'vocabularyProgress';

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

/* Derive current proficiency level from masteredCount. */
export function getCurrentProficiency(masteredCount: number): ProficiencyLevel {
    if (masteredCount >= 3) return 'mastered';
    if (masteredCount >= 1) return 'somewhat_familiar';
    return 'not_familiar';
}

/* Get increment value for masteredCount based on answer. */
export function getProficiencyIncrement(proficiency: ProficiencyLevel): number {
    switch (proficiency) {
        case 'mastered':
            return 1;
        case 'somewhat_familiar':
            return 1;
        case 'not_familiar':
            return 0;
        default:
            return 0;
    }
}

/* Get localized label for proficiency level. */
export function getProficiencyLabel(proficiency: ProficiencyLevel): string {
    switch (proficiency) {
        case 'mastered':
            return '已熟記';
        case 'somewhat_familiar':
            return '有點熟';
        case 'not_familiar':
            return '不熟悉';
    }
}

/* Get MUI color name for a given proficiency level. */
export function getProficiencyColor(
    proficiency: ProficiencyLevel,
): 'success' | 'warning' | 'error' {
    switch (proficiency) {
        case 'mastered':
            return 'success';
        case 'somewhat_familiar':
            return 'warning';
        case 'not_familiar':
            return 'error';
    }
}

// ==================== Service Class ====================

/**
 * Vocabulary learning progress service
 * - Guest (not logged in): store in localStorage
 * - Member (logged in): store in backend database
 */
export class VocabularyProgressService {
    /* Get all progress entries (auto-detects source). */
    async getProgress(): Promise<VocabularyProgressData[]> {
        const user = auth.currentUser;

        if (user) {
            return await this.getProgressFromDatabase();
        } else {
            return this.getProgressFromLocalStorage();
        }
    }

    /* Update a single progress record (auto-selects target). */
    async updateProgress(progress: VocabularyProgressData): Promise<void> {
        const user = auth.currentUser;

        if (user) {
            await this.updateProgressToDatabase(progress);
        } else {
            this.updateProgressToLocalStorage(progress);
        }
    }

    /* Get progress for a single vocabulary item. */
    async getVocabularyProgress(vocabularyId: number): Promise<VocabularyProgressData | null> {
        const allProgress = await this.getProgress();
        return allProgress.find((p) => p.vocabularyId === vocabularyId) || null;
    }

    /* Get current proficiency for a single vocabulary item. */
    async getWordProficiency(vocabularyId: number): Promise<ProficiencyLevel> {
        const progress = await this.getVocabularyProgress(vocabularyId);
        return progress ? getCurrentProficiency(progress.masteredCount) : 'not_familiar';
    }

    // ==================== Database operations (member mode) ====================

    private async getProgressFromDatabase(): Promise<VocabularyProgressData[]> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not signed in');

            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.PROGRESS}/${user.uid}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: VocabularyProgressListResponse = await response.json();
            console.log('✅ Loaded progress from database:', data.totalCount, 'items');
            return data.progress || [];
        } catch (error) {
            console.error('❌ Failed to load progress from database:', error);
            return [];
        }
    }

    private async updateProgressToDatabase(progress: VocabularyProgressData): Promise<void> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not signed in');

            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.PROGRESS}/${user.uid}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(progress),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Database progress updated:', progress.vocabularyId);
        } catch (error) {
            console.error('❌ Failed to update database progress:', error);
            // Fallback: save to localStorage when DB write fails
            this.updateProgressToLocalStorage(progress);
        }
    }

    // ==================== localStorage operations (guest mode) ====================

    private getProgressFromLocalStorage(): VocabularyProgressData[] {
        try {
            const data = localStorage.getItem(LOCALSTORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                console.log('✅ Loaded progress from localStorage:', parsed.length, 'items');
                return parsed;
            }
            return [];
        } catch (error) {
            console.error('❌ Failed to read localStorage progress:', error);
            return [];
        }
    }

    private updateProgressToLocalStorage(progress: VocabularyProgressData): void {
        try {
            const allProgress = this.getProgressFromLocalStorage();
            const index = allProgress.findIndex((p) => p.vocabularyId === progress.vocabularyId);

            // Always compute currentProficiency when storing locally
            const progressWithProficiency: VocabularyProgressData = {
                ...progress,
                currentProficiency: getCurrentProficiency(progress.masteredCount),
            };

            if (index >= 0) {
                allProgress[index] = progressWithProficiency;
            } else {
                allProgress.push(progressWithProficiency);
            }

            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(allProgress));
            console.log('✅ Saved progress to localStorage:', progress.vocabularyId);
        } catch (error) {
            console.error('❌ Failed to write progress to localStorage:', error);
        }
    }

    // ==================== Batch operations ====================

    /* Batch update progress list (planned for future enhancement).
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
                    console.log('✅ Batch update completed:', result.message);
                    return result;
                }
            } catch (error) {
                console.error('❌ Batch update failed:', error);
            }
        } else {
            // Guest mode: write each entry to localStorage
            progressList.forEach(progress => this.updateProgressToLocalStorage(progress));
        }

        return null;
    }
    */

    // ==================== Clearing data ====================

    /**
     * Clear all guest progress stored in localStorage.
     */
    clearGuestProgress(): void {
        localStorage.removeItem(LOCALSTORAGE_KEY);
        console.log('✅ Guest progress cleared');
    }

    /* for future enhancement */
    /**
     * Clear all member progress stored in backend.
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
            console.log('✅ Member progress cleared');
        } catch (error) {
            console.error('❌ Failed to clear member progress:', error);
        }
    }
    */

    // ==================== Stats helpers ====================

    /**
     * Compute overall progress statistics for the current user/guest.
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
            notFamiliar: 0,
        };

        allProgress.forEach((progress) => {
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