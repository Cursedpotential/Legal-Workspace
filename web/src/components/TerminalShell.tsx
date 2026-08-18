"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import {
  SPLIT_MSG_SOURCE,
  SPLIT_PIN_KEY,
  SplitWorkspace,
  isSafePinPath,
} from "@/components/SplitWorkspace";
import { fetchAgnoStatus, legalApiBase } from "@/lib/api/client";
import {
  CASE_PHASE_KEY,
  CASE_PHASES,
  type CasePhase,
  type Surface,
  compareSurfacesByPhase,
  isCasePhase,
  isPhasePriority,
  navHelp,
  navLabel,
  pathForQuery,
  PHASE_COPY,
  surfaceForPath,
  surfacesForPhase,
} from "@/lib/surfaces";
import { captureLiveSurface, liveSurfaceKey } from "@/lib/liveSurface";
import { useSurfaceCatalog } from "@/lib/useSurfaceCatalog";

// Byline: Grok · grok-4.6 · 2026-08-18

function readEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("embed") === "1") return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function readStoredPin(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SPLIT_PIN_KEY);
    return isSafePinPath(raw) ? raw : null;
  } catch {
    return null;
  }
}

function persistPin(path: string | null) {
  try {
    if (path) window.sessionStorage.setItem(SPLIT_PIN_KEY, path);
    else window.sessionStorage.removeItem(SPLIT_PIN_KEY);
  } catch {
    /* private mode */
  }
}

function readStoredPhase(): CasePhase {
  if (typeof window === "undefined") return "Discovery";
  try {
    const raw = window.sessionStorage.getItem(CASE_PHASE_KEY);
    return isCasePhase(raw) ? raw : "Discovery";
  } catch {
    return "Discovery";
  }
}

function persistPhase(phase: CasePhase) {
  try {
    window.sessionStorage.setItem(CASE_PHASE_KEY, phase);
  } catch {
    /* private mode */
  }
}

function postSplitToParent(action: "close" | "toggle") {
  try {
    window.parent.postMessage({ source: SPLIT_MSG_SOURCE, action }, window.location.origin);
  } catch {
    /* isolated frame */
  }
}

function Sidebar({
  phase,
  onPhaseChange,
  surfaces,
}: {
  phase: CasePhase;
  onPhaseChange: (phase: CasePhase) => void;
  surfaces: Surface[];
}) {
  const pathname = usePathname();
  const groups = useMemo(() => {
    const map = new Map<string, Surface[]>();
    for (const item of surfacesForPhase(phase, surfaces)) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [surfaces, phase]);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-brand-mark">LW</span>
        <div>
          <div className="sidebar-brand">Legal Workspace</div>
          <div className="sidebar-brand-subtitle">Genesee · 7th Circuit</div>
        </div>
      </div>
      <CasePhaseSwitcher phase={phase} onChange={onPhaseChange} />
      <nav className="sidebar-nav-scroll">
        {groups.map(([label, items]) => {
          const emphasized = surfaces.some(
            (item) => item.group === label && isPhasePriority(item.path, phase),
          );
          return (
            <div key={label}>
              <div className={`sidebar-group-label${emphasized ? " emphasized" : ""}`}>
                {label}
              </div>
              {items.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  title={navHelp(item)}
                  className={`sidebar-item${pathname === item.path ? " active" : ""}${isPhasePriority(item.path, phase) ? " phase-hit" : ""}`}
                >
                  <span className="sidebar-item-label">{navLabel(item)}</span>
                </a>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="sidebar-version">
        <ConfidentialToggle />
        <div>Workbench only — do not file this screen.</div>
      </div>
    </aside>
  );
}

function CasePhaseSwitcher({
  phase,
  onChange,
}: {
  phase: CasePhase;
  onChange: (phase: CasePhase) => void;
}) {
  return (
    <div className="case-phase-switcher" aria-label="Case phase">
      <div className="sidebar-group-label">Phase</div>
      <div className="case-phase-chips">
        {CASE_PHASES.map((item) => (
          <button
            key={item}
            type="button"
            className={`case-phase-chip${phase === item ? " active" : ""}`}
            onClick={() => onChange(item)}
          >
            {PHASE_COPY[item].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfidentialToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`${legalApiBase()}/v1/confidential`, { cache: "no-store" });
        if (response.ok) {
          const body = (await response.json()) as { on?: boolean };
          const next = Boolean(body.on);
          setOn(next);
          window.localStorage.setItem("lw-confidential", next ? "1" : "0");
          document.documentElement.dataset.confidential = next ? "on" : "off";
          return;
        }
      } catch {
        /* fall back to local chrome */
      }
      const stored = window.localStorage.getItem("lw-confidential") === "1";
      setOn(stored);
      document.documentElement.dataset.confidential = stored ? "on" : "off";
    })();
  }, []);
  function toggle() {
    const next = !on;
    setOn(next);
    window.localStorage.setItem("lw-confidential", next ? "1" : "0");
    document.documentElement.dataset.confidential = next ? "on" : "off";
    void fetch(`${legalApiBase()}/v1/confidential`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ on: next }),
    }).catch(() => {
      /* chrome stays local if legal-api is down */
    });
  }
  return (
    <button type="button" onClick={toggle} style={{ marginBottom: 8, width: "100%" }}>
      {on ? "Confidential mode on" : "Confidential mode off"}
    </button>
  );
}

function CommandLine({ phase, surfaces }: { phase: CasePhase; surfaces: Surface[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const needle = value.trim().toLowerCase();
  const suggestions = needle
    ? surfaces
        .filter(
          (item) =>
            item.label.toLowerCase().includes(needle) ||
            (item.help ?? "").toLowerCase().includes(needle),
        )
        .sort((a, b) => compareSurfacesByPhase(a, b, phase))
    : [];
  const hints = surfaces
    .filter((item) => isPhasePriority(item.path, phase))
    .sort((a, b) => compareSurfacesByPhase(a, b, phase))
    .map(navLabel)
    .slice(0, 4)
    .join("  ·  ");

  function execute(raw?: string) {
    const query = (raw ?? value).trim();
    const path = pathForQuery(query, surfaces);
    if (path) {
      router.push(path);
      setValue("");
      setOpen(false);
    }
  }

  return (
    <div className="command-line-root">
      {open && suggestions.length > 0 ? (
        <div className="command-suggestions">
          {suggestions.map((item) => (
            <button
              key={item.path}
              type="button"
              className="command-suggestion"
              onClick={() => execute(item.label)}
            >
              <span>{navLabel(item)}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="command-row">
        <span className="command-prompt">›</span>
        <input
          className="term-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") execute();
            if (event.key === "Escape") {
              setValue("");
              setOpen(false);
            }
            if (event.key === "Tab" && suggestions[0]) {
              event.preventDefault();
              setValue(suggestions[0].label);
            }
          }}
          placeholder={hints || "Type a page name"}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function StatusBar({
  pinnedPath,
  surfaces,
}: {
  pinnedPath: string | null;
  surfaces: Surface[];
}) {
  const pathname = usePathname();
  const current = surfaceForPath(pathname, surfaces);
  const pinned = pinnedPath
    ? surfaceForPath(pinnedPath.split("?")[0] ?? pinnedPath, surfaces)
    : null;
  const [now, setNow] = useState("");
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [agno, setAgno] = useState<{
    reachable: boolean;
    evidence_platform: string;
    matters_visible: boolean;
  } | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    fetch(`${legalApiBase()}/health`)
      .then((response) => setApiOk(response.ok))
      .catch(() => setApiOk(false));
    fetchAgnoStatus()
      .then(setAgno)
      .catch(() =>
        setAgno({
          reachable: false,
          evidence_platform: "evidence-platform",
          matters_visible: false,
        }),
      );
  }, []);

  const evidenceName = agno?.evidence_platform ?? "evidence-platform";
  const evidenceOk = Boolean(agno?.reachable);

  return (
    <div className="status-bar">
      <span style={{ color: apiOk ? "var(--status-ok)" : "var(--status-err)" }}>
        {apiOk ? "●" : "○"} legal-api
      </span>
      <span>│</span>
      <span style={{ color: evidenceOk ? "var(--status-ok)" : "var(--status-err)" }}>
        {evidenceOk ? "●" : "○"} {evidenceName}
        {agno?.matters_visible ? " · matters" : ""}
      </span>
      <span>│</span>
      <span>
        {navLabel(current)}
        {pinned ? ` / ${navLabel(pinned)}` : ""}
      </span>
      <span style={{ flex: 1 }} />
      <span>Legal Workspace</span>
      <span>│</span>
      <span style={{ fontFamily: "var(--font-mono)" }}>{now}</span>
    </div>
  );
}

export function TerminalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const surfaces = useSurfaceCatalog();
  const current = surfaceForPath(pathname, surfaces);
  const [palette, setPalette] = useState(false);
  const [embedded] = useState(readEmbedded);
  const [pinReady, setPinReady] = useState(false);
  const [pinnedPath, setPinnedPath] = useState<string | null>(null);
  const [phase, setPhase] = useState<CasePhase>("Discovery");
  const isPinned = pinnedPath === pathname;

  const selectPhase = useCallback((next: CasePhase) => {
    setPhase(next);
    persistPhase(next);
  }, []);

  const closeSplit = useCallback(() => {
    setPinnedPath(null);
  }, []);

  const pinSplit = useCallback(
    (path: string = pathname) => {
      if (embedded) return;
      if (typeof window !== "undefined" && window.innerWidth <= 1024) return;
      if (!isSafePinPath(path)) return;
      setPinnedPath(path);
    },
    [embedded, pathname],
  );

  const chatPinned = Boolean(pinnedPath?.split("?")[0] === "/chat");

  const tellChatSurface = useCallback((surface: string) => {
    if (typeof window === "undefined") return;
    const live = captureLiveSurface(surface);
    try {
      window.sessionStorage.setItem("lw-chat-from", surface);
      window.sessionStorage.setItem(liveSurfaceKey(), JSON.stringify(live));
    } catch {
      /* private mode */
    }
    const frame = document.querySelector(".workspace-split-frame") as HTMLIFrameElement | null;
    try {
      frame?.contentWindow?.postMessage(
        { source: "lw-chat-context", from: surface, live },
        window.location.origin,
      );
    } catch {
      /* isolated */
    }
  }, []);

  const summonAssistant = useCallback(() => {
    if (embedded) {
      postSplitToParent("toggle");
      return;
    }
    if (pathname === "/chat") return;
    if (chatPinned) {
      persistPin(null);
      closeSplit();
      return;
    }
    tellChatSurface(pathname);
    const next = `/chat?from=${encodeURIComponent(pathname)}`;
    if (!isSafePinPath(next)) return;
    persistPin(next);
    setPinnedPath(next);
  }, [chatPinned, closeSplit, embedded, pathname, tellChatSurface]);

  const toggleSplit = useCallback(() => {
    if (embedded) {
      postSplitToParent("toggle");
      return;
    }
    if (pinnedPath) closeSplit();
    else pinSplit(pathname);
  }, [closeSplit, embedded, pathname, pinSplit, pinnedPath]);

  useEffect(() => {
    if (embedded) return;
    const stored = readStoredPin();
    setPinnedPath((current) => current ?? stored);
    setPinReady(true);
    setPhase(readStoredPhase());
  }, [embedded]);

  useEffect(() => {
    if (embedded || !pinReady) return;
    persistPin(pinnedPath);
  }, [embedded, pinReady, pinnedPath]);

  useEffect(() => {
    if (embedded || !chatPinned || pathname === "/chat") return;
    tellChatSurface(pathname);
  }, [chatPinned, embedded, pathname, tellChatSurface]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "F1") {
        event.preventDefault();
        summonAssistant();
        return;
      }
      const backslash =
        event.key === "\\" || event.code === "Backslash" || event.key === "Backslash";
      if ((event.ctrlKey || event.metaKey) && backslash) {
        event.preventDefault();
        if (embedded) postSplitToParent("toggle");
        else toggleSplit();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        if (embedded) return;
        event.preventDefault();
        setPalette((open) => !open);
        return;
      }
      if (event.key !== "Escape") return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (embedded) {
        postSplitToParent("close");
        return;
      }
      if (palette) return;
      if (pinnedPath) {
        event.preventDefault();
        closeSplit();
      }
    }

    function onMessage(event: MessageEvent) {
      if (embedded) return;
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; action?: string } | null;
      if (!data || data.source !== SPLIT_MSG_SOURCE) return;
      if (data.action === "close") closeSplit();
      if (data.action === "toggle") toggleSplit();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("message", onMessage);
    };
  }, [closeSplit, embedded, palette, pinnedPath, summonAssistant, toggleSplit]);

  const header = (
    <div className="module-header">
      <span className="module-title">{navLabel(current)}</span>
      <span className="module-subtitle">Workbench only — do not file this screen with the court.</span>
      {!embedded ? (
        <>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className={`ask-btn${chatPinned ? " active" : ""}`}
            title="Open the assistant beside this page"
            onClick={summonAssistant}
          >
            {chatPinned ? "Close assistant" : "Ask"}
          </button>
          <button
            type="button"
            className={`split-pin-btn split-btn-hide-tablet${isPinned ? " active" : ""}`}
            title={isPinned ? "Close split" : "Pin this page to split view"}
            onClick={() => (isPinned ? closeSplit() : pinSplit(pathname))}
          >
            {isPinned ? "× split" : "⊞ split"}
          </button>
        </>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <div className="module-shell" data-embed="1">
        {header}
        <div className="module-body">{children}</div>
      </div>
    );
  }

  return (
    <div className="app-shell" data-theme="dark">
      <Sidebar phase={phase} onPhaseChange={selectPhase} surfaces={surfaces} />
      <div className="main-column">
        <div className="command-line-bar">
          <CommandLine phase={phase} surfaces={surfaces} />
          <button
            type="button"
            className={`ask-btn ask-btn-bar${chatPinned ? " active" : ""}`}
            onClick={summonAssistant}
          >
            {chatPinned ? "Close assistant" : "Ask"}
          </button>
        </div>
        <div className="workspace-area">
          <div className="module-shell">
            {header}
            <SplitWorkspace pinnedPath={pinnedPath} onClose={closeSplit}>
              {children}
            </SplitWorkspace>
          </div>
        </div>
        <StatusBar pinnedPath={pinnedPath} surfaces={surfaces} />
      </div>
      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        phase={phase}
        surfaces={surfaces}
      />
    </div>
  );
}
