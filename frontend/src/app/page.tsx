"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Message = { id: string; role: "user" | "assistant"; content: string; time: number; pending?: boolean };
type Conversation = { id: string; title: string; updatedAt: number; messages: Message[] };
const STORAGE_KEY = "xander-chat-conversations-v1";
const SESSION_KEY = "xander-chat-active-session";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<string, React.ReactNode> = {
    plus: <><path d="M12 5v14M5 12h14" /></>, search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    panel: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /></>,
    arrow: <><path d="M12 19V5m-6 6 6-6 6 6" /></>,
    send: <><path d="m21 3-7.2 18-3.8-7.8L2 9.5 21 3Z" /><path d="M10 13 21 3" /></>,
    stop: <><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>, sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  };
  return <svg {...common}>{paths[name] ?? paths.sparkle}</svg>;
}

function makeConversation(): Conversation {
  return { id: crypto.randomUUID(), title: "New conversation", updatedAt: Date.now(), messages: [] };
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [connection, setConnection] = useState<"checking" | "online" | "offline">("checking");
  const [shareCopied, setShareCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const active = conversations.find((item) => item.id === activeId);
  const messages = active?.messages ?? [];
  const visibleConversations = useMemo(() => conversations.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.updatedAt - a.updatedAt), [conversations, search]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let restored: Conversation[] = [];
      try { restored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Conversation[]; } catch { restored = []; }
      const requestedSession = new URLSearchParams(window.location.search).get("session");
      const session = requestedSession ?? localStorage.getItem(SESSION_KEY);
      if (session && !restored.some((item) => item.id === session)) restored.unshift({ id: session, title: "Shared conversation", updatedAt: Date.now(), messages: [] });
      if (restored.length) { setConversations(restored); setActiveId(session && restored.some((item) => item.id === session) ? session : restored[0].id); }
      else { const fresh = makeConversation(); setConversations([fresh]); setActiveId(fresh.id); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    void fetch(`/api/history?session_id=${encodeURIComponent(activeId)}`).then(async (response) => {
      if (!response.ok) throw new Error("History request failed");
      if (cancelled) return;
      setConnection("online");
      const raw = await response.text();
      let history: unknown;
      try { history = JSON.parse(raw); } catch { return; }
      const rows = Array.isArray(history) ? history : history && typeof history === "object" && "messages" in history && Array.isArray((history as { messages: unknown }).messages) ? (history as { messages: unknown[] }).messages : [];
      const restoredMessages: Message[] = rows.flatMap((row) => {
        if (!row || typeof row !== "object") return [];
        const item = row as Record<string, unknown>;
        const content = item.content ?? item.message ?? item.text;
        if (typeof content !== "string") return [];
        const role = ["user", "human"].includes(String(item.role ?? item.type).toLowerCase()) ? "user" : "assistant";
        return [{ id: typeof item.id === "string" ? item.id : crypto.randomUUID(), role, content, time: Date.now() }];
      });
      if (!cancelled && restoredMessages.length) setConversations((all) => all.map((item) => item.id === activeId && item.messages.length === 0 ? { ...item, title: restoredMessages[0].content.slice(0, 36), messages: restoredMessages, updatedAt: Date.now() } : item));
    }).catch(() => { if (!cancelled) setConnection("offline"); });
    return () => { cancelled = true; };
  }, [activeId]);

  useEffect(() => {
    function onShortcut(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); createConversation(); }
      if ((event.metaKey || event.ctrlKey) && event.key === "/") { event.preventDefault(); setSearchOpen(true); window.setTimeout(() => document.querySelector<HTMLInputElement>(".search-input")?.focus(), 0); }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!conversations.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    if (activeId) localStorage.setItem(SESSION_KEY, activeId);
  }, [conversations, activeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, isSending]);

  function createConversation() {
    const fresh = makeConversation(); setConversations((all) => [fresh, ...all]); setActiveId(fresh.id); setInput(""); setSidebarOpen(false); textareaRef.current?.focus();
  }

  async function sendMessage(event?: FormEvent, suggested?: string) {
    event?.preventDefault();
    const query = (suggested ?? input).trim();
    if (!query || isSending || !activeId) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: query, time: Date.now() };
    const conversation = conversations.find((item) => item.id === activeId);
    const title = conversation?.messages.length ? conversation.title : query.length > 36 ? `${query.slice(0, 36)}…` : query;
    setConversations((all) => all.map((item) => item.id === activeId ? { ...item, title, updatedAt: Date.now(), messages: [...item.messages, userMessage] } : item));
    setInput(""); setIsSending(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, session_id: activeId }) });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data === "object" && data && "detail" in data ? String((data as { detail: unknown }).detail) : `Request failed (${response.status})`);
      const assistantText = formatReply(data);
      appendAssistant(activeId, { id: crypto.randomUUID(), role: "assistant", content: assistantText, time: Date.now() });
      setConnection("online");
    } catch (error) {
      appendAssistant(activeId, { id: crypto.randomUUID(), role: "assistant", content: `I couldn’t reach the agent. ${error instanceof Error ? error.message : "Check that your FastAPI server is running."}`, time: Date.now() });
      setConnection("offline");
    } finally { setIsSending(false); textareaRef.current?.focus(); }
  }

  function appendAssistant(session: string, message: Message) {
    setConversations((all) => all.map((item) => item.id === session ? { ...item, updatedAt: Date.now(), messages: [...item.messages, message] } : item));
  }

  function selectPrompt(prompt: string) { void sendMessage(undefined, prompt); }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }
  async function copyMessage(message: Message) {
    await navigator.clipboard.writeText(message.content); setCopiedId(message.id); window.setTimeout(() => setCopiedId(""), 1600);
  }

  async function shareConversation() {
    if (!active) return;
    await navigator.clipboard.writeText(`${window.location.origin}/?session=${active.id}`);
    setShareCopied(true); window.setTimeout(() => setShareCopied(false), 1800);
  }

  return (
    <main className="app-shell">
      {sidebarOpen && <button className="mobile-scrim" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand" href="#" aria-label="Xander home" onClick={(event) => event.preventDefault()}>
            <span className="brand-mark"><Icon name="sparkle" size={19} /></span><span className="brand-name">xander<span className="brand-period">.</span></span>
          </a>
          <button className="icon-button sidebar-collapse" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><Icon name="panel" /></button>
        </div>
        <button className="new-chat-button" onClick={createConversation}><Icon name="plus" size={17} /><span>New chat</span><kbd>⌘ K</kbd></button>
        <div className="sidebar-tools">
          <button className="nav-item" onClick={() => { setSearchOpen((value) => !value); setSearch(""); }}><Icon name="search" size={17} /><span>Search chats</span><kbd>⌘ /</kbd></button>
          {searchOpen && <input className="search-input" autoFocus placeholder="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} />}
        </div>
        <div className="history-heading"><span>YOUR CHATS</span><button className="icon-button tiny" aria-label="New chat" onClick={createConversation}><Icon name="plus" size={15} /></button></div>
        <div className="conversation-list">
          {visibleConversations.length ? visibleConversations.map((item) => <button key={item.id} className={`conversation-item ${item.id === activeId ? "conversation-active" : ""}`} onClick={() => { setActiveId(item.id); setSidebarOpen(false); }}><span className="conversation-dot" /><span className="conversation-title">{item.title}</span><span className="conversation-more"><Icon name="more" size={16} /></span></button>) : <p className="empty-history">No conversations found</p>}
        </div>
        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <div className="workspace-card"><div className="workspace-icon">X</div><div className="workspace-copy"><strong>Xander workspace</strong><span>AI assistant</span></div></div>
          <div className="profile-row"><div className="avatar">X</div><div className="profile-copy"><strong>Xander</strong><span>AI assistant</span></div></div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button><span className="mobile-brand">xander<span className="brand-period">.</span></span><div className="model-label">Xander <span className="model-badge">AI</span></div></div>
          <div className="topbar-right"><div className={`connection-pill ${connection}`} role="status" aria-live="polite"><span className="connection-dot" />{connection === "online" ? "Connected" : connection === "checking" ? "Connecting" : "Offline"}</div><button className="share-button" onClick={() => void shareConversation()}><Icon name={shareCopied ? "check" : "arrow"} size={15} /> <span>{shareCopied ? "Copied" : "Share"}</span></button></div>
        </header>

        <div className={`chat-scroll ${messages.length ? "has-messages" : ""}`}>
          {messages.length === 0 ? <div className="welcome-wrap">
            <div className="welcome-orb"><span className="orb-core"><Icon name="sparkle" size={25} /></span><i className="orb-dot orb-dot-one" /><i className="orb-dot orb-dot-two" /><i className="orb-dot orb-dot-three" /></div>
            <p className="eyebrow"><span className="eyebrow-line" /> YOUR AI WORKSPACE <span className="eyebrow-line" /></p>
            <h1>What can we<br /><span className="heading-soft">work through?</span></h1>
            <p className="welcome-subtitle">What would you like to figure out today?</p>
            <div className="suggestion-grid">
              <button className="suggestion-card" onClick={() => selectPrompt("Help me research a topic and summarize the key findings.")}><span className="suggestion-icon green"><Icon name="search" size={17} /></span><span className="suggestion-label">Research something</span><span className="suggestion-hint">Find answers and explore ideas</span><span className="suggestion-arrow"><Icon name="chevron" size={16} /></span></button>
              <button className="suggestion-card" onClick={() => selectPrompt("Help me write a clear, polished first draft.")}><span className="suggestion-icon peach"><Icon name="arrow" size={17} /></span><span className="suggestion-label">Write a first draft</span><span className="suggestion-hint">Turn a rough idea into words</span><span className="suggestion-arrow"><Icon name="chevron" size={16} /></span></button>
              <button className="suggestion-card" onClick={() => selectPrompt("Help me plan a project with clear milestones and next steps.")}><span className="suggestion-icon mint"><Icon name="clock" size={17} /></span><span className="suggestion-label">Plan a project</span><span className="suggestion-hint">Make the next steps feel simple</span><span className="suggestion-arrow"><Icon name="chevron" size={16} /></span></button>
              <button className="suggestion-card" onClick={() => selectPrompt("Explain a complex topic in a simple, intuitive way.")}><span className="suggestion-icon blue"><Icon name="sparkle" size={17} /></span><span className="suggestion-label">Learn something new</span><span className="suggestion-hint">Get a clear, thoughtful explanation</span><span className="suggestion-arrow"><Icon name="chevron" size={16} /></span></button>
            </div>
          </div> : <div className="transcript">{messages.map((message) => <article key={message.id} className={`message message-${message.role}`}>
            {message.role === "assistant" ? <div className="assistant-avatar"><Icon name="sparkle" size={15} /></div> : <div className="user-avatar">MA</div>}
            <div className="message-body"><div className="message-meta"><span>{message.role === "assistant" ? "Xander" : "You"}</span><time>{new Date(message.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div><div className="message-content">{message.content}</div>{message.role === "assistant" && <div className="message-actions"><button onClick={() => void copyMessage(message)} aria-label="Copy response"><Icon name={copiedId === message.id ? "check" : "copy"} size={15} />{copiedId === message.id ? "Copied" : "Copy"}</button></div>}</div>
          </article>)}{isSending && <article className="message message-assistant"><div className="assistant-avatar"><Icon name="sparkle" size={15} /></div><div className="message-body"><div className="message-meta"><span>Xander</span></div><div className="thinking"><i /><i /><i /><span>Thinking through this</span></div></div></article>}<div ref={bottomRef} /></div>}
        </div>

        <div className="composer-area"><form className="composer" onSubmit={(event) => void sendMessage(event)}><textarea ref={textareaRef} value={input} onChange={(event) => { setInput(event.target.value); event.currentTarget.style.height = "auto"; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 170)}px`; }} onKeyDown={handleKeyDown} placeholder="Message Xander…" rows={1} aria-label="Message Xander" /><div className="composer-controls"><div className="composer-left"><span className="mode-button"><span className="mode-spark"><Icon name="sparkle" size={13} /></span> Auto</span></div><div className="composer-right"><span className="enter-hint">↵ <span>to send</span></span><button type="submit" className={`send-button ${input.trim() ? "send-ready" : ""}`} aria-label="Send message" disabled={!input.trim() || isSending}>{isSending ? <span className="send-spinner" /> : <Icon name="send" size={16} />}</button></div></div></form><p className="disclaimer">Xander can make mistakes. Check important information.</p></div>
      </section>
    </main>
  );
}

function formatReply(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["answer", "response", "output", "message", "content"]) if (typeof record[key] === "string") return record[key] as string;
    if (typeof record.query === "string") return "Your message reached the API. This route currently echoes the submitted query; once the LangGraph route returns an answer field, it will appear here.";
    return JSON.stringify(data, null, 2);
  }
  return "The agent returned an empty response.";
}
