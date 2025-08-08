export type Vocabulary = {
    id: number;
    word: string;
    partOfSpeech: string;
    definition: string;
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