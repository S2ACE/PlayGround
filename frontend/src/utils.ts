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
	// 新版 Edge UA 會包含 "Edg/"
  return ua.includes("Edg/");
};

// 英文：瀏覽器內建 Web Speech API
const speakEnglishWebBrowser = (text: string, accent: "en-US" | "en-GB") => {
	if (!("speechSynthesis" in window)) {
		console.warn("此瀏覽器不支援 Web Speech API");
		return;
	}

	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = accent;

	const voices = window.speechSynthesis.getVoices();
	const preferredVoice =
		voices.find(
			(v) => v.lang === accent || v.lang.startsWith(accent.split("-")[0])
		) || voices.find((v) => v.lang.startsWith("en"));

	if (preferredVoice) {
		utterance.voice = preferredVoice;
	}

	window.speechSynthesis.speak(utterance);
};

// 英文：Google Cloud TTS（和 kana 共用同一組 key / endpoint）
const speakEnglishTTS = async (text: string, accent: "en-US" | "en-GB") => {
	const apiKey = import.meta.env.VITE_TTS_API_KEY;
	const endpoint = import.meta.env.VITE_TTS_ENDPOINT;

	if (!apiKey || !endpoint) {
		console.error("TTS API 設定缺失，請確認環境變數");
		return;
	}

	// 對應 Google TTS 的英文 voice name，可依喜好調整
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

// 對外匯出：智慧選擇英文發音
export const speakEnglishSmart = async (text: string, accent: "en-US" | "en-GB") => {
	try {
		if (isEdgeBrowser()) {
			await speakEnglishTTS(text, accent);
		} else if ("speechSynthesis" in window) {
			speakEnglishWebBrowser(text, accent);
		} else {
			await speakEnglishTTS(text, accent);
		}
	} catch (e) {
		console.error("英文朗讀錯誤，嘗試後備方案：", e);
		if ("speechSynthesis" in window) {
			speakEnglishWebBrowser(text, accent);
		}
	}
};

// 使用瀏覽器內建 Web Speech API 朗讀（日文）
export const speakKanaWebBrowser = (text: string) => {
	if (!("speechSynthesis" in window)) {
		console.warn("此瀏覽器不支援 Web Speech API，將改用後備方案");
		return;
	}

	const utterance = new SpeechSynthesisUtterance(text);

	const voices = window.speechSynthesis.getVoices();
	console.log(voices);

	// 優先找 Google/高品質的日文 voice，其次任何 ja-JP
	const jpVoice =
		voices.find(
			(v) => v.lang === "ja-JP" && v.name.toLowerCase().includes("google")
		) || voices.find((v) => v.lang === "ja-JP");

	if (jpVoice) {
		utterance.voice = jpVoice;
	}
	utterance.lang = "ja-JP";

  window.speechSynthesis.speak(utterance);
};

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
			name: "ja-JP-Standard-B",
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

// 智慧選擇：Edge 用 Google TTS，其它瀏覽器優先用內建朗讀
export const speakKanaSmart = async (text: string) => {
	try {
		if (isEdgeBrowser()) {
			// Edge → 用 Google TTS
			await speakKana(text);
		} else if ("speechSynthesis" in window) {
			// 其他支援 Web Speech API 的瀏覽器 → 用內建朗讀
			speakKanaWebBrowser(text);
		} else {
			await speakKana(text);
		}
	} catch (e) {
		console.error("朗讀時發生錯誤，嘗試後備方案：", e);
		if ("speechSynthesis" in window) {
			speakKanaWebBrowser(text);
		}
	}
};
