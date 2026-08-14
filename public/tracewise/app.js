/**
 * TraceWise — Main Application Controller
 * AI-powered DSA video solution generator with practice mode
 */
class DSAVideoApp {
    constructor() {
        this.narrator = new Narrator();
        this.player = new VideoPlayer(this.narrator);
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        this.language = localStorage.getItem('preferred_language') || 'python';
        this.explainLang = localStorage.getItem('explain_language') || 'hinglish';
        this.theme = localStorage.getItem('theme') || 'dark';
        this.currentSolution = null;

        this._init();
    }

    _init() {
        const langSelect = document.getElementById('language-select');
        if (langSelect) langSelect.value = this.language;

        const explainLangSelect = document.getElementById('explain-lang-select');
        if (explainLangSelect) explainLangSelect.value = this.explainLang;

        document.documentElement.setAttribute('data-theme', this.theme);
        this._updateThemeIcon();
        this._updateKeyStatus();
        this.narrator.setExplainMode(this.explainLang);
        this._setupEventListeners();
    }

    _setupEventListeners() {
        document.getElementById('generate-btn').addEventListener('click', () => this.generate());

        document.getElementById('language-select').addEventListener('change', (e) => {
            this.language = e.target.value;
            localStorage.setItem('preferred_language', this.language);
        });

        document.getElementById('explain-lang-select').addEventListener('change', (e) => {
            this.explainLang = e.target.value;
            localStorage.setItem('explain_language', this.explainLang);
            this.narrator.setExplainMode(this.explainLang);
        });

        document.getElementById('api-settings-btn').addEventListener('click', () => this._showApiModal());
        document.getElementById('save-key-btn').addEventListener('click', () => this._saveApiKey());
        document.getElementById('close-modal-btn').addEventListener('click', () => this._hideApiModal());

        document.getElementById('api-modal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
                this._hideApiModal();
            }
        });

        document.getElementById('api-key-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._saveApiKey();
        });

        document.getElementById('theme-toggle').addEventListener('click', () => this._toggleTheme());
        document.getElementById('new-problem-btn').addEventListener('click', () => this._showInput());

        document.getElementById('example-problems').addEventListener('click', (e) => {
            const btn = e.target.closest('.example-btn');
            if (btn) {
                const problemText = this._getExampleProblem(btn.dataset.problem);
                if (problemText) {
                    document.getElementById('problem-input').value = problemText;
                    this.generate();
                }
            }
        });

        document.getElementById('problem-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.generate();
            }
        });

        // Practice mode buttons
        const checkBtn = document.getElementById('check-approach-btn');
        if (checkBtn) checkBtn.addEventListener('click', () => this._compareApproach());

        const replayBtn = document.getElementById('replay-video-btn');
        if (replayBtn) replayBtn.addEventListener('click', () => this._replayVideo());

        const newProbPracticeBtn = document.getElementById('new-problem-practice-btn');
        if (newProbPracticeBtn) newProbPracticeBtn.addEventListener('click', () => this._showInput());
    }

    // === API Key ===
    _showApiModal() {
        const modal = document.getElementById('api-modal');
        modal.classList.remove('hidden');
        document.getElementById('api-key-input').value = this.apiKey;
        requestAnimationFrame(() => modal.classList.add('active'));
        document.getElementById('api-key-input').focus();
    }

    _hideApiModal() {
        const modal = document.getElementById('api-modal');
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    _saveApiKey() {
        const key = document.getElementById('api-key-input').value.trim();
        if (!key) { this._showToast('Please enter an API key', 'error'); return; }
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        this._updateKeyStatus();
        this._hideApiModal();
        this._showToast('API key saved! ✓', 'success');
    }

    _updateKeyStatus() {
        const s = document.getElementById('key-status');
        if (s) s.classList.toggle('active', !!this.apiKey);
    }

    // === Theme ===
    _toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
        this._updateThemeIcon();
    }

    _updateThemeIcon() {
        const d = document.getElementById('theme-icon-dark');
        const l = document.getElementById('theme-icon-light');
        if (d) d.classList.toggle('hidden', this.theme !== 'dark');
        if (l) l.classList.toggle('hidden', this.theme !== 'light');
    }

    // === UI States ===
    _showInput() {
        this.player.reset();
        this.currentSolution = null;
        document.getElementById('input-section').classList.remove('hidden');
        document.getElementById('loading-section').classList.add('hidden');
        document.getElementById('player-section').classList.add('hidden');
        const ps = document.getElementById('practice-section');
        if (ps) ps.classList.add('hidden');
        const footer = document.getElementById('app-footer');
        if (footer) footer.classList.remove('hidden');
    }

    _showLoading() {
        document.getElementById('input-section').classList.add('hidden');
        document.getElementById('loading-section').classList.remove('hidden');
        document.getElementById('player-section').classList.add('hidden');
        const ps = document.getElementById('practice-section');
        if (ps) ps.classList.add('hidden');
        const footer = document.getElementById('app-footer');
        if (footer) footer.classList.add('hidden');

        document.querySelectorAll('.loading-step').forEach(s => s.classList.remove('active', 'done'));
        document.getElementById('step-analyzing').classList.add('active');
        document.getElementById('loading-text').textContent = 'AI is analyzing the problem...';

        this._loadingTimers = [];
        this._loadingTimers.push(setTimeout(() => {
            document.getElementById('step-analyzing').classList.add('done');
            document.getElementById('step-solving').classList.add('active');
            document.getElementById('loading-text').textContent = 'Finding optimal solution...';
        }, 3000));
        this._loadingTimers.push(setTimeout(() => {
            document.getElementById('step-solving').classList.add('done');
            document.getElementById('step-generating').classList.add('active');
            document.getElementById('loading-text').textContent = 'Creating video slides...';
        }, 7000));
    }

    _clearLoadingTimers() {
        if (this._loadingTimers) {
            this._loadingTimers.forEach(t => clearTimeout(t));
            this._loadingTimers = [];
        }
    }

    _showPlayer() {
        this._clearLoadingTimers();
        document.getElementById('input-section').classList.add('hidden');
        document.getElementById('loading-section').classList.add('hidden');
        document.getElementById('player-section').classList.remove('hidden');
        const ps = document.getElementById('practice-section');
        if (ps) ps.classList.add('hidden');
        const footer = document.getElementById('app-footer');
        if (footer) footer.classList.add('hidden');
    }

    _showPractice() {
        document.getElementById('player-section').classList.add('hidden');
        const ps = document.getElementById('practice-section');
        if (ps) {
            ps.classList.remove('hidden');
            const input = document.getElementById('practice-input');
            if (input) { input.value = ''; input.focus(); }
            const comp = document.getElementById('practice-comparison');
            if (comp) comp.classList.add('hidden');
        }
    }

    // === Toast ===
    _showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const msgEl = document.getElementById('toast-message');
        const iconEl = document.getElementById('toast-icon');
        const icons = { success: '✓', error: '✕', info: 'ℹ' };
        if (iconEl) iconEl.textContent = icons[type] || icons.info;
        if (msgEl) msgEl.textContent = message;
        toast.className = `toast ${type}`;
        void toast.offsetWidth;
        toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 4000);
    }

    // === Generate ===
    async generate() {
        const problem = document.getElementById('problem-input').value.trim();
        if (!problem) {
            this._showToast('Please paste a problem statement', 'error');
            document.getElementById('problem-input').focus();
            return;
        }
        if (!this.apiKey) {
            this._showApiModal();
            this._showToast('Please set up your Gemini API key first', 'error');
            return;
        }

        this._showLoading();

        try {
            const rawData = await this._callGeminiAPI(problem);
            const solution = this._parseResponse(rawData);
            this.currentSolution = solution;
            const slides = this._createSlides(solution);
            this.player.loadSlides(slides);
            this._showPlayer();
            this._showToast('Video ready! Press ▶ Play to start', 'success');
        } catch (error) {
            console.error('Generation error:', error);
            this._clearLoadingTimers();
            this._showInput();

            let message = error.message || 'Generate fail ho gaya. Dubara try karo.';
            if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                message = 'Internet connection check karo. Chrome browser use karo aur page refresh karo.';
            }
            this._showToast(message, 'error');
        }
    }

    // === Gemini API ===
    async _callGeminiAPI(problem) {
        const langNames = { cpp: 'C++', python: 'Python', java: 'Java' };
        const lang = langNames[this.language] || 'Python';

        const explainLangMap = {
            english:  { name: 'English', code: 'en' },
            hindi:    { name: 'Hindi', code: 'hi' },
            hinglish: { name: 'Hinglish (Hindi written in English script, mixed with English words)', code: 'en' },
            spanish:  { name: 'Spanish', code: 'es' },
            french:   { name: 'French', code: 'fr' },
            german:   { name: 'German', code: 'de' },
            japanese: { name: 'Japanese', code: 'ja' },
            korean:   { name: 'Korean', code: 'ko' },
            chinese:  { name: 'Chinese (Simplified)', code: 'zh' },
            arabic:   { name: 'Arabic', code: 'ar' }
        };
        const explainInfo = explainLangMap[this.explainLang] || explainLangMap.english;

        // Indian Hindi voice for Hinglish — sounds like real Indian tutor
        this.narrator.setExplainMode(this.explainLang);

        const languageInstructions = {
            english: 'Write ALL content in simple, beginner-friendly English. Explain as if teaching a student who is new to DSA. Keep it conversational and easy to understand.',
            hindi: 'Write ALL content in Hindi using Devanagari script (हिंदी). Explain as if teaching a beginner DSA student. Keep technical terms like "array", "hash map", "time complexity" in English where Indians normally use them. Tone should feel like a friendly Indian tutor.',
            hinglish: `Write ALL content in natural Hinglish — exactly how Indian students and tutors speak in real life (YouTube tutors like Striver, Apna College, CodeWithHarry style).

HINGLISH RULES (CRITICAL):
- Use Roman/Latin script ONLY — never Devanagari
- Mix Hindi and English naturally: "Dekho", "samjho", "pehle", "phir", "yahan", "basically", "matlab", "toh", "ab", "lekin", "kyunki", "kya", "hum", "tum", "aap"
- Keep DSA/tech terms in English: array, loop, hash map, pointer, index, target, complexity, brute force, edge case, dry run, pseudocode
- Sound casual and friendly — like explaining to a friend over chai, NOT formal textbook Hindi
- Example tone: "Dekho yaar, pehle hum brute force try karte hain — har pair check karo, lekin yeh O(n²) hai, slow ho jayega. Toh smart trick kya hai? Hash map use karo!"
- Use "hum/karte hain/samajhte hain" style — inclusive Indian tutoring voice
- Avoid pure English paragraphs and avoid pure Hindi — always natural mix`,
            spanish: 'Write ALL content in Spanish. Keep it beginner-friendly and conversational.',
            french: 'Write ALL content in French. Keep it beginner-friendly and conversational.',
            german: 'Write ALL content in German. Keep it beginner-friendly and conversational.',
            japanese: 'Write ALL content in Japanese. Keep it beginner-friendly and conversational.',
            korean: 'Write ALL content in Korean. Keep it beginner-friendly and conversational.',
            chinese: 'Write ALL content in Simplified Chinese. Keep it beginner-friendly and conversational.',
            arabic: 'Write ALL content in Arabic. Keep it beginner-friendly and conversational.'
        };
        const languageInstruction = languageInstructions[this.explainLang] || languageInstructions.english;

        const prompt = `You are an expert DSA tutor creating a detailed video tutorial, similar to how popular YouTube educators (like NeetCode or Striver) explain problems. Be thorough, clear, and beginner-friendly.

PROBLEM:
${problem}

CODE LANGUAGE: ${lang}

You MUST respond with ONLY valid JSON. No markdown, no code fences, no extra text before or after the JSON. Here is the exact structure:

{
    "problemTitle": "Short descriptive title",
    "problemExplanation": "A detailed 4-5 sentence explanation of what the problem is asking. Break it down simply. Give a real-world analogy if possible. Mention the input/output format and constraints.",
    "approach": {
        "name": "Name of the approach (e.g., Two Pointers, Hash Map, Dynamic Programming)",
        "intuition": "A detailed 5-6 sentence explanation of WHY this approach works. Start with the brute force idea, explain why it is inefficient, then explain the key insight that leads to the optimal approach. Use a real-world analogy. Make it so a beginner can understand the thought process.",
        "steps": ["Step 1: Detailed description of what to do first and why", "Step 2: Next action with reasoning", "Step 3: Continue with clear logic", "Step 4: More steps as needed", "Step 5: Final step"]
    },
    "pseudocode": "Write clean pseudocode (not actual code) that outlines the algorithm logic step by step. Use plain English-like syntax with proper indentation. Example format:\\nFUNCTION solve(input):\\n    CREATE empty hash map\\n    FOR each element in input:\\n        IF complement exists in map:\\n            RETURN result\\n        ADD element to map\\n    RETURN not found",
    "dryRun": {
        "input": "Specific example input (e.g., nums = [2, 7, 11, 15], target = 9)",
        "expectedOutput": "Expected output for this input",
        "steps": [
            {"step": 1, "description": "What happens in this step", "variables": {"var1": "value1"}, "explanation": "State of the algorithm"},
            {"step": 2, "description": "Next iteration", "variables": {"var1": "val", "var2": "val"}, "explanation": "What changed and why"},
            {"step": 3, "description": "Continue tracing", "variables": {"var1": "val", "var2": "val"}, "explanation": "Current state"},
            {"step": 4, "description": "More steps", "variables": {"var1": "val"}, "explanation": "Explanation"},
            {"step": 5, "description": "More steps", "variables": {"var1": "val"}, "explanation": "Explanation"},
            {"step": 6, "description": "More steps", "variables": {"var1": "val"}, "explanation": "Explanation"},
            {"step": 7, "description": "More steps", "variables": {"var1": "val"}, "explanation": "Explanation"},
            {"step": 8, "description": "Final step or result found", "variables": {"result": "val"}, "explanation": "How we got the answer"}
        ]
    },
    "code": "Complete, clean, correct, runnable solution code in ${lang}. Include detailed inline comments explaining each important line. Use proper indentation with spaces.",
    "codeExplanation": [
        {"lines": "1-3", "explanation": "Detailed explanation of what these lines do and WHY they are needed"},
        {"lines": "4-7", "explanation": "Detailed explanation of the core logic"},
        {"lines": "8-10", "explanation": "Detailed explanation of remaining code"}
    ],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "complexityExplanation": "Detailed 3-4 sentence explanation of WHY the time complexity is what it is. Mention what operations contribute to the complexity. Compare with brute force complexity. Explain the space usage.",
    "keyTakeaways": ["Key pattern or technique learned", "When to recognize this type of problem", "Common mistakes to avoid", "Related problems that use similar approach"]
}

CRITICAL RULES:
1. Code MUST be complete, correct, and runnable
2. Include 6-8 dry run steps showing EVERY iteration clearly
3. Pseudocode should be algorithm-level, NOT actual code
4. ${languageInstruction}
5. Output ONLY valid JSON — no markdown, no backticks, no extra text
6. Escape all special characters in strings properly
7. Make explanations DETAILED like a YouTube tutorial — imagine you are teaching someone who has never seen this problem`;

        // Verified Gemini models (newest first) — gemini-3.7 does not exist
        const models = [
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-3.1-flash-lite',
            'gemini-2.5-flash'
        ];
        let lastError = null;

        for (const model of models) {
            try {
                console.log(`Trying model: ${model}...`);
                const data = await this._requestGeminiModel(model, prompt);
                console.log(`✓ Model ${model} responded successfully`);
                return data;
            } catch (fetchErr) {
                if (fetchErr.message.includes('API key') || fetchErr.message.includes('Invalid API')) {
                    throw fetchErr;
                }
                lastError = fetchErr.message;
                console.warn(`Model ${model} error:`, fetchErr.message);
                if (!fetchErr.retryable) break;
            }
        }

        throw new Error(lastError || 'Sab models fail ho gaye. Thodi der baad dubara try karo.');
    }

    /**
     * Call a single Gemini model with JSON mode, falling back to plain text mode.
     * @private
     */
    async _requestGeminiModel(model, prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const bodyWithJson = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json'
            }
        };

        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyWithJson)
        });

        // Some models/keys don't support JSON mode — retry without it
        if (!response.ok && response.status === 400) {
            const errPreview = await response.clone().json().catch(() => ({}));
            const errText = errPreview.error?.message || '';
            if (/responseMimeType|json|mime/i.test(errText)) {
                console.warn(`JSON mode unsupported on ${model}, retrying plain text...`);
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 8192
                        }
                    })
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `API error (${response.status})`;
            console.warn(`Model ${model} failed (${response.status}):`, errorMsg);

            if (response.status === 403) {
                throw new Error('Invalid API key. Settings mein sahi Gemini key daalo.');
            }
            if (response.status === 429 || response.status === 503 || response.status === 404) {
                const err = new Error(errorMsg);
                err.retryable = true;
                throw err;
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        this._validateGeminiResponse(data);
        return data;
    }

    /**
     * Validate Gemini response before parsing
     * @private
     */
    _validateGeminiResponse(data) {
        if (data.promptFeedback?.blockReason) {
            throw new Error('AI ne content block kar diya. Problem statement thoda change karke try karo.');
        }

        const candidate = data.candidates?.[0];
        if (!candidate) {
            throw new Error('AI se koi response nahi aaya. Dubara try karo.');
        }

        if (candidate.finishReason === 'SAFETY') {
            throw new Error('Content safety filter ne block kiya. Problem alag wording mein try karo.');
        }

        if (!candidate.content?.parts?.[0]?.text) {
            if (candidate.finishReason === 'MAX_TOKENS') {
                throw new Error('Response bahut lamba tha. Chhota problem try karo ya English select karo.');
            }
            throw new Error('AI se empty response aaya. Dubara try karo.');
        }
    }

    /**
     * Parse the AI response data into a solution object
     */
    _parseResponse(data) {
        this._validateGeminiResponse(data);

        let text = data.candidates[0].content.parts[0].text.trim();
        console.log('Raw response preview:', text.substring(0, 300));

        // Step 1: Try direct parse
        try { return JSON.parse(text); } catch (e1) { /* continue to cleanup */ }

        // Step 2: Strip markdown fences if present
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

        // Step 3: Extract JSON object if wrapped in extra text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) text = jsonMatch[0];

        // Step 4: Fix unescaped newlines/tabs inside string values
        let fixed = '';
        let inString = false;
        let escaped = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (escaped) { fixed += ch; escaped = false; continue; }
            if (ch === '\\') { fixed += ch; escaped = true; continue; }
            if (ch === '"') { fixed += ch; inString = !inString; continue; }
            if (inString && ch === '\n') { fixed += '\\n'; continue; }
            if (inString && ch === '\r') { continue; }
            if (inString && ch === '\t') { fixed += '\\t'; continue; }
            fixed += ch;
        }

        try {
            return JSON.parse(fixed);
        } catch (e2) {
            // Step 5: Try repairing truncated JSON (common with long Hinglish responses)
            const repaired = this._repairTruncatedJson(fixed);
            if (repaired) {
                try { return JSON.parse(repaired); } catch (e3) { /* fall through */ }
            }
            console.error('JSON parse failed after cleanup:', e2.message);
            console.error('Text preview:', fixed.substring(0, 500));
            throw new Error('AI ne galat format bheja. Dubara Generate dabao.');
        }
    }

    /**
     * Attempt to close truncated JSON objects/arrays
     * @private
     */
    _repairTruncatedJson(text) {
        let repaired = text.replace(/,\s*$/, '');
        const stack = [];
        let inString = false;
        let escaped = false;

        for (const ch of repaired) {
            if (escaped) { escaped = false; continue; }
            if (ch === '\\') { escaped = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === '{') stack.push('}');
            else if (ch === '[') stack.push(']');
            else if (ch === '}' || ch === ']') stack.pop();
        }

        if (inString) repaired += '"';
        while (stack.length) repaired += stack.pop();
        return repaired;
    }

    // === Slide Creation (7 slides) ===
    // Order: Problem → Approach → Pseudocode → Dry Run → Code → Code Walkthrough → Complexity
    _getNarrationTemplates() {
        const lang = this.explainLang;
        const templates = {
            english: {
                problem: (title, explanation) => `Let's solve ${title}. ${explanation}`,
                approach: (name, intuition) => `We'll use the ${name} approach. ${intuition}`,
                pseudocode: (pseudo) => `Here is the pseudocode for our approach. This outlines the algorithm logic before we write actual code. ${pseudo}`,
                dryRun: (input) => `Let's trace through the algorithm with input: ${input}`,
                code: (langName) => `Now here is the complete ${langName} solution.`,
                walkthrough: (parts) => `Let me walk through the code step by step. ${parts}`,
                complexity: (time, space, explanation, takeaways) =>
                    `Time complexity is ${time}, space complexity is ${space}. ${explanation}. Key takeaways: ${takeaways}`
            },
            hinglish: {
                problem: (title, explanation) => `Chalo, ${title} solve karte hain. ${explanation}`,
                approach: (name, intuition) => `Hum ${name} approach use karenge. ${intuition}`,
                pseudocode: (pseudo) => `Yeh raha hamara pseudocode — actual code se pehle algorithm ka logic samajh lo. ${pseudo}`,
                dryRun: (input) => `Chalo dry run karte hain is input ke saath: ${input}`,
                code: (langName) => `Ab dekho complete ${langName} solution.`,
                walkthrough: (parts) => `Ab code ko step by step samajhte hain. ${parts}`,
                complexity: (time, space, explanation, takeaways) =>
                    `Time complexity ${time} hai, aur space complexity ${space} hai. ${explanation}. Yaad rakhne layak baatein: ${takeaways}`
            },
            hindi: {
                problem: (title, explanation) => `चलिए, ${title} को solve करते हैं। ${explanation}`,
                approach: (name, intuition) => `हम ${name} approach इस्तेमाल करेंगे। ${intuition}`,
                pseudocode: (pseudo) => `यह है हमारा pseudocode — actual code से पहले algorithm की logic समझ लो। ${pseudo}`,
                dryRun: (input) => `चलिए dry run करते हैं इस input के साथ: ${input}`,
                code: (langName) => `अब देखो complete ${langName} solution।`,
                walkthrough: (parts) => `अब code को step by step समझते हैं। ${parts}`,
                complexity: (time, space, explanation, takeaways) =>
                    `Time complexity ${time} है, और space complexity ${space} है। ${explanation}. याद रखने लायक बातें: ${takeaways}`
            }
        };

        // Other languages fall back to English templates — AI content is already localized
        return templates[lang] || templates.english;
    }

    _getUiStrings() {
        const strings = {
            hinglish: {
                walkthroughStart: '▶ Play dabao aur code walkthrough shuru karo...',
                noPseudocode: 'Pseudocode generate nahi hua.',
                noCode: '// Code generate nahi hua'
            },
            hindi: {
                walkthroughStart: '▶ Play दबाओ और code walkthrough शुरू करो...',
                noPseudocode: 'Pseudocode generate नहीं हुआ।',
                noCode: '// Code generate नहीं हुआ'
            }
        };
        return strings[this.explainLang] || {
            walkthroughStart: '▶ Press play to start the walkthrough...',
            noPseudocode: 'No pseudocode generated.',
            noCode: '// No code generated'
        };
    }

    _createSlides(solution) {
        const language = this.language;
        const self = this;
        const narr = this._getNarrationTemplates();
        const ui = this._getUiStrings();
        const langNames = { cpp: 'C plus plus', python: 'Python', java: 'Java' };
        const codeLangName = langNames[language] || language;

        return [
            // Slide 1: Problem Understanding
            {
                title: solution.problemTitle || 'Problem',
                icon: '🎯',
                narration: narr.problem(solution.problemTitle || 'this problem', solution.problemExplanation || ''),
                render: async (container) => {
                    container.classList.add('problem-slide');
                    const content = document.createElement('div');
                    content.className = 'slide-main-text';
                    content.innerHTML = `<p class="problem-text">${self._escapeHtml(solution.problemExplanation || '')}</p>`;
                    container.appendChild(content);
                    await SlideAnimator.fadeIn(content);
                }
            },

            // Slide 2: Approach & Intuition (DETAILED)
            {
                title: `Approach: ${solution.approach?.name || 'Solution'}`,
                icon: '💡',
                narration: narr.approach(solution.approach?.name || 'solution', solution.approach?.intuition || ''),
                render: async (container) => {
                    container.classList.add('approach-slide');

                    const intuition = document.createElement('div');
                    intuition.className = 'approach-intuition';
                    intuition.innerHTML = `<p>${self._escapeHtml(solution.approach?.intuition || '')}</p>`;
                    container.appendChild(intuition);
                    await SlideAnimator.fadeIn(intuition);

                    const stepsContainer = document.createElement('div');
                    stepsContainer.className = 'approach-steps';
                    (solution.approach?.steps || []).forEach((step, i) => {
                        const stepEl = document.createElement('div');
                        stepEl.className = 'approach-step';
                        stepEl.innerHTML = `<span class="step-number">${i + 1}</span><span class="step-text">${self._escapeHtml(step)}</span>`;
                        stepsContainer.appendChild(stepEl);
                    });
                    container.appendChild(stepsContainer);
                    await SlideAnimator.fadeInStaggered(Array.from(stepsContainer.querySelectorAll('.approach-step')), 250);
                }
            },

            // Slide 3: Pseudocode
            {
                title: 'Pseudocode',
                icon: '📋',
                narration: narr.pseudocode(solution.pseudocode || ''),
                render: async (container) => {
                    const block = document.createElement('div');
                    block.className = 'pseudocode-block';
                    block.textContent = solution.pseudocode || ui.noPseudocode;
                    container.appendChild(block);
                    await SlideAnimator.fadeIn(block);
                }
            },

            // Slide 4: Dry Run (BEFORE code!)
            {
                title: 'Dry Run',
                icon: '🔄',
                narration: narr.dryRun(solution.dryRun?.input || ''),
                render: async (container) => {
                    container.classList.add('dry-run-slide');

                    const inputDisplay = document.createElement('div');
                    inputDisplay.className = 'dry-run-input';
                    inputDisplay.innerHTML = `<span class="dry-run-label">Input:</span><span class="dry-run-value">${self._escapeHtml(solution.dryRun?.input || 'N/A')}</span>`;
                    container.appendChild(inputDisplay);
                    await SlideAnimator.fadeIn(inputDisplay);

                    const varsContainer = document.createElement('div');
                    varsContainer.className = 'variables-container';
                    container.appendChild(varsContainer);

                    const stepsContainer = document.createElement('div');
                    stepsContainer.className = 'dry-run-steps';
                    container.appendChild(stepsContainer);

                    for (const step of (solution.dryRun?.steps || [])) {
                        if (step.variables && typeof step.variables === 'object') {
                            for (const [varName, varValue] of Object.entries(step.variables)) {
                                await SlideAnimator.animateVariable(varsContainer, varName, String(varValue));
                            }
                        }
                        const stepEl = document.createElement('div');
                        stepEl.className = 'dry-run-step';
                        stepEl.innerHTML = `<span class="dry-step-num">Step ${step.step}</span><span class="dry-step-desc">${self._escapeHtml(step.description || '')}</span>`;
                        stepsContainer.appendChild(stepEl);
                        await SlideAnimator.fadeIn(stepEl, 300);
                        stepsContainer.scrollTop = stepsContainer.scrollHeight;
                        await SlideAnimator.delay(1800);
                    }

                    if (solution.dryRun?.expectedOutput) {
                        const outputEl = document.createElement('div');
                        outputEl.className = 'dry-run-output';
                        outputEl.innerHTML = `<span class="dry-run-label">Output:</span><span class="dry-run-value success">${self._escapeHtml(solution.dryRun.expectedOutput)}</span>`;
                        container.appendChild(outputEl);
                        await SlideAnimator.scaleIn(outputEl);
                    }
                }
            },

            // Slide 5: Code Solution
            {
                title: 'Code Solution',
                icon: '💻',
                narration: narr.code(codeLangName),
                render: async (container) => {
                    container.classList.add('code-walkthrough-slide');
                    const codeBlock = SlideAnimator.createCodeBlock(solution.code || ui.noCode, language);
                    container.appendChild(codeBlock);
                    await SlideAnimator.fadeIn(codeBlock);
                }
            },

            // Slide 6: Code Walkthrough
            {
                title: 'Code Walkthrough',
                icon: '🔍',
                narration: narr.walkthrough((solution.codeExplanation || []).map(e => e.explanation).join('. ')),
                render: async (container) => {
                    container.classList.add('code-walkthrough-slide');
                    const codeBlock = SlideAnimator.createCodeBlock(solution.code || '', language);
                    container.appendChild(codeBlock);

                    const explanationBox = document.createElement('div');
                    explanationBox.className = 'code-explanation';
                    explanationBox.innerHTML = `<p class="explanation-text">${ui.walkthroughStart}</p>`;
                    container.appendChild(explanationBox);

                    await SlideAnimator.fadeIn(codeBlock, 400);
                    await SlideAnimator.fadeIn(explanationBox, 400);

                    for (const exp of (solution.codeExplanation || [])) {
                        const lineRange = String(exp.lines).split('-').map(Number);
                        const startLine = (lineRange[0] || 1) - 1;
                        const endLine = ((lineRange[1] || lineRange[0]) || 1) - 1;
                        const allLines = codeBlock.querySelectorAll('.code-line');
                        allLines.forEach(l => l.classList.remove('active'));
                        for (let i = startLine; i <= endLine && i < allLines.length; i++) {
                            if (allLines[i]) {
                                allLines[i].classList.add('active');
                                allLines[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        }
                        explanationBox.querySelector('.explanation-text').textContent = exp.explanation;
                        await SlideAnimator.delay(3000);
                    }
                }
            },

            // Slide 7: Complexity & Takeaways + Practice button
            {
                title: 'Complexity & Key Takeaways',
                icon: '📊',
                narration: narr.complexity(
                    solution.timeComplexity || 'unknown',
                    solution.spaceComplexity || 'unknown',
                    solution.complexityExplanation || '',
                    (solution.keyTakeaways || []).join('. ')
                ),
                render: async (container) => {
                    container.classList.add('complexity-slide');

                    const complexityRow = document.createElement('div');
                    complexityRow.className = 'complexity-row';
                    complexityRow.innerHTML = `
                        <div class="complexity-card time">
                            <span class="complexity-label">⏱ Time Complexity</span>
                            <span class="complexity-value">${self._escapeHtml(solution.timeComplexity || 'N/A')}</span>
                        </div>
                        <div class="complexity-card space">
                            <span class="complexity-label">💾 Space Complexity</span>
                            <span class="complexity-value">${self._escapeHtml(solution.spaceComplexity || 'N/A')}</span>
                        </div>`;
                    container.appendChild(complexityRow);
                    await SlideAnimator.fadeIn(complexityRow);

                    if (solution.complexityExplanation) {
                        const explEl = document.createElement('p');
                        explEl.className = 'complexity-explanation';
                        explEl.textContent = solution.complexityExplanation;
                        container.appendChild(explEl);
                        await SlideAnimator.fadeIn(explEl);
                    }

                    if (solution.keyTakeaways && solution.keyTakeaways.length > 0) {
                        const tc = document.createElement('div');
                        tc.className = 'takeaways';
                        tc.innerHTML = '<h3 class="takeaways-title">💡 Key Takeaways</h3>';
                        solution.keyTakeaways.forEach(t => {
                            const item = document.createElement('div');
                            item.className = 'takeaway-item';
                            item.innerHTML = `<span class="takeaway-icon">✓</span><span class="takeaway-text">${self._escapeHtml(t)}</span>`;
                            tc.appendChild(item);
                        });
                        container.appendChild(tc);
                        await SlideAnimator.fadeInStaggered(Array.from(tc.querySelectorAll('.takeaway-item')), 200);
                    }

                    // Practice mode button
                    const practicePrompt = document.createElement('div');
                    practicePrompt.style.cssText = 'text-align:center; margin-top:28px;';
                    practicePrompt.innerHTML = '<button class="btn-primary" onclick="window.app._showPractice()" style="font-size:0.95rem;padding:14px 28px;">✍️ Practice: Write Your Own Approach</button>';
                    container.appendChild(practicePrompt);
                    await SlideAnimator.fadeIn(practicePrompt);
                }
            }
        ];
    }

    // === Practice Mode ===
    _compareApproach() {
        const userApproach = document.getElementById('practice-input')?.value.trim();
        if (!userApproach) {
            this._showToast('Write your approach first!', 'error');
            return;
        }

        const comp = document.getElementById('practice-comparison');
        const userDisplay = document.getElementById('user-approach-display');
        const aiDisplay = document.getElementById('ai-approach-display');

        if (userDisplay) userDisplay.textContent = userApproach;
        if (aiDisplay && this.currentSolution) {
            const aiApproach = [
                `Approach: ${this.currentSolution.approach?.name || ''}`,
                '',
                `Intuition: ${this.currentSolution.approach?.intuition || ''}`,
                '',
                'Steps:',
                ...(this.currentSolution.approach?.steps || []).map((s, i) => `${i + 1}. ${s}`),
                '',
                `Time: ${this.currentSolution.timeComplexity || 'N/A'}`,
                `Space: ${this.currentSolution.spaceComplexity || 'N/A'}`
            ].join('\n');
            aiDisplay.textContent = aiApproach;
        }

        if (comp) comp.classList.remove('hidden');
        this._showToast('Compare your approach with AI\'s! 🎯', 'success');
    }

    _replayVideo() {
        if (this.currentSolution) {
            const slides = this._createSlides(this.currentSolution);
            this.player.loadSlides(slides);
            this._showPlayer();
        }
    }

    // === Example Problems ===
    _getExampleProblem(key) {
        const problems = {
            'two-sum': `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]`,

            'valid-parentheses': `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example 1: Input: s = "()" Output: true
Example 2: Input: s = "()[]{}" Output: true
Example 3: Input: s = "(]" Output: false`,

            'merge-intervals': `Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Example 1:
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].`,

            'lru-cache': `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the LRUCache class:
- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
- int get(int key) Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions get and put must each run in O(1) average time complexity.`,

            'binary-search': `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Example 1: Input: nums = [-1,0,3,5,9,12], target = 9 Output: 4
Example 2: Input: nums = [-1,0,3,5,9,12], target = 2 Output: -1`,

            'max-subarray': `Given an integer array nums, find the subarray with the largest sum, and return its sum.

Example 1:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

Example 2: Input: nums = [1] Output: 1
Example 3: Input: nums = [5,4,-1,7,8] Output: 23`
        };
        return problems[key] || '';
    }

    _escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const bootTraceWise = () => {
    if (!window.app) window.app = new DSAVideoApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootTraceWise);
} else {
    bootTraceWise();
}
