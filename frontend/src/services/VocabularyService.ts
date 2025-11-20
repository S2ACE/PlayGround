// services/VocabularyService.ts
import { API_ENDPOINTS } from '../config/api';

export type Vocabulary = {
    id: number;
    word: string;
    partOfSpeech: string;
    chineseDefinition: string;
    englishDefinition: string;
    example: string;
    level: string;
    language: string;
}

export class VocabularyService {
    
    /**
     * 取得所有單字
     */
    async getAllVocabulary(lang: string): Promise<Vocabulary[]> {
        const res = await fetch(`${API_ENDPOINTS.VOCABULARY}/${lang}`);
        if (!res.ok) {
            throw new Error("API error");
        }
        return await res.json();
    }

    /**
     * 依等級和字母過濾單字
     */
    filterWordsByLevelAndLetter(
        words: Vocabulary[], 
        level: string, 
        letter: string
    ): Vocabulary[] {
        return words.filter(
            (word) =>
                word.level === level &&
                word.word.charAt(0).toLowerCase() === letter.toLowerCase()
        );
    }

    /**
     * 取得特定等級的所有開頭字母
     */
    getLettersForLevel(words: Vocabulary[], level: string): string[] {
        const letters = new Set<string>();
        words
            .filter((word) => word.level === level)
            .forEach((word) => {
                letters.add(word.word.charAt(0).toUpperCase());
            });
        return Array.from(letters).sort();
    }

    /**
     * 取得所有等級
     */
    getAllLevels(words: Vocabulary[]): string[] {
        const levels = new Set<string>();
        words.forEach((word) => levels.add(word.level));
        return Array.from(levels).sort();
    }
}

// 導出單例實例
export const vocabularyService = new VocabularyService();
