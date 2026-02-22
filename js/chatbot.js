/**
 * chatbot.js – Agricultural Expert AI Chatbot
 * Powered by OpenAI GPT API
 * Context-aware: reads live sensor data from SoilSense localStorage
 */

(function () {
    'use strict';

    /* ── Constants ─────────────────────────────────────────── */
    const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
    const MODEL = 'gpt-3.5-turbo';
    const KEY_STORE = 'soilsense_openai_key';
    const DEMO_MODE = 'soilsense_demo_mode';
    const MAX_HIST = 18; // max messages to keep in context

    /* ── Demo Responses (offline fallback) ─────────────────── */
    const DEMO_RESPONSES = [
        (q) => q.toLowerCase().includes('tomato') ?
            `**Growing Tomatoes – Best Practices 🍅**\n\nTomatoes thrive with these care steps:\n\n• **Sunlight:** 6–8 hours of direct sun daily\n• **Soil pH:** Keep between 5.8–7.0 (slightly acidic)\n• **Watering:** Deep watering 2–3 times per week. Avoid wetting leaves\n• **Fertilizer:** Apply balanced NPK (10-10-10) monthly; switch to low-N formula after flowering\n• **Support:** Use stakes or cages when plants reach 30cm tall\n• **Pest Watch:** Check regularly for *aphids*, *whiteflies*, and *hornworms*\n\n💡 **Tip:** Pinch off suckers (small shoots between stem and branch) to improve fruit yield!` : null,

        (q) => q.toLowerCase().includes('aphid') || q.toLowerCase().includes('pest') ?
            `**Aphid Identification & Treatment 🐛**\n\n**How to identify aphids:**\n• Tiny soft-bodied insects (green, yellow, black, or white)\n• Found in clusters under leaves and on new stems\n• Leaves may curl, yellow, or look sticky (honeydew residue)\n\n**Organic treatments:**\n• **Neem oil spray** – Mix 2ml/L water, spray every 7 days\n• **Soap spray** – 5ml dish soap per liter, spray undersides of leaves\n• **Ladybugs** – Natural predators, encourage in the garden\n\n**Chemical treatments (if severe):**\n• Apply *imidacloprid* or *pyrethrin*-based insecticide\n• Rotate chemicals to prevent resistance\n\n💡 **Prevention:** Avoid over-fertilizing with nitrogen — aphids love lush, soft new growth!` : null,

        (q) => (q.toLowerCase().includes('season') || q.toLowerCase().includes('plant') || q.toLowerCase().includes('month')) ?
            `**Seasonal Planting Guide for India 🌾**\n\n**Kharif Season (June–November) – Monsoon Crops:**\n• Rice, Maize, Cotton, Soybean, Groundnut\n• Requires 700–1200mm rainfall\n\n**Rabi Season (November–April) – Winter Crops:**\n• Wheat, Mustard, Gram, Potato, Peas\n• Requires cool temperatures (10–25°C)\n\n**Zaid Season (March–June) – Summer Crops:**\n• Watermelon, Cucumber, Pumpkin, Sunflower\n• Requires high temperatures and irrigation\n\n💡 **Current month (February):** Ideal for harvesting Rabi crops and preparing fields for Zaid planting!` : null,

        (q) => q.toLowerCase().includes('ph') || q.toLowerCase().includes('acidic') || q.toLowerCase().includes('alkaline') ?
            `**Soil pH Management 🧪**\n\n**What is soil pH?**\nSoil pH measures how acidic or alkaline your soil is on a scale of 0–14. Most crops prefer 6–7 (slightly acidic to neutral).\n\n**If soil is too acidic (pH < 6):**\n• Apply *agricultural lime* (calcium carbonate) – 1–2 tons/hectare\n• Use *wood ash* as an organic alternative\n• Wait 2–4 weeks before re-testing\n\n**If soil is too alkaline (pH > 7.5):**\n• Apply *elemental sulfur* – 200–500kg/hectare\n• Use *acidic fertilizers* like ammonium sulfate\n• Incorporate organic matter (compost)\n\n💡 **Your SoilSense dashboard** shows live pH readings – check the Dashboard tab for your current soil pH!` : null,

        (q) => q.toLowerCase().includes('nitrogen') || q.toLowerCase().includes('npk') || q.toLowerCase().includes('fertili') ?
            `**NPK Fertilizer Guide 🌿**\n\n**N – Nitrogen:** Promotes leafy green growth\n• Deficiency signs: Yellow leaves, stunted growth\n• Sources: *Urea (46-0-0)*, Ammonium Nitrate, Compost\n• Apply: Before sowing & 30 days after germination\n\n**P – Phosphorus:** Strengthens roots and flowers\n• Deficiency signs: Purple-tinged leaves, poor root growth\n• Sources: *DAP (18-46-0)*, Superphosphate, Bone meal\n• Apply: Mix into soil before planting\n\n**K – Potassium:** Improves disease resistance and fruit quality\n• Deficiency signs: Brown leaf edges, dry tips\n• Sources: *MOP (0-0-60)*, Potassium sulfate\n• Apply: Split doses every 30 days\n\n💡 **SoilSense tip:** Your NPK sensor shows real-time levels — check Recommendations page for crop-specific fertilizer advice!` : null,

        (q) => q.toLowerCase().includes('moisture') || q.toLowerCase().includes('water') || q.toLowerCase().includes('irrig') ?
            `**Soil Moisture & Irrigation Guide 💧**\n\n**Ideal moisture levels by crop:**\n• *Rice:* 65–85% | *Wheat:* 45–65% | *Tomato:* 55–75%\n• *Cotton:* 40–65% | *Maize:* 50–75%\n\n**Irrigation methods:**\n• **Drip irrigation** – Most efficient (90%+ water use), best for vegetables\n• **Sprinkler irrigation** – Good for wheat and groundnuts\n• **Flood irrigation** – Traditional, used for rice\n\n**Signs of over-watering:**\n• Yellowing leaves, root rot, fungal growth\n\n**Signs of under-watering:**\n• Wilting, dry cracked soil, brown edges on leaves\n\n💡 **SoilSense auto-irrigation** activates the water pump when moisture drops below your crop's minimum threshold!` : null,

        (q) => q.toLowerCase().includes('disease') || q.toLowerCase().includes('fungal') || q.toLowerCase().includes('blight') ?
            `**Crop Disease Management 🔬**\n\n**Common fungal diseases:**\n• *Leaf blight* – Brown irregular patches. Apply mancozeb fungicide\n• *Powdery mildew* – White powdery coating. Apply sulfur-based spray\n• *Root rot* – Wilting in moist soil. Improve drainage + apply fungicide\n\n**Common bacterial diseases:**\n• *Bacterial wilt* – Sudden wilting. Remove infected plants immediately\n• *Leaf spot* – Small water-soaked lesions. Apply copper-based bactericide\n\n**Viral diseases:**\n• *Mosaic virus* – Mottled yellow/green leaves. No cure — remove plant\n• Transmitted by aphids and whiteflies — control insect vectors\n\n**Prevention tips:**\n• Crop rotation every season\n• Avoid working in wet fields (spreads disease)\n• Destroy infected plant debris\n• Use disease-resistant seed varieties` : null,

        (q) => q.toLowerCase().includes('rice') ?
            `**Rice Cultivation Guide 🌾**\n\n**Ideal conditions:**\n• Temperature: 20–38°C | pH: 5.5–7.0 | Moisture: 65–85%\n• Rainfall: 1000–2000mm (or irrigation equivalent)\n\n**Key stages:**\n1. *Nursery (0–25 days):* Sow seeds in wet seedbeds\n2. *Transplanting (25–30 days):* Move 20cm seedlings to main field\n3. *Vegetative (30–60 days):* Maintain 5cm standing water\n4. *Reproductive (60–90 days):* Reduce water, apply potassium\n5. *Ripening (90–120 days):* Drain field 2 weeks before harvest\n\n**Common pests:** Brown planthopper, Stem borer, Leaf folder\n**Common diseases:** Blast, Sheath blight, Bacterial leaf blight\n\n💡 **NPK for Rice:** Apply Urea (Nitrogen) in 3 splits: at transplanting, tillering, and panicle initiation` : null,

        (q) => q.toLowerCase().includes('wheat') ?
            `**Wheat Cultivation Guide 🌿**\n\n**Ideal conditions:**\n• Temperature: 12–28°C | pH: 6.0–7.5 | Moisture: 45–65%\n• Best sown in *November–December* (north India)\n\n**Fertilizer schedule:**\n• *Basal dose:* DAP 100kg/ha + MOP 50kg/ha before sowing\n• *1st top dressing (25–30 days):* Urea 75kg/ha\n• *2nd top dressing (50–60 days):* Urea 75kg/ha\n\n**Irrigation schedule:**\n1. Crown root initiation (20–25 days)\n2. Tillering (40–45 days)\n3. Jointing (60–65 days)\n4. Flowering (80–85 days)\n5. Grain filling (100–105 days)\n\n**Key diseases:** Yellow rust, Loose smut, Karnal bunt\n\n💡 **Harvest:** When grain moisture drops to 12–14%, typically March–April` : null,

        () => `**Hello! I'm AgroBot 🌱**\n\nI'm your agricultural expert assistant. I can help you with:\n\n• 🌱 **Crop growing tips** (tomato, rice, wheat, cotton, maize...)\n• 🐛 **Pest identification & treatment** (aphids, whiteflies, borers...)\n• 🧪 **Soil health** (pH, NPK, moisture management)\n• 💧 **Irrigation advice** based on your crop type\n• 🌤️ **Seasonal planting guidance**\n• 🔬 **Disease diagnosis & treatment**\n\nJust ask me anything about your farm! For example:\n*"What are the best practices for growing tomatoes?"*\n*"How do I treat aphids on my plants?"*\n*"What crops should I plant this month?"*`
    ];

    function getDemoResponse(question) {
        for (const fn of DEMO_RESPONSES) {
            const result = fn(question);
            if (result) return result;
        }
        return `**Great question! 🌾**\n\nI'm running in demo mode. Here are some popular topics I can help with:\n\n• **Type** "tomato" for tomato growing tips\n• **Type** "aphid" for pest management\n• **Type** "season" for seasonal planting guide\n• **Type** "ph" for soil pH management\n• **Type** "fertilizer" for NPK fertilizer guidance\n• **Type** "disease" for crop disease management\n• **Type** "irrigation" for watering advice\n\nTo unlock full AI responses, add your OpenAI API key using the ⚙️ settings button!`;
    }

    /* ── Sensor Context Builder ─────────────────────────────── */
    function buildSensorContext() {
        try {
            const history = JSON.parse(localStorage.getItem('soil_history') || '[]');
            const latest = history[history.length - 1];
            const crop = localStorage.getItem('soil_crop') || 'rice';
            if (!latest) return `The farmer is using the SoilSense system, currently monitoring ${crop} crop.`;
            return `The farmer's current LIVE SENSOR READINGS from their ESP32 soil monitoring system are:
- Crop: ${crop.charAt(0).toUpperCase() + crop.slice(1)}
- Soil Moisture: ${latest.moisture?.toFixed(1)}%
- pH Level: ${latest.ph?.toFixed(2)}
- Nitrogen (N): ${latest.n?.toFixed(1)} mg/kg
- Phosphorus (P): ${latest.p?.toFixed(1)} mg/kg
- Potassium (K): ${latest.k?.toFixed(1)} mg/kg
- Temperature: ${latest.temperature?.toFixed(1)}°C
- Humidity: ${latest.humidity?.toFixed(1)}%
- Water pump status: ${latest.pumpOn ? 'ON (irrigating)' : 'OFF'}
Use this real data in your answers when relevant.`;
        } catch {
            return 'The farmer is using the SoilSense soil monitoring system.';
        }
    }

    /* ── System Prompt ──────────────────────────────────────── */
    function buildSystemPrompt() {
        return `You are AgroBot, a friendly and knowledgeable agricultural expert assistant integrated into the SoilSense smart soil monitoring system. You have extensive expertise in:

- Botany, crop science, and agronomy
- Soil health: pH, NPK nutrients, moisture, and microbiology
- Pest management and integrated pest control (IPM)
- Crop diseases: fungal, bacterial, and viral
- Irrigation and water management
- Seasonal planting calendars (especially for Indian agriculture)
- Fertilizer management: organic and chemical
- Specific crops: Rice, Wheat, Tomato, Cotton, Maize, Soybean, and many more

PERSONALITY:
- Friendly, encouraging, and patient — like a trusted village agronomist
- Use simple, clear language. Avoid unnecessary jargon
- Give practical, actionable advice farmers can apply immediately
- Use emojis sparingly to make responses more engaging
- Format responses with **bold** for key terms and bullet points for lists

IMPORTANT RULES:
- Always give ACCURATE information based on established agricultural science
- When sensor data is available, reference it in your response (e.g., "Your current pH is 6.2, which is...")
- Keep responses concise but complete — avoid very long walls of text
- If you don't know something, say so and suggest consulting a local agronomist
- Focus on practical, low-cost solutions accessible to small farmers

CURRENT CONTEXT:
${buildSensorContext()}`;
    }

    /* ── State ──────────────────────────────────────────────── */
    let messages = []; // conversation history
    let isLoading = false;
    let apiKey = localStorage.getItem(KEY_STORE) || '';
    let demoMode = localStorage.getItem(DEMO_MODE) === 'true';
    let isOpen = false;

    /* ── Build HTML ─────────────────────────────────────────── */
    function buildWidget() {
        const widget = document.createElement('div');
        widget.id = 'chatbot-widget';
        widget.innerHTML = `
<!-- Toggle Button -->
<button id="chatbot-toggle" onclick="SoilBot.toggle()" aria-label="Open AgroBot assistant" title="Chat with AgroBot 🌱">
  🌿
  <div id="chatbot-unread">1</div>
</button>

<!-- Chat Panel -->
<div id="chatbot-panel" role="dialog" aria-label="AgroBot Agricultural Assistant">

  <!-- Header -->
  <div id="chatbot-header">
    <div class="chat-avatar">🌾</div>
    <div class="chat-header-info">
      <h4>AgroBot – Agri Assistant</h4>
      <p><span class="chat-online-dot"></span> Powered by AI · Always available</p>
    </div>
    <div class="chat-header-actions">
      <button class="chat-header-btn" onclick="SoilBot.showSettings()" title="API Key Settings">⚙️</button>
      <button class="chat-header-btn" onclick="SoilBot.clearChat()" title="Clear chat">🗑️</button>
      <button class="chat-header-btn" onclick="SoilBot.toggle()" title="Close">✕</button>
    </div>
  </div>

  <!-- Setup Screen (hidden by default) -->
  <div id="chatbot-setup" style="display:none">
    <h5>🔑 Connect OpenAI API</h5>
    <p>Enter your OpenAI API key to enable full AI-powered agricultural responses. Your key is stored locally in your browser only.</p>
    <input class="setup-input" id="chatbot-api-input" type="password"
      placeholder="sk-proj-..." autocomplete="off"/>
    <button class="setup-btn" onclick="SoilBot.saveKey()">✅ Save & Start Chatting</button>
    <div class="setup-note">
      Get a free API key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a> · Key never leaves your browser
    </div>
    <div style="margin:0.5rem 0;text-align:center;font-size:.75rem;color:#5a8c65">— or —</div>
    <button class="demo-mode-btn" onclick="SoilBot.enableDemo()">🌱 Use Demo Mode (no API key needed)</button>
    ${apiKey || demoMode ? '<button class="demo-mode-btn" style="margin-top:.4rem" onclick="SoilBot.hideSettings()">← Back to Chat</button>' : ''}
  </div>

  <!-- Context bar (sensor reading summary) -->
  <div id="chatbot-context-bar">
    🌡️ Live sensors: <span id="ctx-crop">-</span> · Moisture <span id="ctx-moisture">-</span> · pH <span id="ctx-ph">-</span> · Temp <span id="ctx-temp">-</span>°C
  </div>

  <!-- Quick topic chips -->
  <div id="chatbot-topics">
    <div class="topic-chip" onclick="SoilBot.quickAsk('How do I improve soil health?')">🌱 Soil Health</div>
    <div class="topic-chip" onclick="SoilBot.quickAsk('How to treat aphids on my plants?')">🐛 Pest Control</div>
    <div class="topic-chip" onclick="SoilBot.quickAsk('What crops should I plant this season?')">🌾 Seasonal Crops</div>
    <div class="topic-chip" onclick="SoilBot.quickAsk('How to fix low nitrogen in soil?')">🧪 Fertilizer Tips</div>
    <div class="topic-chip" onclick="SoilBot.quickAsk('How often should I water my crop?')">💧 Irrigation</div>
    <div class="topic-chip" onclick="SoilBot.quickAsk('What is the ideal pH for my crop?')">🧬 Soil pH</div>
  </div>

  <!-- Messages -->
  <div id="chatbot-messages"></div>

  <!-- Input Bar -->
  <div id="chatbot-input-bar">
    <textarea id="chatbot-input" placeholder="Ask anything about crops, soil, pests..." rows="1"
      onkeydown="SoilBot.onKey(event)" oninput="SoilBot.autoResize(this)"></textarea>
    <button id="chatbot-send" onclick="SoilBot.send()" title="Send">➤</button>
  </div>
</div>`;
        document.body.appendChild(widget);
    }

    /* ── UI Helpers ─────────────────────────────────────────── */
    function scrollToBottom() {
        const el = document.getElementById('chatbot-messages');
        if (el) el.scrollTop = el.scrollHeight;
    }

    function formatTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function parseMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^• (.+)$/gm, '<li>$1</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/<li>/g, '<ul><li>').replace(/<\/li>\n?/g, '</li></ul>')
            .replace(/<\/ul><ul>/g, '')
            .replace(/\n/g, '<br/>');
    }

    function appendMessage(role, text) {
        const container = document.getElementById('chatbot-messages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        const avatar = role === 'bot' ? '🌾' : '👨‍🌾';
        div.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div>
        <div class="msg-bubble">${parseMarkdown(text)}</div>
        <div class="msg-time">${formatTime()}</div>
      </div>`;
        container.appendChild(div);
        scrollToBottom();
    }

    function showTyping() {
        const container = document.getElementById('chatbot-messages');
        if (!container) return null;
        const el = document.createElement('div');
        el.className = 'chat-msg bot';
        el.id = 'typing-indicator';
        el.innerHTML = `
      <div class="msg-avatar">🌾</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>`;
        container.appendChild(el);
        scrollToBottom();
        return el;
    }

    function hideTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    function updateContextBar() {
        try {
            const hist = JSON.parse(localStorage.getItem('soil_history') || '[]');
            const latest = hist[hist.length - 1];
            const crop = localStorage.getItem('soil_crop') || 'rice';
            document.getElementById('ctx-crop').textContent = crop.charAt(0).toUpperCase() + crop.slice(1);
            if (latest) {
                document.getElementById('ctx-moisture').textContent = latest.moisture?.toFixed(0) + '%';
                document.getElementById('ctx-ph').textContent = latest.ph?.toFixed(1);
                document.getElementById('ctx-temp').textContent = latest.temperature?.toFixed(1);
            }
        } catch { }
    }

    /* ── API Call ───────────────────────────────────────────── */
    async function callOpenAI(userMessage) {
        if (demoMode) {
            await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
            return getDemoResponse(userMessage);
        }

        const payload = {
            model: MODEL,
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                ...messages.slice(-MAX_HIST),
                { role: 'user', content: userMessage }
            ],
            max_tokens: 600,
            temperature: 0.7,
        };

        const resp = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            if (resp.status === 401) throw new Error('Invalid API key. Please check your OpenAI API key in settings (⚙️).');
            if (resp.status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.');
            throw new Error(errData?.error?.message || 'OpenAI API error. Please try again.');
        }

        const data = await resp.json();
        return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    }

    /* ── Public API (window.SoilBot) ────────────────────────── */
    window.SoilBot = {

        toggle() {
            isOpen = !isOpen;
            const panel = document.getElementById('chatbot-panel');
            const btn = document.getElementById('chatbot-toggle');
            const unread = document.getElementById('chatbot-unread');
            panel.classList.toggle('open', isOpen);
            btn.classList.toggle('open', isOpen);
            btn.innerHTML = isOpen ? '✕<div id="chatbot-unread" style="display:none">1</div>' : '🌿<div id="chatbot-unread" style="display:none">1</div>';
            if (unread) unread.style.display = 'none';
            if (isOpen) {
                updateContextBar();
                // Show setup if no key and not demo
                if (!apiKey && !demoMode) {
                    this.showSettings();
                } else if (messages.length === 0) {
                    this.sendGreeting();
                }
                setTimeout(() => document.getElementById('chatbot-input')?.focus(), 320);
            }
        },

        showSettings() {
            document.getElementById('chatbot-setup').style.display = 'flex';
            document.getElementById('chatbot-messages').style.display = 'none';
            document.getElementById('chatbot-input-bar').style.display = 'none';
            document.getElementById('chatbot-topics').style.display = 'none';
            document.getElementById('chatbot-context-bar').style.display = 'none';
        },

        hideSettings() {
            document.getElementById('chatbot-setup').style.display = 'none';
            document.getElementById('chatbot-messages').style.display = 'flex';
            document.getElementById('chatbot-input-bar').style.display = 'flex';
            document.getElementById('chatbot-topics').style.display = 'flex';
            document.getElementById('chatbot-context-bar').style.display = 'flex';
            updateContextBar();
            if (messages.length === 0) this.sendGreeting();
        },

        saveKey() {
            const input = document.getElementById('chatbot-api-input').value.trim();
            if (!input.startsWith('sk-')) {
                alert('Please enter a valid OpenAI API key starting with "sk-"');
                return;
            }
            apiKey = input;
            demoMode = false;
            localStorage.setItem(KEY_STORE, apiKey);
            localStorage.removeItem(DEMO_MODE);
            this.hideSettings();
        },

        enableDemo() {
            demoMode = true;
            apiKey = '';
            localStorage.setItem(DEMO_MODE, 'true');
            localStorage.removeItem(KEY_STORE);
            this.hideSettings();
        },

        clearChat() {
            messages = [];
            const el = document.getElementById('chatbot-messages');
            if (el) el.innerHTML = '';
            this.sendGreeting();
        },

        sendGreeting() {
            const mode = demoMode ? ' *(Demo Mode – add API key in ⚙️ for full responses)*' : '';
            appendMessage('bot', `**Welcome to AgroBot! 🌾**${mode}\n\nI'm your personal agricultural expert. I can help you with:\n\n• 🌱 Crop growing tips & best practices\n• 🐛 Pest identification & organic treatment\n• 🧪 Soil health – pH, NPK, and moisture\n• 💧 Irrigation advice for your crop\n• 🌤️ Seasonal planting guidance\n• 🔬 Crop disease diagnosis\n\nYour current sensors are live – I can see your real soil data! What would you like to know?`);
        },

        async send() {
            const input = document.getElementById('chatbot-input');
            const text = input.value.trim();
            if (!text || isLoading) return;

            input.value = '';
            input.style.height = 'auto';

            appendMessage('user', text);
            messages.push({ role: 'user', content: text });

            isLoading = true;
            document.getElementById('chatbot-send').disabled = true;
            const typing = showTyping();

            try {
                const reply = await callOpenAI(text);
                hideTyping();
                appendMessage('bot', reply);
                messages.push({ role: 'assistant', content: reply });
            } catch (err) {
                hideTyping();
                appendMessage('bot', `⚠️ **Error:** ${err.message}`);
            } finally {
                isLoading = false;
                document.getElementById('chatbot-send').disabled = false;
                input.focus();
            }
        },

        quickAsk(q) {
            const input = document.getElementById('chatbot-input');
            if (input) {
                input.value = q;
                this.send();
            }
        },

        onKey(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        },

        autoResize(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 100) + 'px';
        },
    };

    /* ── Init ───────────────────────────────────────────────── */
    function init() {
        buildWidget();
        // Show unread badge after 3s to attract attention
        setTimeout(() => {
            if (!isOpen) {
                const badge = document.getElementById('chatbot-unread');
                if (badge) badge.style.display = 'flex';
            }
        }, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
