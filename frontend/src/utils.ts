import type { Vocabulary } from "./services/VocabularyService";

export function getRandomWord(list: Vocabulary[]): string {
	if (list.length === 0) {
		return "null";
	}
	const randomIndex = Math.floor(Math.random() * list.length);
	return list[randomIndex].word;
}

// 檢測是否為 Edge（Chromium）
const isEdgeBrowser = (): boolean => {
	const ua = window.navigator.userAgent;
	return ua.includes("Edg/");
};

// ---- 共用：載入並快取 voices，避免第一次與之後不一致 ----
let cachedVoices: SpeechSynthesisVoice[] | null = null;

const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
	return new Promise(resolve => {
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
			synth.removeEventListener("voiceschanged", handle);
			resolve(vs);
		};
		synth.addEventListener("voiceschanged", handle);
	});
};

// ---- 英文：瀏覽器內建 Web Speech API（女聲優先） ----
const speakEnglishWebBrowser = async (text: string, accent: "en-US" | "en-GB") => {
	if (!("speechSynthesis" in window)) {
		console.warn("此瀏覽器不支援 Web Speech API");
		return;
	}

	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = accent;

	const voices = cachedVoices ?? (await loadVoices());

	// 依實際環境調整為你喜歡的女聲名稱
	const preferredName =
		accent === "en-GB"
			? "Microsoft Sonia Online (Natural) - English (Great Britain)"
			: "Microsoft Aria Online (Natural) - English (United States)";

	const preferredVoice =
		voices.find(v => v.name === preferredName) || // 1. 指定女聲
		voices.find(
			v =>
				v.lang === accent &&
				v.name.toLowerCase().includes("female")
		) || // 2. 名稱含 female
		voices.find(v => v.lang === accent) || // 3. 同語系任意 voice
		voices.find(v => v.lang.startsWith(accent.split("-")[0])) || // 4. en-* 任意
		voices.find(v => v.lang.startsWith("en")); // 5. 任何英文

	if (preferredVoice) {
		utterance.voice = preferredVoice;
	}

	window.speechSynthesis.speak(utterance);
};

// 英文：Google Cloud TTS（女聲）
const speakEnglishTTS = async (text: string, accent: "en-US" | "en-GB") => {
	const apiKey = import.meta.env.VITE_TTS_API_KEY;
	const endpoint = import.meta.env.VITE_TTS_ENDPOINT;

	if (!apiKey || !endpoint) {
		console.error("TTS API 設定缺失，請確認環境變數");
		return;
	}

	// Google TTS 的女聲（可按需求調整）
	const voiceName = accent === "en-GB" ? "en-GB-Standard-A" : "en-US-Standard-C";

	const requestBody = {
		input: { text },
		voice: {
			languageCode: accent,
			name: voiceName,
		},
		audioConfig: {
			audioEncoding: "MP3",
			pitch: 0.0,
			speakingRate: 1.0,
		},
	};

	try {
		const response = await fetch(`${endpoint}?key=${apiKey}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (data.audioContent) {
			const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
			audio.play();
		} else {
			console.error("英文語音生成失敗：", data);
		}
	} catch (error) {
		console.error("英文 TTS API 請求錯誤：", error);
	}
};

// 對外匯出：智慧選擇英文發音（女聲優先）
export const speakEnglishSmart = async (text: string, accent: "en-US" | "en-GB") => {
	try {
		if (isEdgeBrowser()) {
			await speakEnglishTTS(text, accent);
		} else if ("speechSynthesis" in window) {
			await speakEnglishWebBrowser(text, accent);
		} else {
			await speakEnglishTTS(text, accent);
		}
	} catch (e) {
		console.error("英文朗讀錯誤，嘗試後備方案：", e);
		if ("speechSynthesis" in window) {
			await speakEnglishWebBrowser(text, accent);
		}
	}
};

// ---- 日文：瀏覽器內建 Web Speech API（女聲優先） ----
export const speakKanaWebBrowser = async (text: string) => {
	if (!("speechSynthesis" in window)) {
		console.warn("此瀏覽器不支援 Web Speech API，將改用後備方案");
		return;
	}

	const utterance = new SpeechSynthesisUtterance(text);

	const voices = cachedVoices ?? (await loadVoices());
	console.log(voices);

	// 依實際環境調整為你喜歡的日文女聲名稱
	const preferredName = "Microsoft Ayumi Online (Natural) - Japanese (Japan)";

	const jpVoice =
		voices.find(v => v.name === preferredName) || // 1. 指定女聲
		voices.find(
			v =>
				v.lang === "ja-JP" &&
				(v.name.toLowerCase().includes("female") ||
					v.name.toLowerCase().includes("girl") ||
					v.name.toLowerCase().includes("ayumi"))
		) || // 2. 名稱看起來是女聲
		voices.find(v => v.lang === "ja-JP" && v.name.toLowerCase().includes("google")) || // 3. Google 日文
		voices.find(v => v.lang === "ja-JP"); // 4. 任意日文 voice

	if (jpVoice) {
		utterance.voice = jpVoice;
	}
	utterance.lang = "ja-JP";

	window.speechSynthesis.speak(utterance);
};

// 日文：Google Cloud TTS（女聲）
export const speakKana = async (text: string) => {
	const apiKey = import.meta.env.VITE_TTS_API_KEY;
	const endpoint = import.meta.env.VITE_TTS_ENDPOINT;

	if (!apiKey || !endpoint) {
		console.error("TTS API 設定缺失，請確認環境變數");
		return;
	}

	const requestBody = {
		input: { text },
		voice: {
			languageCode: "ja-JP",
			name: "ja-JP-Standard-B", // Google TTS 的日文女聲
		},
		audioConfig: {
			audioEncoding: "MP3",
			pitch: 1.0,
			speakingRate: 0.9,
		},
	};

	try {
		const response = await fetch(`${endpoint}?key=${apiKey}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (data.audioContent) {
			const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
			audio.play();
		} else {
			console.error("語音生成失敗：", data);
		}
	} catch (error) {
		console.error("API 請求錯誤：", error);
	}
};

// 智慧選擇：Edge 用 Google TTS，其它瀏覽器優先用內建朗讀（女聲優先）
export const speakKanaSmart = async (text: string) => {
	try {
		if (isEdgeBrowser()) {
			await speakKana(text);
		} else if ("speechSynthesis" in window) {
			await speakKanaWebBrowser(text);
		} else {
			await speakKana(text);
		}
	} catch (e) {
		console.error("朗讀時發生錯誤，嘗試後備方案：", e);
		if ("speechSynthesis" in window) {
			await speakKanaWebBrowser(text);
		}
	}
};
