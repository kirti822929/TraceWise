/**
 * Narrator — Web Speech API integration for voice narration
 * Supports natural Indian-accent Hinglish via Hindi TTS + Roman→Devanagari prep
 */
class Narrator {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.rate = 1;
        this.pitch = 1;
        this.volume = 1;
        this.enabled = true;
        this.speaking = false;
        this.explainMode = 'english';
        this._currentResolve = null;
        this._chromeInterval = null;

        this.ttsApiKey = localStorage.getItem('gemini_api_key') || '';
        this.ttsModel = 'gemini-2.5-flash-preview-tts';
        this.ttsVoice = 'Kore';
        this._ttsCache = new Map();
        this._audio = null;
        this._ttsRequestId = 0;
        this._ctx = null;
        this._source = null;
        this._installAudioUnlock();


        this._initVoices();
    }

    /**
     * Common Hinglish Roman words → Devanagari for natural Hindi TTS pronunciation.
     * English/tech terms stay in Latin script — mixed speech sounds like real Indian tutors.
     */
    static HINGLISH_SPEECH_MAP = [
        ['yaad rakhne layak baatein', 'याद रखने लायक बातें'],
        ['yaad rakhne layak', 'याद रखने लायक'],
        ['step by step', 'step by step'],
        ['dry run', 'dry run'],
        ['hash map', 'hash map'],
        ['time complexity', 'time complexity'],
        ['space complexity', 'space complexity'],
        ['kar dete hain', 'कर देते हैं'],
        ['kar sakte hain', 'कर सकते हैं'],
        ['kar rahe hain', 'कर रहे हैं'],
        ['ho jayega', 'हो जाएगा'],
        ['ho gaya', 'हो गया'],
        ['ho jata hai', 'हो जाता है'],
        ['samajh lo', 'समझ लो'],
        ['samajhte hain', 'समझते हैं'],
        ['samajhte', 'समझते'],
        ['karte hain', 'करते हैं'],
        ['karenge', 'करेंगे'],
        ['karta hai', 'करता है'],
        ['karti hai', 'करती है'],
        ['kar rahe', 'कर रहे'],
        ['solve karte', 'solve करते'],
        ['solve karo', 'solve करो'],
        ['chalo', 'चलो'],
        ['dekho', 'देखो'],
        ['samjho', 'समझो'],
        ['samajh', 'समझ'],
        ['pehle', 'पहले'],
        ['phir', 'फिर'],
        ['yahan', 'यहाँ'],
        ['wahan', 'वहाँ'],
        ['yeh', 'ये'],
        ['ye', 'ये'],
        ['woh', 'वो'],
        ['rah', 'रह'],
        ['raha', 'रहा'],
        ['rahi', 'रही'],
        ['rahe', 'रहे'],
        ['hamara', 'हमारा'],
        ['hamare', 'हमारे'],
        ['humara', 'हमारा'],
        ['humare', 'हमारे'],
        ['karte', 'करते'],
        ['karta', 'करता'],
        ['karti', 'करती'],
        ['karo', 'करो'],
        ['karein', 'करें'],
        ['karna', 'करना'],
        ['karni', 'करनी'],
        ['hain', 'हैं'],
        ['hai', 'है'],
        ['hum', 'हम'],
        ['humhe', 'हमें'],
        ['hamhe', 'हमें'],
        ['hume', 'हमें'],
        ['tum', 'तुम'],
        ['tumhe', 'तुम्हें'],
        ['aap', 'आप'],
        ['aapko', 'आपको'],
        ['lekin', 'लेकिन'],
        ['kyunki', 'क्योंकि'],
        ['kyonki', 'क्योंकि'],
        ['ab', 'अब'],
        ['aur', 'और'],
        ['toh', 'तो'],
        ['matlab', 'मतलब'],
        ['bas', 'बस'],
        ['bilkul', 'बिल्कुल'],
        ['thoda', 'थोड़ा'],
        ['bahut', 'बहुत'],
        ['zyada', 'ज़्यादा'],
        ['kam', 'कम'],
        ['ke saath', 'के साथ'],
        ['ke liye', 'के लिए'],
        ['ke andar', 'के अंदर'],
        ['ke baad', 'के बाद'],
        ['ke pehle', 'के पहले'],
        ['mein', 'में'],
        ['saath', 'साथ'],
        ['se', 'से'],
        ['par', 'पर'],
        ['pe', 'पे'],
        ['ko', 'को'],
        ['ka', 'का'],
        ['ki', 'की'],
        ['ke', 'के'],
        ['na', 'ना'],
        ['nahi', 'नहीं'],
        ['nahin', 'नहीं'],
        ['layak', 'लायक'],
        ['baatein', 'बातें'],
        ['baat', 'बात'],
        ['yaad', 'याद'],
        ['rakhne', 'रखने'],
        ['rakh', 'रख'],
        ['rakhna', 'रखना'],
        ['dhundhne', 'ढूंढने'],
        ['dhundho', 'ढूंढो'],
        ['diya', 'दिया'],
        ['diye', 'दिए'],
        ['gaya', 'गया'],
        ['gayi', 'गई'],
        ['gaye', 'गए'],
        ['jayega', 'जाएगा'],
        ['jayegi', 'जाएगी'],
        ['jayenge', 'जाएंगे'],
        ['hoga', 'होगा'],
        ['hogi', 'होगी'],
        ['honge', 'होंगे'],
        ['hota', 'होता'],
        ['hoti', 'होती'],
        ['hote', 'होते'],
        ['kya', 'क्या'],
        ['kaise', 'कैसे'],
        ['kyun', 'क्यों'],
        ['jab', 'जब'],
        ['tab', 'तब'],
        ['jahan', 'जहाँ'],
        ['agar', 'अगर'],
        ['to', 'तो'],
        ['fir', 'फिर'],
        ['is', 'इस'],
        ['iss', 'इस'],
        ['us', 'उस'],
        ['uss', 'उस'],
        ['inhe', 'इन्हें'],
        ['unhe', 'उन्हें'],
        ['in', 'इन'],
        ['un', 'उन'],
        ['ek', 'एक'],
        ['do', 'दो'],
        ['teen', 'तीन'],
        ['char', 'चार'],
        ['paanch', 'पाँच'],
        ['sab', 'सब'],
        ['sabhi', 'सभी'],
        ['har', 'हर'],
        ['poora', 'पूरा'],
        ['puri', 'पूरी'],
        ['poori', 'पूरी'],
        ['thik', 'ठीक'],
        ['theek', 'ठीक'],
        ['sahi', 'सही'],
        ['galat', 'गलत'],
        ['asani', 'आसानी'],
        ['aasan', 'आसान'],
        ['mushkil', 'मुश्किल'],
        ['fast', 'fast'],
        ['slow', 'slow'],
        ['dabao', 'दबाओ'],
        ['shuru', 'शुरू'],
        ['khatam', 'खत्म'],
        ['pura', 'पूरा'],
        ['logic', 'logic'],
        ['approach', 'approach'],
        ['array', 'array'],
        ['loop', 'loop'],
        ['index', 'index'],
        ['target', 'target'],
        ['input', 'input'],
        ['output', 'output'],
        ['pair', 'pair'],
        ['check', 'check'],
        ['return', 'return'],
        ['value', 'value'],
        ['number', 'number'],
        ['element', 'element'],
        ['elements', 'elements'],
        ['problem', 'problem'],
        ['solution', 'solution'],
        ['code', 'code'],
        ['pseudocode', 'pseudocode'],
        ['brute force', 'brute force'],
        ['edge case', 'edge case'],
        ['yaar', 'यार'],
        ['bhai', 'भाई'],
        ['dekhte', 'देखते'],
        ['banate', 'बनाते'],
        ['banate hain', 'बनाते हैं'],
        ['use karte', 'use करते'],
        ['use karenge', 'use करेंगे'],
        ['use karo', 'use करो'],
        ['try karte', 'try करते'],
        ['try karo', 'try करो'],
        ['lagta', 'लगता'],
        ['lagti', 'लगती'],
        ['lagte', 'लगते'],
        ['milta', 'मिलता'],
        ['milti', 'मिलती'],
        ['milte', 'मिलते'],
        ['mil gaya', 'मिल गया'],
        ['chahiye', 'चाहिए'],
        ['padega', 'पड़ेगा'],
        ['padta', 'पड़ता'],
        ['wala', 'वाला'],
        ['wali', 'वाली'],
        ['wale', 'वाले'],
        ['tarah', 'तरह'],
        ['jaisa', 'जैसा'],
        ['jaise', 'जैसे'],
        ['waisa', 'वैसा'],
        ['waise', 'वैसे'],
        ['liye', 'लिए'],
        ['liye', 'लिए'],
        ['wajah', 'वजह'],
        ['reason', 'reason'],
        ['example', 'example'],
        ['generate', 'generate'],
        ['nahi hua', 'नहीं हुआ'],
        ['nahi hui', 'नहीं हुई']
    ];

    _initVoices() {
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            if (voices.length === 0) return;
            this.setExplainMode(this.explainMode);
        };

        loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    /**
     * Pick voice + speech settings for explanation language
     * @param {string} mode - english | hindi | hinglish | spanish | etc.
     */
    setExplainMode(mode) {
        this.explainMode = mode || 'english';
        this.ttsApiKey = localStorage.getItem('gemini_api_key') || '';

        // Hindi/Hinglish uses Gemini TTS. Browser voice remains only as fallback.
        if (mode === 'hinglish' || mode === 'hindi') {
            this.pitch = 1;
            this.voice = this._pickIndianHindiVoice(this.synth.getVoices());
        } else if (mode === 'english') {
            this.pitch = 1;
            this.voice = this._pickVoice(this.synth.getVoices(), 'en', [
                'Google US English', 'Google UK English', 'Microsoft Zira', 'Samantha', 'Alex'
            ]);
        } else {
            this.pitch = 1;
            const langCodes = {
                spanish: 'es', french: 'fr', german: 'de',
                japanese: 'ja', korean: 'ko', chinese: 'zh', arabic: 'ar'
            };
            this.voice = this._pickVoice(this.synth.getVoices(), langCodes[mode] || 'en');
        }
    }

    _pickIndianHindiVoice(voices) {
        if (!voices || !voices.length) return null;
        return (
            voices.find(v => v.lang && v.lang.toLowerCase() === 'hi-in' && /google/i.test(v.name)) ||
            voices.find(v => v.lang && v.lang.toLowerCase() === 'hi-in') ||
            voices.find(v => v.lang && v.lang.toLowerCase().startsWith('hi-'))
        );
    }

    /**
     * Create/resume a shared AudioContext. Media elements are blocked by
     * autoplay policy inside preview iframes, so all narration plays through
     * Web Audio, unlocked on the first user gesture.
     * @private
     */
    _installAudioUnlock() {
        const unlock = () => {
            try {
                if (!this._ctx) {
                    const Ctx = window.AudioContext || window.webkitAudioContext;
                    if (Ctx) this._ctx = new Ctx();
                }
                if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
            } catch (_) { /* ignore */ }
        };
        ['pointerdown', 'click', 'keydown', 'touchstart'].forEach(evt => {
            window.addEventListener(evt, unlock, { capture: true });
        });
    }

    async _getContext() {
        if (!this._ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            this._ctx = new Ctx();
        }
        if (this._ctx.state === 'suspended') {
            try { await this._ctx.resume(); } catch (_) { /* ignore */ }
        }
        return this._ctx;
    }

    /**
     * Preload the first slide's audio so Play can start it with less delay.
     */
    prepareSlides(slides) {
        if (!Array.isArray(slides) || !slides.length) return;
        const first = slides[0]?.narration;
        if (first) {
            this._getTTSAudio(first).catch(err => {
                console.warn('[Narrator] TTS preload failed:', err.message);
            });
        }
    }

    async _getTTSAudio(text) {
        const cleanText = (text || '').trim();
        if (!cleanText) return null;

        const cacheKey = `${this.explainMode}|${this.ttsVoice}|${cleanText}`;
        if (this._ttsCache.has(cacheKey)) return this._ttsCache.get(cacheKey);

        // Narration goes through the app's own server route, which uses an
        // Indian-accent Gemini voice. No user API key needed.
        let speechText = cleanText;
        if (this.explainMode === 'hinglish') {
            speechText = this._prepareHinglishSpeech(speechText);
        }

        const response = await fetch('/api/public/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: speechText, mode: this.explainMode })
        });

        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new Error(`TTS error (${response.status}) ${detail}`.trim());
        }

        const bytes = await response.arrayBuffer();
        if (!bytes || bytes.byteLength < 100) throw new Error('TTS returned no audio data.');

        const ctx = await this._getContext();
        if (!ctx) throw new Error('Web Audio is not available.');

        const buffer = await ctx.decodeAudioData(bytes.slice(0));
        this._ttsCache.set(cacheKey, buffer);
        return buffer;
    }


    _pcmBase64ToWav(base64, mimeType = 'audio/L16;rate=24000') {
        const binary = atob(base64);
        const pcm = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) pcm[i] = binary.charCodeAt(i);

        const rateMatch = mimeType.match(/rate=(\d+)/i);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
        const channels = 1;
        const bitsPerSample = 16;
        const blockAlign = channels * bitsPerSample / 8;
        const byteRate = sampleRate * blockAlign;

        const buffer = new ArrayBuffer(44 + pcm.length);
        const view = new DataView(buffer);

        const writeString = (offset, value) => {
            for (let i = 0; i < value.length; i++) {
                view.setUint8(offset + i, value.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + pcm.length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, pcm.length, true);

        new Uint8Array(buffer, 44).set(pcm);
        return new Blob([buffer], { type: 'audio/wav' });
    }

    /** @private Generic voice picker with optional name preferences */
    _pickVoice(voices, langPrefix, namePrefs = []) {
        if (!voices.length) return null;

        for (const name of namePrefs) {
            const match = voices.find(v => v.name.includes(name));
            if (match) return match;
        }

        return (
            voices.find(v => v.lang.startsWith(langPrefix) && v.name.includes('Google')) ||
            voices.find(v => v.lang.startsWith(langPrefix) && !v.localService) ||
            voices.find(v => v.lang.startsWith(langPrefix)) ||
            voices[0]
        );
    }

    /**
     * Convert Roman Hinglish to Devanagari mix for Hindi TTS engine.
     * Display text stays Roman — only speech is transformed.
     * @private
     */
    _prepareHinglishSpeech(text) {
        let result = text;
        const entries = Narrator.HINGLISH_SPEECH_MAP
            .slice()
            .sort((a, b) => b[0].length - a[0].length);

        for (const [roman, devanagari] of entries) {
            if (roman === devanagari) continue;
            const pattern = new RegExp(`\\b${roman.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            result = result.replace(pattern, devanagari);
        }
        return result;
    }

    _getUtteranceLang() {
        if (this.explainMode === 'hinglish' || this.explainMode === 'hindi') return 'hi-IN';
        if (this.explainMode === 'english') return 'en-US';
        const map = { spanish: 'es-ES', french: 'fr-FR', german: 'de-DE', japanese: 'ja-JP', korean: 'ko-KR', chinese: 'zh-CN', arabic: 'ar-SA' };
        return map[this.explainMode] || (this.voice?.lang || 'en-US');
    }

    /**
     * Speak the given text. Returns a promise that resolves when speech finishes.
     * @param {string} text - The text to speak
     * @returns {Promise<void>}
     */
    async speak(text) {
        const cleanText = (text || '').trim();
        if (!this.enabled || !cleanText) return;

        this.stop();
        const requestId = ++this._ttsRequestId;
        this.speaking = true;

        // Primary path for Hindi/Hinglish: Gemini TTS.
        if (this.explainMode === 'hinglish' || this.explainMode === 'hindi') {
            try {
                const audioUrl = await this._getTTSAudio(cleanText);
                if (requestId !== this._ttsRequestId || !this.enabled) return;

                await new Promise(resolve => {
                    const audio = new Audio(audioUrl);
                    this._audio = audio;

                    const finish = () => {
                        if (this._audio === audio) this._audio = null;
                        this.speaking = false;
                        resolve();
                    };

                    audio.onended = finish;
                    audio.onerror = finish;
                    audio.volume = this.volume;

                    audio.play().catch(err => {
                        console.warn('[Narrator] Gemini audio playback failed:', err.message);
                        finish();
                    });
                });
                return;
            } catch (err) {
                console.warn('[Narrator] Gemini TTS failed; using browser TTS fallback:', err.message);
            }
        }

        // Browser TTS fallback for English/other languages or TTS errors.
        await new Promise(resolve => {
            this._currentResolve = resolve;

            let speechText = cleanText;
            if (this.explainMode === 'hinglish') {
                speechText = this._prepareHinglishSpeech(speechText);
            }

            const utterance = new SpeechSynthesisUtterance(speechText);
            if (this.voice) utterance.voice = this.voice;
            utterance.lang = this._getUtteranceLang();
            utterance.rate = this.explainMode === 'hinglish'
                ? Math.max(0.5, this.rate * 0.92)
                : this.rate;
            utterance.pitch = this.pitch;
            utterance.volume = this.volume;

            const finish = () => {
                this.speaking = false;
                this._stopChromeFix();
                this._currentResolve = null;
                resolve();
            };

            utterance.onend = finish;
            utterance.onerror = finish;

            this._startChromeFix();
            this.synth.speak(utterance);
        });
    }

    stop() {
        this._ttsRequestId++;

        if (this._currentResolve) {
            const resolve = this._currentResolve;
            this._currentResolve = null;
            resolve();
        }

        this._stopChromeFix();
        this.synth.cancel();

        if (this._audio) {
            this._audio.pause();
            this._audio.currentTime = 0;
            this._audio = null;
        }

        this.speaking = false;
    }

    setRate(rate) {
        this.rate = Math.max(0.5, Math.min(2, rate));
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stop();
        return this.enabled;
    }

    /** @deprecated Use setExplainMode instead */
    setLanguage(langCode) {
        if (langCode.startsWith('hi')) this.setExplainMode('hindi');
        else if (langCode.startsWith('en-IN')) this.setExplainMode('hinglish');
        else this.setExplainMode('english');
    }

    _startChromeFix() {
        this._stopChromeFix();
        this._chromeInterval = setInterval(() => {
            if (this.synth.speaking && !this.synth.paused) {
                this.synth.pause();
                this.synth.resume();
            }
        }, 10000);
    }

    _stopChromeFix() {
        if (this._chromeInterval) {
            clearInterval(this._chromeInterval);
            this._chromeInterval = null;
        }
    }
}
