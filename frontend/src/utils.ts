import type { Vocabulary } from './services/VocabularyService';

export function getRandomWord(list: Vocabulary[]): string {
    if (list.length === 0) {
        return 'null';
    }
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex].word;
}

/* Detect if the current browser is Edge (Chromium-based). */
const isEdgeBrowser = (): boolean => {
    const ua = window.navigator.userAgent;
    return ua.includes('Edg/');
};

/* Shared: load and cache voices to avoid first-call / later-call differences. */
let cachedVoices: SpeechSynthesisVoice[] | null = null;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();
        if (voices.length > 0) {
            cachedVoices = voices;
            resolve(voices);
            return;
        }
        const handle = () => {
            const vs = synth.getVoices();
            cachedVoices = vs;
            synth.removeEventListener('voiceschanged', handle);
            resolve(vs);
        };
        synth.addEventListener('voiceschanged', handle);
    });
};

/* English: use browser built‑in Web Speech API (female voice preferred). */
const speakEnglishWebBrowser = async (text: string, accent: 'en-US' | 'en-GB') => {
    if (!('speechSynthesis' in window)) {
        console.warn('This browser does not support the Web Speech API');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;

    const voices = cachedVoices ?? (await loadVoices());

    // Adjust to the actual voice names available in your environment
    const preferredName =
        accent === 'en-GB'
            ? 'Microsoft Sonia Online (Natural) - English (Great Britain)'
            : 'Microsoft Aria Online (Natural) - English (United States)';

    const preferredVoice =
        voices.find((v) => v.name === preferredName) || // 1. Explicit preferred female voice
        voices.find(
            (v) =>
                v.lang === accent &&
                v.name.toLowerCase().includes('female'),
        ) || // 2. Same locale, name contains "female"
        voices.find((v) => v.lang === accent) || // 3. Any voice with exact locale
        voices.find((v) => v.lang.startsWith(accent.split('-')[0])) || // 4. Any voice with same language (en-*)
        voices.find((v) => v.lang.startsWith('en')); // 5. Any English voice

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
};

/* English: Google Cloud TTS (female voice). */
const speakEnglishTTS = async (text: string, accent: 'en-US' | 'en-GB') => {
    const apiKey = import.meta.env.VITE_TTS_API_KEY;
    const endpoint = import.meta.env.VITE_TTS_ENDPOINT;

    if (!apiKey || !endpoint) {
        console.error('TTS API configuration missing. Please check environment variables.');
        return;
    }

    // Google TTS female voices
    const voiceName = accent === 'en-GB' ? 'en-GB-Standard-A' : 'en-US-Standard-C';

    const requestBody = {
        input: { text },
        voice: {
            languageCode: accent,
            name: voiceName,
        },
        audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0.0,
            speakingRate: 1.0,
        },
    };

    try {
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.audioContent) {
            const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
            audio.play();
        } else {
            console.error('Failed to generate English speech:', data);
        }
    } catch (error) {
        console.error('English TTS API request error:', error);
    }
};

/* Public helper: smart English TTS selection (prefer female voice). */
export const speakEnglishSmart = async (text: string, accent: 'en-US' | 'en-GB') => {
    try {
        if (isEdgeBrowser()) {
            await speakEnglishTTS(text, accent);
        } else if ('speechSynthesis' in window) {
            await speakEnglishWebBrowser(text, accent);
        } else {
            await speakEnglishTTS(text, accent);
        }
    } catch (e) {
        console.error('English speech error, trying fallback:', e);
        if ('speechSynthesis' in window) {
            await speakEnglishWebBrowser(text, accent);
        }
    }
};

/* Japanese: use browser built‑in Web Speech API (female voice preferred). */
export const speakKanaWebBrowser = async (text: string) => {
    if (!('speechSynthesis' in window)) {
        console.warn('This browser does not support the Web Speech API, falling back.');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = cachedVoices ?? (await loadVoices());
    console.log(voices);

    // Adjust to your preferred Japanese female voice
    const preferredName = 'Microsoft Ayumi Online (Natural) - Japanese (Japan)';

    const jpVoice =
        voices.find((v) => v.name === preferredName) || // 1. Explicit preferred female JP voice
        voices.find(
            (v) =>
                v.lang === 'ja-JP' &&
                (v.name.toLowerCase().includes('female') ||
                    v.name.toLowerCase().includes('girl') ||
                    v.name.toLowerCase().includes('ayumi')),
        ) || // 2. JP voice whose name looks like a female voice
        voices.find((v) => v.lang === 'ja-JP' && v.name.toLowerCase().includes('google')) || // 3. Google Japanese voice
        voices.find((v) => v.lang === 'ja-JP'); // 4. Any Japanese voice

    if (jpVoice) {
        utterance.voice = jpVoice;
    }
    utterance.lang = 'ja-JP';

    window.speechSynthesis.speak(utterance);
};

/* Japanese: Google Cloud TTS (female voice). */
export const speakKana = async (text: string) => {
    const apiKey = import.meta.env.VITE_TTS_API_KEY;
    const endpoint = import.meta.env.VITE_TTS_ENDPOINT;

    if (!apiKey || !endpoint) {
        console.error('TTS API configuration missing. Please check environment variables.');
        return;
    }

    const requestBody = {
        input: { text },
        voice: {
            languageCode: 'ja-JP',
            // Google TTS Japanese female voice (adjust if necessary)
            name: 'ja-JP-Standard-B',
        },
        audioConfig: {
            audioEncoding: 'MP3',
            pitch: 1.0,
            speakingRate: 0.9,
        },
    };

    try {
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.audioContent) {
            const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
            audio.play();
        } else {
            console.error('Failed to generate Japanese speech:', data);
        }
    } catch (error) {
        console.error('Japanese TTS API request error:', error);
    }
};

/* Smart Japanese speech: Edge uses Google TTS; others prefer Web Speech API first. */
export const speakKanaSmart = async (text: string) => {
    try {
        if (isEdgeBrowser()) {
            await speakKana(text);
        } else if ('speechSynthesis' in window) {
            await speakKanaWebBrowser(text);
        } else {
            await speakKana(text);
        }
    } catch (e) {
        console.error('Japanese speech error, trying fallback:', e);
        if ('speechSynthesis' in window) {
            await speakKanaWebBrowser(text);
        }
    }
};