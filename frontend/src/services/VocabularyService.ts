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
    /* Fetch all vocabulary records for a given language. */
    async getAllVocabulary(lang: string): Promise<Vocabulary[]> {
        const res = await fetch(`${API_ENDPOINTS.VOCABULARY}/${lang}`);
        if (!res.ok) {
            throw new Error('API error');
        }
        return await res.json();
    }

    /* Filter vocabulary by level and starting letter. */
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

    /* Get all distinct first letters for a specific level. */
    getLettersForLevel(words: Vocabulary[], level: string): string[] {
        const letters = new Set<string>();
        words
            .filter((word) => word.level === level)
            .forEach((word) => {
                letters.add(word.word.charAt(0).toUpperCase());
            });
        return Array.from(letters).sort();
    }

    /* Get all distinct levels from the vocabulary list. */
    getAllLevels(words: Vocabulary[]): string[] {
        const levels = new Set<string>();
        words.forEach((word) => levels.add(word.level));
        return Array.from(levels).sort();
    }
}

export const vocabularyService = new VocabularyService();