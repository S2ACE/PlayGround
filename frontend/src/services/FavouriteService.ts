import { auth } from '../firebase/config';
import { API_ENDPOINTS } from '../config/api';


const LOCALSTORAGE_KEY = 'favouriteVocab';

export interface FavouriteVocabularyResponse {
    vocabularyIds: number[];
    totalCount: number;
}

export interface BulkFavouritesResponse {
    successCount: number;
    skippedCount: number;
    errors: string[];
    message: string;
}

export class FavouriteService {
    private pendingOperations: Map<number, NodeJS.Timeout> = new Map();
    private readonly DEBOUNCE_DELAY = 500;

    private static isUserLoggedIn(): boolean {
        return !!auth.currentUser;
    }

    // ==================== 樂觀更新 + Debounce ====================
    async toggleFavourite(vocabularyId: number, currentIsFavourite: boolean): Promise<boolean> {
        const newIsFavourite = !currentIsFavourite;

        if (FavouriteService.isUserLoggedIn()) {
            if (this.pendingOperations.has(vocabularyId)) {
                clearTimeout(this.pendingOperations.get(vocabularyId)!);
            }

            const timeoutId = setTimeout(async () => {
                try {
                    if (newIsFavourite) {
                        await this.addFavouriteToDatabase(vocabularyId);
                    } else {
                        await this.removeFavouriteFromDatabase(vocabularyId);
                    }
                    this.pendingOperations.delete(vocabularyId);
                } catch (error) {
                    console.error('❌ API 請求失敗:', error);
                }
            }, this.DEBOUNCE_DELAY);

            this.pendingOperations.set(vocabularyId, timeoutId);
        } else {
            if (newIsFavourite) {
                this.addFavouriteToLocalStorage(vocabularyId);
            } else {
                this.removeFavouriteFromLocalStorage(vocabularyId);
            }
        }

        return newIsFavourite;
    }

    // ==================== 取得收藏 ID 列表 ====================
    async getFavouriteIds(): Promise<number[]> {
        if (FavouriteService.isUserLoggedIn()) {
            return await this.getFavouriteIdsFromDatabase();
        } else {
            return this.getFavouriteIdsFromLocalStorage();
        }
    }

    private async getFavouriteIdsFromDatabase(): Promise<number[]> {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('用戶未登入');

            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('取得收藏列表失敗');

            const data: FavouriteVocabularyResponse = await response.json();
            return data.vocabularyIds || [];
        } catch (error) {
            console.error('❌ 從資料庫取得失敗:', error);
            return [];
        }
    }

    private async addFavouriteToDatabase(vocabularyId: number): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('用戶未登入');

        const idToken = await user.getIdToken();
        const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ vocabularyId })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '新增收藏失敗');
        }
    }

    private async removeFavouriteFromDatabase(vocabularyId: number): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('用戶未登入');

        const idToken = await user.getIdToken();
        const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}/${vocabularyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '移除收藏失敗');
        }
    }

    // ==================== localStorage 操作 (支援 string[] 格式) ====================
    private getFavouriteIdsFromLocalStorage(): number[] {
        try {
            const data = localStorage.getItem(LOCALSTORAGE_KEY);
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            // ✅ 支援您現有的 string[] 格式,轉換為 number[]
            return Array.isArray(parsed) ? parsed.map(id => Number(id)) : [];
        } catch {
            return [];
        }
    }

    private addFavouriteToLocalStorage(vocabularyId: number): void {
        const favouriteIds = this.getFavouriteIdsFromLocalStorage();
        if (!favouriteIds.includes(vocabularyId)) {
            favouriteIds.push(vocabularyId);
            // ✅ 保存為 string[] 格式,與您現有的一致
            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(favouriteIds.map(String)));
        }
    }

    private removeFavouriteFromLocalStorage(vocabularyId: number): void {
        const favouriteIds = this.getFavouriteIdsFromLocalStorage();
        const updated = favouriteIds.filter(id => id !== vocabularyId);
        // ✅ 保存為 string[] 格式
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated.map(String)));
    }
    //for future
    // ==================== 登入時同步 localStorage 到資料庫 ====================
    /*async syncLocalStorageToDatabase(): Promise<void> {
        const user = auth.currentUser;
        if (!user) return;

        const localFavouriteIds = this.getFavouriteIdsFromLocalStorage();
        console.log('🔄 ocalStorage 長度:', localFavouriteIds.length);
        if (localFavouriteIds.length === 0) return;
        console.log('🔄 ocalStorage 長度:', localFavouriteIds.length);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vocabularyIds: localFavouriteIds })
            });

            if (response.ok) {
                localStorage.removeItem(LOCALSTORAGE_KEY);
                console.log('✅ localStorage 已同步到資料庫');
            }
        } catch (error) {
            console.error('❌ 同步失敗:', error);
        }
    }*/
    //for future enhancement
    // ==================== 檢查是否為收藏 ====================
    /*async isFavourite(vocabularyId: number): Promise<boolean> {
        if (FavouriteService.isUserLoggedIn()) {
            try {
                const user = auth.currentUser;
                if (!user) return false;

                const idToken = await user.getIdToken();
                const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}/check/${vocabularyId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.isFavourite;
                }
                return false;
            } catch {
                return false;
            }
        } else {
            const favouriteIds = this.getFavouriteIdsFromLocalStorage();
            return favouriteIds.includes(vocabularyId);
        }
    }*/

    // ==================== 清理 ====================
    cleanup(): void {
        this.pendingOperations.forEach(timeout => clearTimeout(timeout));
        this.pendingOperations.clear();
    }
}

export const favouriteService = new FavouriteService();
