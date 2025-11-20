import type { Vocabulary } from "./services/VocabularyService"

export function getRandomWord(list: Vocabulary[]): string {
    if (list.length === 0){
        return "null";
    }
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex].word;
}

export const speakKanaWebBrowser = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    console.log(voices);
    // 優先找 Google/高品質的日文 voice
    const jpVoice = voices.find(
        v => v.lang === 'ja-JP' && v.name.toLowerCase().includes('google')
    ) || voices.find(v => v.lang === 'ja-JP');
    if (jpVoice) utterance.voice = jpVoice;
    utterance.lang = 'ja-JP';
    window.speechSynthesis.speak(utterance);
};

export const speakKana = async (text: string) => {
  const apiKey = 'AIzaSyCLFSOmYM-bZo1DzvaGI94qjlt4YMR9fvI';
  const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const requestBody = {
    input: { text },
    voice: {
      languageCode: 'ja-JP',
      name: 'ja-JP-Standard-B',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: 1.0,
      speakingRate: 0.9,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (data.audioContent) {
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.play();
    } else {
      console.error('語音生成失敗：', data);
    }
  } catch (error) {
    console.error('API 請求錯誤：', error);
  }
};