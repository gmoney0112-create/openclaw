/**
 * Soul Prosperity Chat Widget
 * Embed with: <script src="soul-prosperity-chat.js" data-gateway="https://YOUR_GATEWAY_URL"></script>
 */
(function () {
  "use strict";

  const script = document.currentScript;
  const gatewayUrl = (script && script.getAttribute("data-gateway")) || "";
  const ENDPOINT = gatewayUrl.replace(/\/$/, "") + "/plugins/soul-prosperity/chat";

  // Generate or restore a session ID
  function getSessionId() {
    const key = "sp_session_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);
      sessionStorage.setItem(key, id);
    }
    return id;
  }

  const SESSION_ID = getSessionId();

  // Styles
  const CSS = `
    #sp-chat-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: #fff; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(124,58,237,.45);
      font-size: 24px; display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    #sp-chat-btn:hover { transform: scale(1.08); }
    #sp-chat-panel {
      position: fixed; bottom: 90px; right: 24px; z-index: 9999;
      width: 360px; max-height: 520px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
    }
    #sp-chat-panel.sp-hidden { display: none; }
    #sp-chat-header {
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: #fff; padding: 14px 16px;
      font-weight: 600; font-size: 15px;
      display: flex; align-items: center; gap: 10px;
    }
    #sp-chat-header span { flex: 1; }
    #sp-chat-close {
      background: none; border: none; color: #fff;
      font-size: 20px; cursor: pointer; line-height: 1; padding: 0;
    }
    #sp-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .sp-msg { max-width: 85%; line-height: 1.45; }
    .sp-msg.sp-user {
      align-self: flex-end;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      color: #fff; border-radius: 16px 16px 4px 16px;
      padding: 10px 14px;
    }
    .sp-msg.sp-bot {
      align-self: flex-start;
      background: #f3f4f6; color: #111;
      border-radius: 16px 16px 16px 4px;
      padding: 10px 14px;
    }
    .sp-offer-card {
      align-self: flex-start;
      background: #faf5ff; border: 1px solid #d8b4fe;
      border-radius: 12px; padding: 12px 14px;
      max-width: 90%;
    }
    .sp-offer-card strong { display: block; color: #7c3aed; margin-bottom: 4px; }
    .sp-offer-card .sp-price { font-size: 13px; color: #555; margin-bottom: 8px; }
    .sp-offer-card a {
      display: inline-block; background: #7c3aed; color: #fff;
      border-radius: 8px; padding: 7px 14px; text-decoration: none;
      font-size: 13px; font-weight: 600;
    }
    .sp-offer-card a:hover { background: #6d28d9; }
    #sp-chat-input-row {
      padding: 10px 12px; border-top: 1px solid #e5e7eb;
      display: flex; gap: 8px;
    }
    #sp-chat-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 10px;
      padding: 8px 12px; font-size: 14px; outline: none;
      resize: none; line-height: 1.4; max-height: 80px;
    }
    #sp-chat-input:focus { border-color: #a855f7; }
    #sp-chat-send {
      background: #7c3aed; color: #fff; border: none;
      border-radius: 10px; padding: 8px 14px;
      cursor: pointer; font-size: 20px; line-height: 1;
      align-self: flex-end;
    }
    #sp-chat-send:disabled { background: #c4b5fd; cursor: default; }
    .sp-typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
    .sp-typing span {
      width: 7px; height: 7px; background: #9ca3af; border-radius: 50%;
      animation: sp-bounce .9s infinite;
    }
    .sp-typing span:nth-child(2) { animation-delay: .15s; }
    .sp-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes sp-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }
    @media (max-width: 420px) {
      #sp-chat-panel { width: calc(100vw - 32px); right: 16px; bottom: 80px; }
    }
  `;

  function injectStyles() {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  function buildUI() {
    // Toggle button
    const btn = document.createElement("button");
    btn.id = "sp-chat-btn";
    btn.title = "Chat with us";
    btn.innerHTML = "💬";

    // Panel
    const panel = document.createElement("div");
    panel.id = "sp-chat-panel";
    panel.classList.add("sp-hidden");
    panel.innerHTML = `
      <div id="sp-chat-header">
        <span>✨ Soul Prosperity Guide</span>
        <button id="sp-chat-close" aria-label="Close">×</button>
      </div>
      <div id="sp-chat-messages"></div>
      <div id="sp-chat-input-row">
        <textarea id="sp-chat-input" rows="1" placeholder="Ask anything…" aria-label="Message"></textarea>
        <button id="sp-chat-send" aria-label="Send">➤</button>
      </div>
    `;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    return {
      btn,
      panel,
      messages: panel.querySelector("#sp-chat-messages"),
      input: panel.querySelector("#sp-chat-input"),
      send: panel.querySelector("#sp-chat-send"),
      close: panel.querySelector("#sp-chat-close"),
    };
  }

  function addBotMessage(messages, text) {
    const el = document.createElement("div");
    el.className = "sp-msg sp-bot";
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function addUserMessage(messages, text) {
    const el = document.createElement("div");
    el.className = "sp-msg sp-user";
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function addOfferCard(messages, offer) {
    if (!offer || !offer.name) return;
    const el = document.createElement("div");
    el.className = "sp-offer-card";
    const linkHtml = offer.url
      ? `<a href="${escapeHtml(offer.url)}" target="_blank" rel="noopener">Get it now →</a>`
      : "";
    el.innerHTML = `
      <strong>${escapeHtml(offer.name)}</strong>
      <div class="sp-price">${escapeHtml(offer.priceDisplay)}</div>
      ${linkHtml}
    `;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping(messages) {
    const el = document.createElement("div");
    el.className = "sp-msg sp-bot sp-typing-wrap";
    el.innerHTML = `<div class="sp-typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function sendMessage(text, ui) {
    if (!text.trim()) return;
    ui.input.value = "";
    ui.send.disabled = true;
    addUserMessage(ui.messages, text);
    const typing = showTyping(ui.messages);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: SESSION_ID, message: text }),
      });
      typing.remove();
      if (!res.ok) {
        addBotMessage(ui.messages, "Something went wrong. Please try again in a moment.");
        return;
      }
      const data = await res.json();
      if (data.ok) {
        addBotMessage(ui.messages, data.reply);
        if (data.offer) {
          addOfferCard(ui.messages, data.offer);
        }
      } else {
        addBotMessage(ui.messages, "Something went wrong. Please try again.");
      }
    } catch {
      typing.remove();
      addBotMessage(ui.messages, "Unable to connect. Please check your internet connection.");
    } finally {
      ui.send.disabled = false;
      ui.input.focus();
    }
  }

  function init() {
    injectStyles();
    const ui = buildUI();
    let opened = false;

    ui.btn.addEventListener("click", () => {
      ui.panel.classList.toggle("sp-hidden");
      if (!ui.panel.classList.contains("sp-hidden")) {
        ui.input.focus();
        if (!opened) {
          opened = true;
          // Trigger a greeting from the bot
          const typing = showTyping(ui.messages);
          fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: SESSION_ID, message: "hello" }),
          })
            .then((r) => r.json())
            .then((data) => {
              typing.remove();
              if (data.ok) addBotMessage(ui.messages, data.reply);
            })
            .catch(() => {
              typing.remove();
              addBotMessage(ui.messages, "Welcome! How can I help you today?");
            });
        }
      }
    });

    ui.close.addEventListener("click", () => {
      ui.panel.classList.add("sp-hidden");
    });

    ui.send.addEventListener("click", () => {
      sendMessage(ui.input.value, ui);
    });

    ui.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(ui.input.value, ui);
      }
    });

    // Auto-resize textarea
    ui.input.addEventListener("input", () => {
      ui.input.style.height = "auto";
      ui.input.style.height = Math.min(ui.input.scrollHeight, 80) + "px";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
