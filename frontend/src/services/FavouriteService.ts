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
    // Debounced operations for each vocabulary id (to avoid spamming API)
    private pendingOperations: Map<number, NodeJS.Timeout> = new Map();
    private readonly DEBOUNCE_DELAY = 500;

    private static isUserLoggedIn(): boolean {
        return !!auth.currentUser;
    }

    // ==================== Optimistic update + debounce ====================
    async toggleFavourite(vocabularyId: number, currentIsFavourite: boolean): Promise<boolean> {
        const newIsFavourite = !currentIsFavourite;

        if (FavouriteService.isUserLoggedIn()) {
            // Clear any previous pending operation for this vocabulary
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
                    console.error('❌ Favourite API request failed:', error);
                }
            }, this.DEBOUNCE_DELAY);

            this.pendingOperations.set(vocabularyId, timeoutId);
        } else {
            // Guest mode: store favourites in localStorage only
            if (newIsFavourite) {
                this.addFavouriteToLocalStorage(vocabularyId);
            } else {
                this.removeFavouriteFromLocalStorage(vocabularyId);
            }
        }

        // Return the new favourite state for optimistic UI update
        return newIsFavourite;
    }

    // ==================== Get favourite id list ====================
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
            if (!user) throw new Error('User not signed in');

            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to load favourites');

            const data: FavouriteVocabularyResponse = await response.json();
            return data.vocabularyIds || [];
        } catch (error) {
            console.error('❌ Failed to load favourites from database:', error);
            return [];
        }
    }

    private async addFavouriteToDatabase(vocabularyId: number): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('User not signed in');

        const idToken = await user.getIdToken();
        const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vocabularyId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to add favourite');
        }
    }

    private async removeFavouriteFromDatabase(vocabularyId: number): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('User not signed in');

        const idToken = await user.getIdToken();
        const response = await fetch(
            `${API_ENDPOINTS.FAVOURITES}/${user.uid}/${vocabularyId}`,
            {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to remove favourite');
        }
    }

    // ==================== localStorage operations (supports legacy string[] format) ====================
    private getFavouriteIdsFromLocalStorage(): number[] {
        try {
            const data = localStorage.getItem(LOCALSTORAGE_KEY);
            if (!data) return [];

            const parsed = JSON.parse(data);
            // Support existing string[] format and convert to number[]
            return Array.isArray(parsed) ? parsed.map((id) => Number(id)) : [];
        } catch {
            return [];
        }
    }

    private addFavouriteToLocalStorage(vocabularyId: number): void {
        const favouriteIds = this.getFavouriteIdsFromLocalStorage();
        if (!favouriteIds.includes(vocabularyId)) {
            favouriteIds.push(vocabularyId);
            // Save as string[] for backward compatibility
            localStorage.setItem(
                LOCALSTORAGE_KEY,
                JSON.stringify(favouriteIds.map(String)),
            );
        }
    }

    private removeFavouriteFromLocalStorage(vocabularyId: number): void {
        const favouriteIds = this.getFavouriteIdsFromLocalStorage();
        const updated = favouriteIds.filter((id) => id !== vocabularyId);
        // Save as string[]
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated.map(String)));
    }

    /*
    // ==================== Sync localStorage to DB on login (for future use) ====================
    async syncLocalStorageToDatabase(): Promise<void> {
        const user = auth.currentUser;
        if (!user) return;

        const localFavouriteIds = this.getFavouriteIdsFromLocalStorage();
        console.log('🔄 localStorage favourite count:', localFavouriteIds.length);
        if (localFavouriteIds.length === 0) return;

        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_ENDPOINTS.FAVOURITES}/${user.uid}/sync`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ vocabularyIds: localFavouriteIds }),
            });

            if (response.ok) {
                localStorage.removeItem(LOCALSTORAGE_KEY);
                console.log('✅ localStorage favourites synced to database');
            }
        } catch (error) {
            console.error('❌ Failed to sync favourites:', error);
        }
    }
    */

    /*
    // ==================== Check if a single vocabulary is favourite (for future enhancement) ====================
    async isFavourite(vocabularyId: number): Promise<boolean> {
        if (FavouriteService.isUserLoggedIn()) {
            try {
                const user = auth.currentUser;
                if (!user) return false;

                const idToken = await user.getIdToken();
                const response = await fetch(
                    `${API_ENDPOINTS.FAVOURITES}/${user.uid}/check/${vocabularyId}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

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
    }
    */

    // ==================== Cleanup ====================
    cleanup(): void {
        this.pendingOperations.forEach((timeout) => clearTimeout(timeout));
        this.pendingOperations.clear();
    }
}

export const favouriteService = new FavouriteService();