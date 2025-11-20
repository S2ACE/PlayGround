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

export async function getAllVocabulary(lang: string): Promise<Vocabulary[]> {
    const res = await fetch(`/api/v1/vocab/${lang}`);
    if (!res.ok){
        throw new Error("API error");
    }
    return await res.json();
}

export function filterWordsByLevelAndLetter( words: Vocabulary[], level: string, letter: string ): Vocabulary[] {
    return words.filter( 
        (word) =>
            word.level === level &&
            word.word.charAt(0).toLowerCase() === letter.toLowerCase()
    );
}

export function getLettersForLevel(words: Vocabulary[], level: string): string[] {
    const letters = new Set<string>();
    words
        .filter((word) => word.level === level)
        .forEach((word) => {
            letters.add(word.word.charAt(0).toUpperCase());
    });
    return Array.from(letters).sort();
}


export function getAllLevels(words: Vocabulary[]): string[] {
    const levels = new Set<string>();
    words.forEach((word) => levels.add(word.level));
    return Array.from(levels).sort();
}