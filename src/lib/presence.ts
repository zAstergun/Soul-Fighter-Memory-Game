import { supabase } from "./supabase";
import type { UserProfile } from "./supabase";

let presenceInterval: number | null = null;

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("aster_presence_soul_fighter");
    if (!sid) {
      sid = `sf_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      sessionStorage.setItem("aster_presence_soul_fighter", sid);
    }
    return sid;
  } catch {
    return `sf_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  }
}

export async function sendPresencePing(params: {
  currentPath?: string;
  playerName?: string;
  user?: any;
  profile?: UserProfile | null;
}) {
  try {
    const sessionId = getSessionId();
    const isAuth = Boolean(params.user);
    const userId = params.user?.id || null;
    const userEmail = params.user?.email || null;
    const userName =
      params.profile?.full_name ||
      params.user?.user_metadata?.full_name ||
      params.playerName ||
      (isAuth ? "Guerreiro Aster" : "Convidado da Arena");

    const clientInfo = {
      browser: /chrome/i.test(navigator.userAgent)
        ? "Chrome"
        : /firefox/i.test(navigator.userAgent)
        ? "Firefox"
        : /safari/i.test(navigator.userAgent)
        ? "Safari"
        : /edge/i.test(navigator.userAgent)
        ? "Edge"
        : "Navegador Web",
      os: /android/i.test(navigator.userAgent)
        ? "Android"
        : /iphone|ipad/i.test(navigator.userAgent)
        ? "iOS"
        : /win/i.test(navigator.platform)
        ? "Windows"
        : /mac/i.test(navigator.platform)
        ? "macOS"
        : "Desktop",
      device: window.innerWidth < 768 ? "Mobile" : "Desktop",
      resolution: `${window.innerWidth}x${window.innerHeight}`,
    };

    await supabase.rpc("crm_record_presence_ping", {
      p_app_id: "soul_fighter",
      p_session_id: sessionId,
      p_user_id: userId,
      p_user_email: userEmail,
      p_user_name: userName,
      p_is_authenticated: isAuth,
      p_current_path: params.currentPath || "/arena/menu",
      p_client_info: clientInfo,
    });
  } catch {
    // Fail silently so game loop is never impacted
  }
}

export function startPresenceHeartbeat(
  getState: () => {
    currentPath: string;
    playerName: string;
    user: any;
    profile: UserProfile | null;
  }
) {
  if (presenceInterval) {
    clearInterval(presenceInterval);
  }

  // Ping inicial imediato
  sendPresencePing(getState());

  // Heartbeat a cada 25 segundos
  presenceInterval = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      sendPresencePing(getState());
    }
  }, 25000);

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      sendPresencePing(getState());
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    if (presenceInterval) {
      clearInterval(presenceInterval);
      presenceInterval = null;
    }
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
