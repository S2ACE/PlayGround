import type { Vocabulary } from "./api/vocabulary"

export function getRandomWord(list: Vocabulary[]): string {
    if (list.length === 0){
        return "null";
    }
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex].word;
}