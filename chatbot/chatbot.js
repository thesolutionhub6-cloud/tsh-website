/* ===== TSH AI Chatbot Widget ===== */
(function () {
  const API_URL = "https://tsh-chatbot-api.onrender.com/api/chat";
  let chatOpen = false;
  let messages = []; // { role: 'user'|'assistant', content: '' }
  let sending = false;

  /* --- Inject HTML --- */
  const wrapper = document.createElement("div");
  wrapper.id = "tshChatbot";
  wrapper.innerHTML = `
    <button class="chatbot-bubble" id="cbBubble" aria-label="Open chat">
      <img class="cb-icon-chat cb-logo-img" src="/images/logo.svg" alt="TSH">
      <svg class="cb-icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>
    <div class="chatbot-panel" id="cbPanel">
      <div class="cb-header">
        <div class="cb-header-avatar">&#129302;</div>
        <div class="cb-header-info">
          <div class="cb-header-name">TSH Assistant</div>
          <div class="cb-header-status">Online</div>
        </div>
        <button class="cb-header-close" id="cbClose" aria-label="Close chat">
          <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>
      <div class="cb-messages" id="cbMessages"></div>
      <div class="cb-quick-replies" id="cbQuickReplies"></div>
      <div class="cb-input-area">
        <input class="cb-input" id="cbInput" type="text" placeholder="Ask about immigration..." autocomplete="off">
        <button class="cb-send" id="cbSend" aria-label="Send message">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="cb-powered">Powered by <a href="https://thesolutionhub.ca" target="_blank">TSH</a> + Claude AI</div>
    </div>
  `;
  document.body.appendChild(wrapper);

  const bubble = document.getElementById("cbBubble");
  const panel = document.getElementById("cbPanel");
  const msgContainer = document.getElementById("cbMessages");
  const input = document.getElementById("cbInput");
  const sendBtn = document.getElementById("cbSend");
  const closeBtn = document.getElementById("cbClose");
  const quickReplies = document.getElementById("cbQuickReplies");

  /* --- Shift WhatsApp button --- */
  const waBtn = document.querySelector(".whatsapp-float");
  if (waBtn) waBtn.classList.add("cb-shifted");

  /* --- Toggle Chat --- */
  function toggleChat() {
    chatOpen = !chatOpen;
    bubble.classList.toggle("open", chatOpen);
    panel.classList.toggle("open", chatOpen);
    if (chatOpen) {
      if (messages.length === 0) showGreeting();
      else renderMessages();
      input.focus();
    }
  }

  bubble.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", toggleChat);

  /* --- Greeting --- */
  function showGreeting() {
    const greeting =
      "Hi there! I'm the TSH Assistant. I can help you with:\n\n" +
      "- **Canadian immigration pathways** (Express Entry, PNPs, AIP)\n" +
      "- **Eligibility & requirements**\n" +
      "- **Fees & timelines**\n" +
      "- **TSH services & booking**\n\n" +
      "What would you like to know?";
    messages.push({ role: "assistant", content: greeting });
    renderMessages();
    showQuickReplies([
      "What pathways do you offer?",
      "Am I eligible for Express Entry?",
      "How much does it cost?",
      "Book a free assessment",
    ]);
  }

  /* --- Quick Replies --- */
  function showQuickReplies(options) {
    quickReplies.innerHTML = "";
    options.forEach((text) => {
      const btn = document.createElement("button");
      btn.className = "cb-quick-btn";
      btn.textContent = text;
      btn.addEventListener("click", () => {
        quickReplies.innerHTML = "";
        sendMessage(text);
      });
      quickReplies.appendChild(btn);
    });
  }

  function clearQuickReplies() {
    quickReplies.innerHTML = "";
  }

  /* --- Render Messages --- */
  function renderMessages() {
    msgContainer.innerHTML = "";
    messages.forEach((msg) => {
      const div = document.createElement("div");
      div.className = "cb-msg " + (msg.role === "user" ? "cb-msg-user" : "cb-msg-bot");
      if (msg.role === "assistant") {
        div.innerHTML = formatMarkdown(msg.content);
      } else {
        div.textContent = msg.content;
      }
      msgContainer.appendChild(div);
    });
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  /* --- Format Markdown (simple) --- */
  function formatMarkdown(text) {
    // Escape HTML but preserve unicode chars (no entity escaping needed)
    let h = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // Markdown formatting
    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(_, text, url) {
        if (/^https?:\/\//i.test(url)) {
          return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
        }
        return text + ' (' + url + ')';
      });
    // Lists: collect consecutive lines starting with "- "
    h = h.replace(/^- (.+)$/gm, "<li>$1</li>");
    h = h.replace(/((?:<li>.*?<\/li>\s*)+)/g, "<ul>$1</ul>");
    // Paragraphs and line breaks
    h = h.replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");
    return "<p>" + h + "</p>";
  }

  /* --- Show Typing --- */
  function showTyping() {
    const div = document.createElement("div");
    div.className = "cb-typing";
    div.id = "cbTyping";
    div.innerHTML = "<span></span><span></span><span></span>";
    msgContainer.appendChild(div);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById("cbTyping");
    if (el) el.remove();
  }

  /* --- Send Message --- */
  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    sending = true;
    sendBtn.disabled = true;
    clearQuickReplies();

    messages.push({ role: "user", content: text.trim() });
    renderMessages();
    input.value = "";
    showTyping();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      removeTyping();

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Server error");
      }

      const data = await resp.json();
      messages.push({ role: "assistant", content: data.reply });
      renderMessages();

      // Show contextual quick replies after first few exchanges
      if (messages.filter((m) => m.role === "user").length === 1) {
        showQuickReplies([
          "Tell me about Express Entry",
          "What are the fees?",
          "Book a consultation",
        ]);
      }
    } catch (err) {
      removeTyping();
      messages.push({
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting right now. You can reach us directly:\n\n" +
          "- **WhatsApp**: +1-437-427-2470\n" +
          "- **Email**: Info@thesolutionhub.ca\n" +
          "- **Book Free Assessment**: [Click here](https://calendly.com/thesolutionhub)",
      });
      renderMessages();
    }

    sending = false;
    sendBtn.disabled = false;
    input.focus();
  }

  /* --- Event Listeners --- */
  sendBtn.addEventListener("click", () => sendMessage(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  /* --- Restore from sessionStorage --- */
  try {
    const saved = sessionStorage.getItem("tsh_chat");
    if (saved) {
      messages = JSON.parse(saved);
    }
  } catch (e) {}

  /* --- Save on unload --- */
  window.addEventListener("beforeunload", () => {
    try {
      sessionStorage.setItem("tsh_chat", JSON.stringify(messages));
    } catch (e) {}
  });
})();
