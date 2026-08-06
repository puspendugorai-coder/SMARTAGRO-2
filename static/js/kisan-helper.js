/* =========================================================================
   kisan-helper.js  (merged from chatbot.js + kisan-helper.js)
   -------------------------------------------------------------------------
   Includes everything from both files:
     1. All 23 languages app.py's LANG_NAMES supports, with a language
        picker shown on first open.
     2. Typewriter animation — bot replies type themselves out; tap the
        bubble while it animates to skip to the full text.
     3. Live interim voice captions — words appear in the input box AS
        you speak, not just after you stop.
     4. Weather context — window.weatherData?.current is forwarded with
        every /api/chat request (from chatbot.js).
     5. Backward-compatible global aliases so any existing code that calls
        toggleChat(), clearChat(), startVoice(), sendMessage(), closeChat(),
        or handleChatKey() continues to work unchanged.

   /api/chat contract:
     request:  { messages: [{role, content}, ...], lang: "hi",
                 weather_context: { ...window.weatherData?.current } }
     response: { reply: "..." }  or  { error: "..." }

   Requires Font Awesome to already be loaded on the page.
   ========================================================================= */
(function () {

  /* ── Inject HTML ─────────────────────────────────────────────────── */
  document.body.insertAdjacentHTML('beforeend', `
<a id="kisanHelpline" href="tel:18001801551" onclick="return callKisanHelpline(event)" title="Kisan Helpline: 1800-180-1551 (Toll-Free)">
  <i class="fas fa-phone"></i>
  <span class="kw-pulse kw-helpline-pulse"></span>
</a>

<div id="kisanToggleBtn" onclick="toggleKisan()" title="Kisan Helper">
  <i class="fas fa-microphone"></i>
  <span class="kw-pulse"></span>
</div>

<div id="kisanOverlay" style="display:none">
  <div id="kisanWindow">
    <div class="kw-header">
      <div class="kw-header-left">
        <div class="kw-avatar"><i class="fas fa-seedling"></i></div>
        <div>
          <div class="kw-name">SmartAgro Assistant</div>
          <div class="kw-sub" id="kisanLangLabel">Ask in any language</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="kw-icon-btn" onclick="newKisanChat()" title="New Chat">
          <i class="fas fa-plus"></i>
        </button>
        <button class="kw-icon-btn" onclick="toggleKisan()" title="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div id="kisanLangPicker" class="kw-lang-picker" style="display:none">
      <div class="kw-lang-header">
        <div class="kw-lang-head-badge"><i class="fas fa-globe"></i></div>
        <div>
          <div class="kw-lang-title">Choose Your Language / भाषा चुनें</div>
          <div class="kw-lang-subtitle">Ask Kisan Helper in any of 23 languages</div>
        </div>
      </div>

      <div class="kw-lang-search-bar">
        <i class="fas fa-search kw-search-icon"></i>
        <input type="text" id="kisanLangSearch" placeholder="Search language (e.g. Hindi, English, বাংলা, తెలుగు)..." oninput="filterKisanLangs(this.value)"/>
      </div>

      <div class="kw-lang-grid" id="kisanLangGrid"></div>

      <div class="kw-lang-footer">
        <button class="kw-lang-skip" id="kisanLangSkip">Skip — Continue in English</button>
      </div>
    </div>

    <div class="kw-messages" id="kisanMessages"></div>

    <div class="kw-input-bar">
      <button class="kw-mic-btn" id="kisanMicBtn" onclick="toggleKisanMic()" title="Voice">
        <i class="fas fa-microphone"></i>
      </button>
      <input type="text" id="kisanInput" placeholder="Type or speak..."
             onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendKisanMessage()}"/>
      <button class="kw-send-btn" id="kisanSendBtn" onclick="sendKisanMessage()">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</div>`);

  /* ── Styles ───────────────────────────────────────────────────────── */
  const S = document.createElement('style');
  S.textContent = `
#kisanHelpline {
  position: fixed;
  bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  left: calc(28px + env(safe-area-inset-left, 0px));
  width: 58px; height: 58px; border-radius: 50%;
  background: linear-gradient(135deg, #15803d, #22c55e);
  box-shadow: 0 4px 24px rgba(34,197,94,.45);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 9999; text-decoration: none;
  transition: transform .2s, box-shadow .2s;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
#kisanHelpline:active { transform: scale(1.1); box-shadow: 0 6px 32px rgba(34,197,94,.6); }
#kisanHelpline i { font-size: 1.3rem; color: #fff; pointer-events: none; transform: rotate(0deg); }
.kw-helpline-pulse { background: #4ade80 !important; left: -3px; right: auto !important; }

#kisanToggleBtn {
  position: fixed;
  bottom: calc(28px + env(safe-area-inset-bottom, 0px));
  right: calc(28px + env(safe-area-inset-right, 0px));
  width: 58px; height: 58px; border-radius: 50%;
  background: linear-gradient(135deg, #166534, #22c55e);
  box-shadow: 0 4px 24px rgba(74,222,128,.45);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 9999;
  transition: transform .2s, box-shadow .2s;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
#kisanToggleBtn:active { transform: scale(1.1); box-shadow: 0 6px 32px rgba(74,222,128,.6); }
#kisanToggleBtn i { font-size: 1.4rem; color: #fff; pointer-events: none; }
#kisanToggleBtn.chat-open { background: linear-gradient(135deg, #991b1b, #ef4444); }
#kisanToggleBtn.listening { background: linear-gradient(135deg, #991b1b, #ef4444); }
.kw-pulse {
  position: absolute; top: -3px; right: -3px;
  width: 13px; height: 13px; background: #f87171; border-radius: 50%;
  animation: kwp 1.8s ease-in-out infinite; pointer-events: none;
}
@keyframes kwp { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.4} }

.kw-app-link {
  display: inline-flex; align-items: center; gap: 6px;
  margin: 6px 2px 2px 2px; padding: 6px 12px;
  background: rgba(74,222,128,.18);
  border: 1px solid rgba(74,222,128,.45);
  border-radius: 8px; color: #4ade80 !important;
  font-weight: 700; font-size: .82rem; text-decoration: none;
  transition: all .2s ease; box-shadow: 0 2px 8px rgba(74,222,128,.15);
}
.kw-app-link:hover, .kw-app-link:active {
  background: rgba(74,222,128,.35);
  border-color: #4ade80; color: #ffffff !important;
  transform: translateY(-1px);
}

#kisanOverlay {
  position: fixed; inset: 0; z-index: 9998;
  background: rgba(0,0,0,.65); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; transition: opacity .28s ease;
}
#kisanOverlay.open { opacity: 1; }

#kisanWindow {
  width: 100%; max-width: 520px;
  height: min(92vh, 100dvh);
  max-height: 100dvh;
  background: var(--card, #111a12);
  border-radius: 20px 20px 0 0;
  display: flex; flex-direction: column;
  overflow: hidden;
  transform: translateY(40px);
  transition: transform .3s cubic-bezier(.34,1.56,.64,1);
  box-shadow: 0 -8px 48px rgba(0,0,0,.5);
}
#kisanOverlay.open #kisanWindow { transform: translateY(0); }

.kw-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  background: linear-gradient(135deg, #166534, #15803d);
  flex-shrink: 0;
}
.kw-header-left { display: flex; align-items: center; gap: 10px; }
.kw-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(255,255,255,.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; color: #fff; flex-shrink: 0;
}
.kw-name { font-weight: 700; font-size: .95rem; color: #fff; }
.kw-sub  { font-size: .7rem; color: rgba(255,255,255,.75); }
.kw-icon-btn {
  background: rgba(255,255,255,.15); border: none; border-radius: 50%;
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  color: #fff; cursor: pointer; font-size: .85rem; transition: background .2s; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.kw-icon-btn:active { background: rgba(248,113,113,.4); }

.kw-lang-picker {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  background: radial-gradient(circle at top right, rgba(22, 101, 52, 0.35), rgba(11, 19, 13, 0.98));
  overflow: hidden;
  min-height: 0;
}
.kw-lang-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 14px; flex-shrink: 0;
}
.kw-lang-head-badge {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(74, 222, 128, 0.15); border: 1px solid rgba(74, 222, 128, 0.3);
  display: flex; align-items: center; justify-content: center;
  color: #4ade80; font-size: 1.1rem; flex-shrink: 0;
}
.kw-lang-title { font-weight: 700; font-size: .92rem; color: #ffffff; }
.kw-lang-subtitle { font-size: .72rem; color: #a7f3d0; opacity: 0.85; }

.kw-lang-search-bar { position: relative; margin-bottom: 14px; flex-shrink: 0; }
.kw-search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: #4ade80; font-size: .85rem; pointer-events: none;
}
#kisanLangSearch {
  width: 100%; padding: 10px 14px 10px 38px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 14px; color: #e8f5e9; font-size: .83rem;
  outline: none; transition: all .2s ease; box-sizing: border-box;
}
#kisanLangSearch:focus {
  border-color: #4ade80; background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 14px rgba(74, 222, 128, 0.22);
}
#kisanLangSearch::placeholder { color: rgba(255, 255, 255, 0.4); }

.kw-lang-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  flex: 1; overflow-y: auto; padding-right: 4px; padding-bottom: 6px;
  min-height: 0;
}
.kw-lang-grid::-webkit-scrollbar { width: 6px; }
.kw-lang-grid::-webkit-scrollbar-thumb { background: rgba(74,222,128,.35); border-radius: 4px; }

.kw-lang-opt {
  padding: 10px 6px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(74,222,128,0.06));
  border: 1px solid rgba(74, 222, 128, 0.22);
  color: #e8f5e9; cursor: pointer; text-align: center;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; line-height: 1.2; min-height: 52px;
  transition: all .2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  user-select: none; -webkit-user-select: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.kw-lang-opt span:first-child { font-weight: 700; font-size: .84rem; color: #ffffff; }
.kw-lang-opt .kl-sub { font-size: .64rem; font-weight: 500; color: #a7f3d0; opacity: 0.85; }
.kw-lang-opt:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.28), rgba(22, 163, 74, 0.38));
  border-color: #4ade80; color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(74, 222, 128, 0.3);
}
.kw-lang-opt:active, .kw-lang-opt.kl-active {
  background: linear-gradient(135deg, #166534, #22c55e);
  border-color: #4ade80; color: #ffffff;
  transform: scale(0.96);
}

.kw-lang-footer { margin-top: 12px; text-align: center; flex-shrink: 0; }
.kw-lang-skip {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 20px; color: #4ade80;
  font-size: .78rem; font-weight: 600; padding: 8px 20px;
  cursor: pointer; transition: all .2s ease; outline: none;
}
.kw-lang-skip:hover, .kw-lang-skip:active {
  background: rgba(74, 222, 128, 0.25);
  border-color: #4ade80; color: #ffffff;
  box-shadow: 0 4px 14px rgba(74, 222, 128, 0.25);
}

.kw-messages {
  flex: 1; overflow-y: auto; padding: 14px 12px;
  display: flex; flex-direction: column; gap: 12px;
  scroll-behavior: smooth;
}
.kw-messages::-webkit-scrollbar { width: 4px; }
.kw-messages::-webkit-scrollbar-thumb { background: rgba(74,222,128,.2); border-radius: 2px; }

.kw-msg { display: flex; gap: 8px; animation: msgIn .2s ease; }
@keyframes msgIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
.kw-msg.bot  { align-self: flex-start; align-items: flex-end; max-width: 88%; }
.kw-msg.user { align-self: flex-end; flex-direction: row-reverse; max-width: 80%; }

.kw-msg-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: rgba(74,222,128,.1); border: 1px solid rgba(74,222,128,.2);
  display: flex; align-items: center; justify-content: center; font-size: .85rem;
}
.kw-msg-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.kw-bubble {
  padding: 10px 13px; border-radius: 16px;
  font-size: .84rem; line-height: 1.6; word-break: break-word;
}
.kw-msg.bot  .kw-bubble {
  background: var(--bg-3, #1a2a1c);
  border: 1px solid rgba(74,222,128,.12);
  color: var(--text, #e8f5e9);
  border-bottom-left-radius: 4px;
}
.kw-msg.user .kw-bubble {
  background: linear-gradient(135deg, #166534, #22c55e);
  color: #fff; border-bottom-right-radius: 4px;
}
.kw-msg-footer { display: flex; align-items: center; gap: 6px; padding: 0 2px; }
.kw-msg.user .kw-msg-footer { justify-content: flex-end; }
.kw-msg-time { font-size: .62rem; color: var(--text-3, #6b8c6d); }
.kw-speak-btn {
  background: none; border: 1px solid rgba(74,222,128,.25); border-radius: 50%;
  width: 26px; height: 26px; min-width: 26px;
  display: flex; align-items: center; justify-content: center;
  color: rgba(74,222,128,.7); cursor: pointer; font-size: .72rem;
  transition: all .18s; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.kw-speak-btn:active, .kw-speak-btn.speaking {
  background: rgba(74,222,128,.15); border-color: #4ade80; color: #4ade80;
}
.kw-speak-btn.speaking { animation: speakPulse .9s ease-in-out infinite; }
@keyframes speakPulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.35)} 50%{box-shadow:0 0 0 5px rgba(74,222,128,0)} }

.kw-typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
.kw-typing span {
  display: inline-block; width: 7px; height: 7px;
  background: #4ade80; border-radius: 50%; animation: dot 1.2s infinite;
}
.kw-typing span:nth-child(2) { animation-delay: .2s; }
.kw-typing span:nth-child(3) { animation-delay: .4s; }
@keyframes dot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }

.kw-caret {
  display: inline-block; width: 2px; height: 1em; margin-left: 1px;
  background: #4ade80; vertical-align: text-bottom;
  animation: caretBlink .85s step-end infinite;
}
@keyframes caretBlink { 50% { opacity: 0; } }

.kw-input-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px;
  border-top: 1px solid rgba(74,222,128,.1);
  background: var(--bg-2, #0e1510);
  flex-shrink: 0;
}
#kisanInput {
  flex: 1; background: var(--bg-3, #1a2a1c);
  border: 1px solid rgba(74,222,128,.2); border-radius: 22px;
  padding: 9px 14px; color: var(--text, #e8f5e9);
  font-size: 16px; font-family: inherit; outline: none;
  transition: border-color .2s; min-width: 0;
}
#kisanInput:focus { border-color: rgba(74,222,128,.5); }
#kisanInput::placeholder { color: rgba(255,255,255,.35); }
.kw-mic-btn, .kw-send-btn {
  width: 42px; height: 42px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: .95rem; flex-shrink: 0;
  transition: transform .2s, background .2s;
  -webkit-tap-highlight-color: transparent; touch-action: manipulation;
}
.kw-mic-btn {
  background: var(--bg-3, #1a2a1c);
  border: 1px solid rgba(74,222,128,.2);
  color: var(--text-2, #a7c4a8);
}
.kw-mic-btn:active { background: rgba(74,222,128,.1); color: #4ade80; }
.kw-mic-btn.recording {
  background: rgba(248,113,113,.15); border-color: #f87171; color: #f87171;
  animation: micP .8s ease-in-out infinite;
}
@keyframes micP { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
.kw-send-btn {
  background: linear-gradient(135deg, #166534, #22c55e);
  color: #fff; box-shadow: 0 2px 8px rgba(74,222,128,.3);
}
.kw-send-btn:active { transform: scale(1.08); }

body.light-theme #kisanWindow   { background: #fff; }
body.light-theme .kw-msg.bot .kw-bubble { background: #f0fdf4; color: #1a2e1c; border-color: rgba(22,101,52,.15); }
body.light-theme .kw-input-bar  { background: #f9fafb; }
body.light-theme #kisanInput    { background: #fff; color: #1a2e1c; border-color: rgba(22,101,52,.2); }
body.light-theme #kisanInput::placeholder { color: #9ca3af; }
body.light-theme .kw-mic-btn    { background: #f0fdf4; color: #374151; border-color: rgba(22,101,52,.2); }
body.light-theme .kw-lang-opt   { background: #f0fdf4; color: #374151; border-color: rgba(22,101,52,.2); }
body.light-theme .kw-lang-picker { background: #f9fafb; }
body.light-theme .kw-speak-btn  { border-color: rgba(22,101,52,.25); color: rgba(22,101,52,.6); }

@media (max-width: 600px) {
  #kisanWindow { border-radius: 16px 16px 0 0; height: min(94vh, 100dvh); }
  #kisanHelpline {
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    left: calc(12px + env(safe-area-inset-left, 0px));
    width: 52px; height: 52px;
  }
  #kisanToggleBtn {
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    right: calc(12px + env(safe-area-inset-right, 0px));
    width: 52px; height: 52px;
  }
  .kw-lang-grid { grid-template-columns: repeat(3, 1fr); }
  .kw-lang-opt { min-height: 46px; font-size: .65rem; }
  .kw-msg.bot  { max-width: 92%; }
  .kw-msg.user { max-width: 88%; }
  .kw-input-bar { padding: 8px 10px; padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
  #kisanInput { font-size: 16px; }
  .kw-icon-btn { width: 38px; height: 38px; font-size: .95rem; }
  .kw-mic-btn, .kw-send-btn { width: 46px; height: 46px; }
  .kw-speak-btn { width: 30px; height: 30px; }
}
@media (max-width: 360px) {
  .kw-lang-grid { grid-template-columns: repeat(2, 1fr); }
}`;
  document.head.appendChild(S);

  /* ── State ────────────────────────────────────────────────────────── */
  let isOpen        = false;
  let recognition   = null;
  let isListening   = false;
  let speechSilenceTimer = null;
  let chatHistory   = [];
  let speakingMsgId = null;
  let availableVoices = [];
  let langChosen    = false;
  let chosenLang    = null;
  let activeTyper   = null;

  /* ── Language data — all 23 codes app.py's LANG_NAMES supports ───── */
  const LANG_NAMES = {
    en: 'English',   hi: 'हिन्दी',    bn: 'বাংলা',      te: 'తెలుగు',    mr: 'मराठी',
    ta: 'தமிழ்',    gu: 'ગુજરાતી',   kn: 'ಕನ್ನಡ',      ml: 'മലയാളം',    pa: 'ਪੰਜਾਬੀ',
    or: 'ଓଡ଼ିଆ',    as: 'অসমীয়া',   ur: 'اردو',        mai: 'मैथिली',   sat: 'ᱥᱟᱱᱛᱟᱲᱤ',
    ks: 'کٲشُر',    ne: 'नेपाली',    sd: 'सिन्धी',      kok: 'कोंकणी',   mni: 'মৈতৈলোন্',
    bodo: 'बड़ो',   doi: 'डोगरी',    sa: 'संस्कृतम्',
  };
  const LANG_ROMAN = {
    en: 'English',   hi: 'Hindi',     bn: 'Bangla',      te: 'Telugu',     mr: 'Marathi',
    ta: 'Tamil',     gu: 'Gujarati',  kn: 'Kannada',     ml: 'Malayalam',  pa: 'Punjabi',
    or: 'Odia',      as: 'Assamese',  ur: 'Urdu',        mai: 'Maithili',  sat: 'Santali',
    ks: 'Kashmiri',  ne: 'Nepali',    sd: 'Sindhi',      kok: 'Konkani',   mni: 'Meitei',
    bodo: 'Bodo',    doi: 'Dogri',    sa: 'Sanskrit',
  };
  const VOICE_LANGS = {
    en: 'en-IN',  hi: 'hi-IN',  bn: 'bn-IN',  te: 'te-IN',  mr: 'mr-IN',
    ta: 'ta-IN',  gu: 'gu-IN',  kn: 'kn-IN',  ml: 'ml-IN',  pa: 'pa-IN',
    or: 'or-IN',  as: 'as-IN',  ur: 'ur-PK',  mai: 'hi-IN', sat: 'hi-IN',
    ks: 'ur-PK',  ne: 'ne-NP',  sd: 'hi-IN',  kok: 'mr-IN', mni: 'bn-IN',
    bodo: 'hi-IN', doi: 'hi-IN', sa: 'hi-IN',
  };
  const GREETINGS = {
    en:   'Hello Farmer! I am SmartAgro Assistant.\nI am specialized in:\n• Agriculture & Crop disease solutions\n• Irrigation systems & water management\n• SmartAgro App features & step-by-step navigation\n• Mandi prices, MSP & Kisan schemes\n• Toll-Free Helpline on bottom-left (1800-180-1551)',
    hi:   'नमस्ते किसान भाई! मैं SmartAgro सहायक हूं।\nमैं केवल निम्न विषयों में सहायता करता हूं:\n• कृषि, फसल बीमारी और समाधान\n• सिंचाई प्रणाली और जल प्रबंधन\n• SmartAgro ऐप उपयोग और चरण-दर-चरण निर्देश\n• मंडी भाव, MSP और सरकारी योजनाएं\n• स्क्रीन के बाएं तरफ टोल-फ्री हेल्पलाइन (1800-180-1551)',
    bn:   'নমস্কার কৃষক ভাই! আমি SmartAgro সহায়ক।\nআমি সহায়তা করি:\n• কৃষি ও ফসলের রোগ চিকিৎসা\n• সেচ ব্যবস্থা ও জল ব্যবস্থাপনা\n• SmartAgro অ্যাপ ব্যবহারের ধাপসমূহ\n• বাজার মূল্য, MSP ও সরকারি স্কিম\n• নিচে বাঁদিকের হেল্পলাইন (1800-180-1551)',
    te:   'నమస్కారం! నేను SmartAgro సహాయకుడిని.\nనేను సహాయం చేస్తాను:\n• వ్యవసాయం మరియు పంట వ్యాధులు\n• సాగునీటి వ్యవస్థలు மற்றும் నీటి యాజమాన్యం\n• SmartAgro యాప్ మార్గదర్శకం\n• మార్కెట్ ధరలు మరియు పథకాలు\n• ఎడమ వైపు హెల్ప్‌లైన్ (1800-180-1551)',
    mr:   'नमस्कार! मी SmartAgro सहाय्यक आहे.\nमी मदत करतो:\n• शेती आणि पीक रोग\n• सिंचन पद्धती आणि पाणी व्यवस्थापन\n• SmartAgro ॲप मार्गदर्शन\n• बाजारभाव आणि योजना\n• डाव्या बाजूला हेल्पलाइन (1800-180-1551)',
    ta:   'வணக்கம்! நான் SmartAgro உதவியாளர்.\n• விவசாயம் மற்றும் பயிர் நோய்கள்\n• பாசன அமைப்புகள் மற்றும் நீர் மேலாண்மை\n• SmartAgro செயலி வழிகாட்டி\n• சந்தை விலைகள் & திட்டங்கள்\n• இடதுபுற ஹெல்ப்லைன் (1800-180-1551)',
    gu:   'નમસ્તે ખેડૂત મિત્ર! હું SmartAgro સહાયક છું.\n• ખેતી અને પાક રોગ ઉપાયો\n• સિંચાઈ પદ્ધતિઓ અને જળ વ્યવસ્થાપન\n• SmartAgro એપ વાપરવાની રીત\n• બજાર ભાવ અને યોજનાઓ\n• ડાબી બાજુ હેલ્પલાઈન (1800-180-1551)',
    kn:   'ನಮಸ್ಕಾರ! ನಾನು SmartAgro ಸಹಾಯಕ.\n• ಕೃಷಿ ಮತ್ತು ಬೆಳೆ ರೋಗಗಳು\n• ನೀರಾವರಿ ವ್ಯವಸ್ಥೆಗಳು\n• SmartAgro ಆ್ಯಪ್ ಮಾರ್ಗದರ್ಶಿ\n• ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು\n• ಎಡಭಾಗದಲ್ಲಿ ಸಹಾಯವಾಣಿ (1800-180-1551)',
    ml:   'നമസ്കാരം! ഞാൻ SmartAgro സഹായി.\n• കൃഷിയും വിള രോഗങ്ങളും\n• ജലസേചന സംവിധാനങ്ങൾ\n• SmartAgro ആപ്പ് ഉപയോഗം\n• വിപണി വിലകളും പദ്ധതികളും\n• ഹെൽപ്പ് ലൈൻ (1800-180-1551)',
    pa:   'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ SmartAgro ਸਹਾਇਕ ਹਾਂ।\n• ਖੇਤੀਬਾੜੀ ਅਤੇ ਫਸਲ ਰੋਗ\n• ਸਿੰਚਾਈ ਪ੍ਰਣਾਲੀ\n• SmartAgro ਐਪ ਗਾਈਡ\n• ਮੰਡੀ ਭਾਅ ਅਤੇ ਯੋਜਨਾਵਾਂ\n• ਹੈਲਪਲਾਈਨ (1800-180-1551)',
    or:   'ନମସ୍କାର! ମୁଁ SmartAgro ସହାୟକ।\n• କୃଷି ଓ ଫସଲ ରୋଗ\n• ଜଳସେଚନ ବ୍ୟବସ୍ଥା\n• SmartAgro ଆପ ଗାଇଡ୍\n• ବଜାର ମୂଲ୍ୟ ଓ ଯୋଜନା\n• ହେଲ୍ପଲାଇନ୍ (1800-180-1551)',
    as:   'নমস্কাৰ! মই SmartAgro সহায়ক।\n• কৃষি আৰু শস্যৰ ৰোগ\n• জলসিঞ্চন ব্যৱস্থা\n• SmartAgro এপ্প ব্যৱহাৰ\n• বজাৰ দাম আৰু আঁচনি\n• হেল্পলাইন (1800-180-1551)',
    ur:   'السلام علیکم! میں SmartAgro مددگار ہوں۔\n• زراعت اور فصلوں کے بیماریاں\n• آبپاشی کا نظام\n• SmartAgro ایپ کے استعمال کے طریقہ کار\n• منڈی بھاؤ اور اسکیمیں\n• ہیلپ لائن (1800-180-1551)',
    mai:  'प्रणाम! हम SmartAgro किसान सहायक छी। कृषि, सिंचाई, ऐप उपयोग, बाजार भाव आ हेल्पलाइन (1800-180-1551) बारे पुछू।',
    sat:  'ᱡᱚᱦᱟᱨ! ᱤᱧ SmartAgro ᱜᱚᱲᱚ ᱠᱟᱱᱟᱭ। ᱠᱷᱮᱛ, ᱫᱟ formal/irrigation ᱟᱨ ᱟᱯ key ᱵᱟᱵᱚᱛ ᱯᱩᱪᱷᱟᱣ ᱢᱮ (1800-180-1551) ।',
    ks:   'اَداب! بہٕ چھُس SmartAgro مددگار۔ کھیتی، آبپاشی، ایپ گائیڈ یا ہیلپ لائن (1800-180-1551) باپت پوچھِو۔',
    ne:   'नमस्ते! म SmartAgro किसान सहायक हुँ। कृषि, सिंचाई, एप प्रयोग र हेल्पलाईन (1800-180-1551) बारे सोध्नुहोस्।',
    sd:   'नमस्ते! मां SmartAgro सहायक आहियां. फसल, सिंचाई, ऐप इस्तेमाल या हेल्पलाइन (1800-180-1551) बारे पुछो.',
    kok:  'नमस्कार! हाव SmartAgro किसान सहाय्यक. शेती, उदकाची वेवस्था, ॲप मार्गदर्शन आणि हेल्पलाइन (1800-180-1551) बद्दल विचार.',
    mni:  'ꯀꯨꯝꯖꯥ! ꯑꯩ SmartAgro ꯀꯤꯁꯥꯟ ꯃꯇꯦꯡ ꯄꯥꯡꯕꯥ ꯅꯤ। ꯂꯧꯕꯨꯀ, ꯏꯁꯤꯡ ꯃꯇꯦꯡ, ꯑꯦꯞ ꯒꯥꯏꯗ ꯑꯃꯁꯨꯡ ꯍꯦꯜꯄꯂꯥꯏꯟ (1800-180-1551) ꯍꯪꯕꯤꯌꯨ꯫',
    bodo: 'नमस्कार! आं SmartAgro किसान हेल्पार। सिथिल, दै सिनायनाय, एप होनाय आरो हेल्पलाइन (1800-180-1551) बारै सोंग।',
    doi:  'नमस्ते! मैं SmartAgro किसान सहायक आं। खेती, सिंचाई, ऐप इस्तेमाल ते हेल्पलाइन (1800-180-1551) बारै पुच्छो।',
    sa:   'नमस्ते! अहं SmartAgro कृषकसहायकः अस्मि। कृषि, सेचनव्यवस्था, ॲप-उपयोगः सरकारीयोजनाः च हेल्पलाइन (1800-180-1551) विषये पृच्छन्तु।',
  };

  /* ── Helpers ──────────────────────────────────────────────────────── */
  function getAppLang() {
    return chosenLang || localStorage.getItem('agrosmart_lang') || 'en';
  }

  window.callKisanHelpline = function (e) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
                     ('ontouchstart' in window);

    if (isMobile) {
      // Mobile: trigger phone keypad / call log with 1800-180-1551 pre-filled
      showKisanToast('📞 Opening Phone Dialer: 1800-180-1551...', 'success', 3500);
      return true; // allow tel:18001801551 to execute
    } else {
      // Desktop: prevent tel: link and redirect to official Govt Kisan Helpline portal
      if (e && e.preventDefault) e.preventDefault();
      showKisanToast('🌐 Opening Kisan Call Center Portal (1800-180-1551)...', 'success', 4000);
      window.open('https://www.manage.gov.in/kcc/kcc.asp', '_blank');
      return false;
    }
  };

  function loadVoices() {
    availableVoices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  }
  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function getBestVoice(langCode) {
    const speechLang = VOICE_LANGS[langCode] || 'en-IN';
    const langPrefix = speechLang.split('-')[0];
    let voice = availableVoices.find(v => v.lang === speechLang);
    if (!voice) voice = availableVoices.find(v => v.lang.startsWith(langPrefix));
    if (!voice && langCode !== 'en') voice = availableVoices.find(v => v.lang === 'en-IN');
    if (!voice) voice = availableVoices.find(v => v.lang.startsWith('en'));
    return voice || null;
  }

  function cleanTextForSpeech(text) {
    return text
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[\u{2600}-\u{27FF}]/gu, '')
      .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
      .replace(/[🌾🌿🌽🍅🎋🫘🌻🧅🥔🌶️🥜☁️🌧️⛅☀️❄️⛈️🌦️🌤️🌫️]/g, '')
      .replace(/•/g, '')
      .replace(/[►▶→←↑↓]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function showKisanToast(msg, type, duration) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type || 'warning', duration || 3000);
      return;
    }
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom,0px));' +
      'transform:translateX(-50%);background:#1a2a1c;color:#e8f5e9;border:1px solid rgba(74,222,128,.3);' +
      'padding:9px 16px;border-radius:20px;font-size:.78rem;z-index:10000;max-width:86vw;text-align:center;' +
      'box-shadow:0 4px 20px rgba(0,0,0,.4);';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration || 3000);
  }

  function getTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function updateHelplineVisibility() {
    const btn = document.getElementById('kisanHelpline');
    if (!btn) return;
    const path = window.location.pathname;
    const isDashboard = path === '/' || path === '/index.html' || path === '' || path.endsWith('/index.html');
    if (isDashboard && !isOpen) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  }

  /* ── Toggle ───────────────────────────────────────────────────────── */
  window.toggleKisan = function () {
    isOpen = !isOpen;
    const overlay = document.getElementById('kisanOverlay');
    const fab     = document.getElementById('kisanToggleBtn');
    if (!overlay) return;

    if (isOpen) {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      fab.innerHTML = '<i class="fas fa-times"></i><span class="kw-pulse"></span>';
      fab.classList.add('chat-open');
      setTimeout(() => overlay.classList.add('open'), 10);
      if (chatHistory.length === 0 && !langChosen) showLangPicker();
      setTimeout(() => {
        const inp = document.getElementById('kisanInput');
        if (inp) inp.focus();
      }, 350);
    } else {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      fab.innerHTML = '<i class="fas fa-microphone"></i><span class="kw-pulse"></span>';
      fab.classList.remove('chat-open');
      setTimeout(() => { overlay.style.display = 'none'; }, 280);
      stopSpeaking();
      if (activeTyper) activeTyper.finish();
      if (isListening) stopKisanMic();
    }
    updateHelplineVisibility();
  };

  /* ── Language Picker ──────────────────────────────────────────────── */
  function showLangPicker() {
    const picker   = document.getElementById('kisanLangPicker');
    const grid     = document.getElementById('kisanLangGrid');
    const skip     = document.getElementById('kisanLangSkip');
    const msgs     = document.getElementById('kisanMessages');
    const inputBar = document.querySelector('.kw-input-bar');
    if (!picker || !grid) return;

    if (msgs) msgs.style.display = 'none';
    if (inputBar) inputBar.style.display = 'none';

    grid.innerHTML = '';
    Object.entries(LANG_NAMES).forEach(([code, nativeName]) => {
      const btn = document.createElement('div');
      btn.className = 'kw-lang-opt';
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      btn.innerHTML = `<span>${nativeName}</span><span class="kl-sub">${LANG_ROMAN[code] || code}</span>`;
      btn.addEventListener('click', () => pickLang(code));
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickLang(code); }
      });
      grid.appendChild(btn);
    });

    const savedLang = localStorage.getItem('agrosmart_lang') || 'en';
    if (skip) {
      skip.textContent = 'Skip — Continue in ' + (LANG_ROMAN[savedLang] || 'English');
      skip.onclick = () => pickLang(savedLang);
    }

    const searchInp = document.getElementById('kisanLangSearch');
    if (searchInp) {
      searchInp.value = '';
      window.filterKisanLangs('');
    }

    picker.style.display = 'flex';
  }

  window.filterKisanLangs = function (query) {
    const q = (query || '').toLowerCase().trim();
    const opts = document.querySelectorAll('.kw-lang-opt');
    opts.forEach(opt => {
      const text = opt.textContent.toLowerCase();
      opt.style.display = text.includes(q) ? 'flex' : 'none';
    });
  };

  function pickLang(code) {
    chosenLang = code;
    langChosen = true;
    localStorage.setItem('agrosmart_lang', code);
    localStorage.setItem('smartagro_lang', code);

    if (typeof window.changeAppLanguage === 'function') {
      window.changeAppLanguage(code);
    }

    const picker   = document.getElementById('kisanLangPicker');
    const msgs     = document.getElementById('kisanMessages');
    const inputBar = document.querySelector('.kw-input-bar');

    if (picker) picker.style.display = 'none';
    if (msgs) msgs.style.display = 'flex';
    if (inputBar) inputBar.style.display = 'flex';

    updateSubLabel(code);
    if (chatHistory.length === 0) {
      addBotMsg(GREETINGS[code] || GREETINGS.en);
    }
  }

  function updateSubLabel(lang) {
    const el = document.getElementById('kisanLangLabel');
    if (el) el.textContent = 'Answering in ' + (LANG_ROMAN[lang] || lang.toUpperCase());
  }

  /* ── Messages ─────────────────────────────────────────────────────── */
  function formatMsgText(text) {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert markdown bold **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert Markdown links [Label](/path) into styled app links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      let icon = 'fa-compass';
      if (url.includes('diagnose')) icon = 'fa-microscope';
      else if (url.includes('market')) icon = 'fa-chart-line';
      else if (url.includes('alerts')) icon = 'fa-bell';
      else if (url === '/' || url.includes('dashboard')) icon = 'fa-th-large';
      return `<a href="${url}" class="kw-app-link"><i class="fas ${icon}"></i> ${label}</a>`;
    });

    // Convert bare paths /diagnose, /market, /alerts into app buttons if not inside link
    html = html.replace(/(^|\s)(\/(?:diagnose|market|alerts))(\b)/g, '$1<a href="$2" class="kw-app-link"><i class="fas fa-arrow-right"></i> $2</a>$3');

    // Convert newlines -> <br>
    html = html.replace(/\n/g, '<br>');

    // Convert bullet points •
    html = html.replace(/•/g, '<span style="color:#4ade80;margin-right:4px;font-weight:700">•</span>');

    return html;
  }

  function addBotMsg(text) {
    const list = document.getElementById('kisanMessages');
    if (!list) return;
    const id  = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    const div = document.createElement('div');
    div.className    = 'kw-msg bot';
    div.id           = id;
    div.dataset.text = text;

    div.innerHTML = `
      <div class="kw-msg-avatar">🌾</div>
      <div class="kw-msg-body">
        <div class="kw-bubble" id="bubble_${id}"></div>
        <div class="kw-msg-footer">
          <button class="kw-speak-btn" id="speak_${id}" onclick="toggleSpeak('${id}')" title="Listen">
            <i class="fas fa-volume-up"></i>
          </button>
          <span class="kw-msg-time">${getTime()}</span>
        </div>
      </div>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;

    typeWriter(id, text);
    document.getElementById('bubble_' + id).addEventListener('click', () => {
      if (activeTyper) activeTyper.finish();
    });
  }

  /* ── Typewriter animation ────────────────────────────────────────── */
  function typeWriter(id, fullText) {
    const bubble = document.getElementById('bubble_' + id);
    const list   = document.getElementById('kisanMessages');
    if (!bubble) return;
    if (activeTyper) activeTyper.finish();

    let i = 0;
    const step = Math.max(1, Math.round(fullText.length / 90));

    const timer = setInterval(() => {
      i += step;
      if (i >= fullText.length) {
        bubble.innerHTML = formatMsgText(fullText);
        clearInterval(timer);
        activeTyper = null;
      } else {
        bubble.innerHTML = formatMsgText(fullText.slice(0, i)) + '<span class="kw-caret"></span>';
      }
      if (list) list.scrollTop = list.scrollHeight;
    }, 20);

    activeTyper = {
      finish() {
        clearInterval(timer);
        bubble.innerHTML = formatMsgText(fullText);
        activeTyper = null;
      }
    };
  }

  function addUserMsg(text) {
    const list = document.getElementById('kisanMessages');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'kw-msg user';
    div.innerHTML = `
      <div class="kw-msg-body">
        <div class="kw-bubble">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        <span class="kw-msg-time">${getTime()}</span>
      </div>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }

  function addTyping() {
    const list = document.getElementById('kisanMessages');
    if (!list) return null;
    const div = document.createElement('div');
    div.className = 'kw-msg bot typing-msg';
    div.innerHTML = `
      <div class="kw-msg-avatar">🌾</div>
      <div class="kw-msg-body">
        <div class="kw-bubble">
          <span class="kw-typing"><span></span><span></span><span></span></span>
        </div>
      </div>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
    return div;
  }

  /* ── Send message → /api/chat ─────────────────────────────────────── */
  window.sendKisanMessage = async function () {
    clearSpeechSilenceTimer();
    if (isListening) stopKisanMic();
    const input = document.getElementById('kisanInput');
    const msg   = input?.value.trim();
    if (!msg) return;
    input.value = '';

    if (!langChosen) {
      chosenLang = localStorage.getItem('agrosmart_lang') || 'en';
      langChosen = true;
      const picker = document.getElementById('kisanLangPicker');
      if (picker) picker.style.display = 'none';
      updateSubLabel(chosenLang);
    }

    addUserMsg(msg);
    chatHistory.push({ role: 'user', content: msg });

    const sendBtn = document.getElementById('kisanSendBtn');
    const micBtn  = document.getElementById('kisanMicBtn');
    if (sendBtn) sendBtn.disabled = true;
    if (micBtn)  micBtn.disabled  = true;

    const typing         = addTyping();
    const weatherContext = window.weatherData?.current || {};

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:        chatHistory.slice(-6),
          lang:            getAppLang(),
          weather_context: weatherContext,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (typing) typing.remove();

      if (!res.ok || data.error) {
        if (window.checkApiLimitError && (res.status === 429 || data.limit_reached)) {
          window.checkApiLimitError(res, data);
        }
        addBotMsg(data.error || 'Sorry, try again.');
      } else {
        const reply = data.reply || 'Sorry, try again.';
        addBotMsg(reply);
        chatHistory.push({ role: 'assistant', content: reply });
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
      }
    } catch {
      if (typing) typing.remove();
      addBotMsg('Connection error. Please try again.');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (micBtn)  micBtn.disabled  = false;
    }
  };

  /* ── Text to Speech ───────────────────────────────────────────────── */
  window.toggleSpeak = function (msgId) {
    const div = document.getElementById(msgId);
    const btn = document.getElementById('speak_' + msgId);
    if (!div || !btn) return;

    if (speakingMsgId === msgId) { stopSpeaking(); return; }
    stopSpeaking();
    if (activeTyper) activeTyper.finish();

    const rawText = div.dataset.text || '';
    const text    = cleanTextForSpeech(rawText);
    if (!text || !window.speechSynthesis) return;

    const lang       = getAppLang();
    const voice      = getBestVoice(lang);
    const speechLang = VOICE_LANGS[lang] || 'en-IN';

    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.lang   = speechLang;
    utterance.rate   = 0.88;
    utterance.pitch  = 1;
    if (voice) utterance.voice = voice;

    if (!voice && lang !== 'en') {
      showKisanToast(`No ${LANG_ROMAN[lang] || lang} voice on this device. Using available voice.`);
    }

    utterance.onstart = () => {
      speakingMsgId = msgId;
      btn.innerHTML = '<i class="fas fa-stop"></i>';
      btn.classList.add('speaking');
    };
    utterance.onend = utterance.onerror = () => {
      speakingMsgId = null;
      btn.innerHTML = '<i class="fas fa-volume-up"></i>';
      btn.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
  };

  function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (speakingMsgId) {
      const btn = document.getElementById('speak_' + speakingMsgId);
      if (btn) { btn.innerHTML = '<i class="fas fa-volume-up"></i>'; btn.classList.remove('speaking'); }
      speakingMsgId = null;
    }
  }

  /* ── Voice Input — live interim captions with 10s silence pause timeout ── */
  function clearSpeechSilenceTimer() {
    if (speechSilenceTimer) {
      clearTimeout(speechSilenceTimer);
      speechSilenceTimer = null;
    }
  }

  function startSpeechSilenceTimer() {
    clearSpeechSilenceTimer();
    speechSilenceTimer = setTimeout(() => {
      stopKisanMic();
      const inp = document.getElementById('kisanInput');
      if (inp && inp.value.trim()) {
        window.sendKisanMessage();
      }
    }, 10000);
  }

  function stopKisanMic() {
    clearSpeechSilenceTimer();
    isListening = false;
    updateMicState(false);
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
  }

  window.toggleKisanMic = function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showKisanToast('Voice not supported. Use Chrome browser.'); return; }
    if (isListening) {
      stopKisanMic();
      const inp = document.getElementById('kisanInput');
      if (inp && inp.value.trim()) window.sendKisanMessage();
      return;
    }
    if (!isOpen) window.toggleKisan();
    if (!langChosen) {
      chosenLang = localStorage.getItem('agrosmart_lang') || 'en';
      langChosen = true;
      const picker = document.getElementById('kisanLangPicker');
      if (picker) picker.style.display = 'none';
      updateSubLabel(chosenLang);
    }

    const speechLang = VOICE_LANGS[getAppLang()] || 'en-IN';
    const input = document.getElementById('kisanInput');
    if (input) input.value = '';

    recognition = new SR();
    recognition.lang            = speechLang;
    recognition.interimResults  = true;
    recognition.maxAlternatives = 1;
    recognition.continuous      = true;

    recognition.onstart = () => {
      isListening = true;
      updateMicState(true);
      showKisanToast('Listening... speak now');
    };

    recognition.onresult = e => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      const inp = document.getElementById('kisanInput');
      if (inp) inp.value = transcript;

      if (transcript.trim()) {
        startSpeechSilenceTimer();
      }
    };

    recognition.onerror = e => {
      if (e.error === 'no-speech') return;
      clearSpeechSilenceTimer();
      isListening = false;
      updateMicState(false);
      if (e.error === 'not-allowed') showKisanToast('Mic access denied.');
      else showKisanToast('Voice error. Try again.');
    };

    recognition.onend = () => {
      if (isListening && speechSilenceTimer) {
        try {
          recognition.start();
          return;
        } catch (err) {}
      }
      updateMicState(false);
    };

    try { recognition.start(); } catch { showKisanToast('Could not start mic.'); }
  };

  function updateMicState(listening) {
    const micBtn = document.getElementById('kisanMicBtn');
    const fab    = document.getElementById('kisanToggleBtn');
    if (micBtn) {
      micBtn.classList.toggle('recording', listening);
      micBtn.innerHTML = listening ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-microphone"></i>';
    }
    if (fab && !isOpen) {
      fab.classList.toggle('listening', listening);
      fab.innerHTML = (listening ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-microphone"></i>') +
                      '<span class="kw-pulse"></span>';
    }
  }

  /* ── New Chat ─────────────────────────────────────────────────────── */
  window.newKisanChat = function () {
    stopSpeaking();
    if (activeTyper) activeTyper.finish();
    if (isListening) recognition?.stop();
    chatHistory = [];
    langChosen  = false;
    chosenLang  = null;
    const list = document.getElementById('kisanMessages');
    if (list) list.innerHTML = '';
    showLangPicker();
  };

  /* ── Initial Helpline Visibility ─────────────────────────────────── */
  updateHelplineVisibility();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateHelplineVisibility);
  }

  /* ── Backward-compatible global aliases (from chatbot.js) ─────────── */
  window.toggleChat   = window.toggleKisan;
  window.closeChat    = () => { if (isOpen) window.toggleKisan(); };
  window.clearChat    = window.newKisanChat;
  window.startVoice   = window.toggleKisanMic;
  window.sendMessage  = window.sendKisanMessage;
  window.handleChatKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendKisanMessage(); }
  };

})();
