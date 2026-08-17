// Markup for the TraceWise app. The behaviour lives in the plain scripts under
// public/tracewise/ (animations.js, narrator.js, player.js, app.js), which
// query these exact ids and classes.
export const TRACEWISE_SHELL = /* html */ `
<div class="bg-gradient"></div>
<div class="bg-grid"></div>
<div class="bg-orb bg-orb-1"></div>
<div class="bg-orb bg-orb-2"></div>
<div class="bg-depth" aria-hidden="true">
  <div class="bg-shaft"></div>
  <div class="bg-cube bg-cube-1"><i class="face f1"></i><i class="face f2"></i><i class="face f3"></i><i class="face f4"></i><i class="face f5"></i><i class="face f6"></i></div>
  <div class="bg-cube bg-cube-2"><i class="face f1"></i><i class="face f2"></i><i class="face f3"></i><i class="face f4"></i><i class="face f5"></i><i class="face f6"></i></div>
  <div class="bg-cube bg-cube-3"><i class="face f1"></i><i class="face f2"></i><i class="face f3"></i><i class="face f4"></i><i class="face f5"></i><i class="face f6"></i></div>
  <div class="bg-shape bg-sphere bg-sphere-1"></div>
  <div class="bg-shape bg-sphere bg-sphere-2"></div>
  <div class="bg-shape bg-sphere bg-sphere-3"></div>
  <div class="bg-shape bg-ring bg-ring-1"></div>
  <div class="bg-shape bg-ring bg-ring-2"></div>
  <div class="bg-shape bg-ring bg-ring-3"></div>
  <div class="bg-shape bg-pane bg-pane-1"></div>
  <div class="bg-shape bg-pane bg-pane-2"></div>
  <div class="bg-dust"></div>
</div>
<div class="bg-hero-glow" aria-hidden="true"></div>
<div class="bg-horizon" aria-hidden="true"></div>
<div class="bg-vignette" aria-hidden="true"></div>


<header id="app-header">
  <div class="container header-content">
    <div class="logo">
      <div class="logo-icon">🎬</div>
      <div class="logo-text">Trace<span class="gradient-text">Wise</span></div>
    </div>
    <div class="header-actions">
      <button class="header-btn" id="api-settings-btn" title="API key settings" aria-label="API key settings">
        🔑 <span>API Key</span><span class="key-status" id="key-status"></span>
      </button>
      <button class="header-btn" id="theme-toggle" title="Toggle theme" aria-label="Toggle theme">
        <span id="theme-icon-dark">🌙</span><span id="theme-icon-light" class="hidden">☀️</span>
      </button>
    </div>
  </div>
</header>


<main class="container">
  <section id="input-section">
    <div class="hero-text">
      <div class="hero-badge"><span class="hero-badge-dot"></span> AI narration in Hinglish · Hindi · English</div>
      <h1>Any DSA problem,<br /><span class="gradient-text">explained like a video</span></h1>
      <p class="subtitle">Paste a problem and get an animated walkthrough — intuition, pseudocode, dry run, code and complexity — narrated in a natural Indian voice.</p>
    </div>

    <div class="input-card glass-card">
      <div class="input-group">
        <textarea id="problem-input" rows="8" placeholder="Paste your DSA problem statement here..."></textarea>
      </div>


      <div class="input-options">
        <label>
          <span>Code language</span>
          <select id="language-select">
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </label>
        <label>
          <span>Explain in</span>
          <select id="explain-lang-select">
            <option value="hinglish">Hinglish (Indian accent)</option>
            <option value="hindi">Hindi (Indian accent)</option>
            <option value="english">English</option>
          </select>
        </label>
      </div>

      <div class="input-actions">
        <button class="btn-generate" id="generate-btn">
          <span class="btn-label">✨ Generate Video</span>
        </button>
        <span class="shortcut-hint">Ctrl + Enter</span>
      </div>

      <div class="examples-section">
        <div class="examples-label">Try an example</div>
        <div class="example-problems" id="example-problems">
          <button class="example-btn" data-problem="two-sum">Two Sum</button>
          <button class="example-btn" data-problem="valid-parentheses">Valid Parentheses</button>
          <button class="example-btn" data-problem="binary-search">Binary Search</button>
          <button class="example-btn" data-problem="max-subarray">Maximum Subarray</button>
          <button class="example-btn" data-problem="merge-intervals">Merge Intervals</button>
          <button class="example-btn" data-problem="lru-cache">LRU Cache</button>
        </div>
      </div>
    </div>

    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">🎞️</div>
        <h3>Slide-by-slide video</h3>
        <p>Auto-generated scenes with progress, speed control and replay.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🗣️</div>
        <h3>Indian-accent voice</h3>
        <p>Hinglish and Hindi narration that actually sounds natural.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔍</div>
        <h3>Dry run + complexity</h3>
        <p>Watch variables change step by step, then see time & space cost.</p>
      </div>
    </div>
  </section>


  <section id="loading-section" class="hidden">
    <div class="loading-card glass-card">
      <div class="loading-animation"><div class="loading-ring"></div></div>
      <p id="loading-text">AI is analyzing the problem...</p>
      <div class="loading-steps">
        <div class="loading-step" id="step-analyzing"><span class="step-dot"></span><span class="step-text">Analyzing problem</span></div>
        <div class="loading-step" id="step-solving"><span class="step-dot"></span><span class="step-text">Finding optimal solution</span></div>
        <div class="loading-step" id="step-generating"><span class="step-dot"></span><span class="step-text">Creating video slides</span></div>
      </div>
    </div>
  </section>

  <section id="player-section" class="hidden">
    <div class="player-wrapper">
      <div class="player-card">
        <div id="slide-container"></div>

        <div class="controls-main">
          <div class="controls-progress" id="progress-bar"><div id="progress-fill"></div></div>
          <div class="controls-left">
            <button class="control-btn" id="prev-btn" title="Previous slide" aria-label="Previous slide">⏮</button>
            <button class="control-btn play-btn" id="play-pause-btn" title="Play / Pause" aria-label="Play or pause">
              <span class="icon-play">▶</span><span class="icon-pause hidden">⏸</span>
            </button>
            <button class="control-btn" id="next-btn" title="Next slide" aria-label="Next slide">⏭</button>
          </div>
          <div class="controls-center">
            <div id="slide-indicators"></div>
            <div class="slide-counter" id="slide-counter">1 / 1</div>
          </div>
          <div class="controls-right">
            <select class="speed-select" id="speed-control" aria-label="Narration speed">
              <option value="0.75">0.75x</option>
              <option value="1" selected>1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
            <button class="control-btn" id="volume-btn" title="Toggle narration" aria-label="Toggle narration">
              <span class="icon-vol-on">🔊</span><span class="icon-vol-off hidden">🔇</span>
            </button>
            <button class="control-btn" id="new-problem-btn" title="New problem" aria-label="New problem">✕</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="practice-section" class="hidden">
    <div class="practice-card glass-card">
      <div class="practice-header">
        <div class="practice-emoji">✍️</div>
        <h2>Write your own approach</h2>
      </div>
      <p class="practice-subtitle">Explain the approach in your own words, then compare it with the AI's solution.</p>
      <textarea id="practice-input" rows="8" placeholder="My approach: first I would..."></textarea>
      <div class="practice-actions">
        <button class="btn-primary" id="check-approach-btn">Compare with AI</button>
        <button class="btn-secondary" id="replay-video-btn">Replay video</button>
        <button class="btn-secondary" id="new-problem-practice-btn">New problem</button>
      </div>
      <div class="practice-comparison hidden" id="practice-comparison">
        <div class="comparison-col user-col">
          <h3>Your approach</h3>
          <div class="comparison-content" id="user-approach-display"></div>
        </div>
        <div class="comparison-col ai-col">
          <h3>AI approach</h3>
          <div class="comparison-content" id="ai-approach-display"></div>
        </div>
      </div>
    </div>
  </section>

  <footer id="app-footer">
    <p>Narration uses an Indian-accent voice for Hinglish and Hindi. Your Gemini API key stays in your browser.</p>
  </footer>
</main>

<div class="modal hidden" id="api-modal">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2>Gemini API key</h2>
      <button class="modal-close" id="close-modal-btn" aria-label="Close">✕</button>
    </div>
    <p class="modal-description">Needed to generate solutions. Get a free key from Google AI Studio — it is stored only in your browser.</p>
    <input type="password" id="api-key-input" placeholder="AIza..." autocomplete="off" />
    <div class="modal-actions">
      <button class="btn-primary" id="save-key-btn">Save key</button>
    </div>
  </div>
</div>

<div class="toast hidden" id="toast">
  <span class="toast-icon" id="toast-icon">ℹ</span>
  <span id="toast-message"></span>
</div>
`;
