import type { UserProfile } from "../lib/supabase";

export function VerifiedBadge({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      title="Conta Verificada ASTER"
      className="inline-flex items-center justify-center text-soul-cyan drop-shadow-[0_0_8px_rgba(62,224,255,0.8)]"
    >
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2l2.6 3.1 4 .6 1.4 3.8 3 2.7-1 4 1.4 3.8-3.1 2.6-.6 4-3.8 1.4-2.7 3-4-1-3.8 1.4-2.6-3.1-4-.6-1.4-3.8-3-2.7 1-4L1.4 7.4l3.1-2.6.6-4 3.8-1.4L11.6 2 12 2zm-1.2 13.6l6-6-1.4-1.4-4.6 4.6-2.2-2.2-1.4 1.4 3.6 3.6z" />
      </svg>
    </span>
  );
}

export function VipBadge({ className = "text-xs" }: { className?: string }) {
  return (
    <span
      title="Membro VIP da Rede ASTER"
      className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-400 via-soul-gold to-yellow-200 px-1.5 py-0.5 font-display tracking-widest text-soul-ink shadow-[0_0_12px_rgba(255,210,63,0.7)] ${className}`}
    >
      <span className="text-[11px]">👑</span> VIP
    </span>
  );
}

export function PlayerAvatar({
  profile,
  name,
  size = "md",
}: {
  profile?: UserProfile | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };

  if (!profile) {
    return null;
  }

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={name}
        className={`${sizeClasses[size]} shrink-0 rounded-full border border-soul-gold/40 object-cover shadow-[0_0_8px_rgba(255,210,63,0.3)]`}
      />
    );
  }

  // Fallback avatar com as iniciais
  const initials = (profile.full_name || name || "A")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} shrink-0 flex items-center justify-center rounded-full bg-gradient-to-tr from-soul-pink via-soul-violet to-soul-cyan font-display font-bold text-white border border-white/20 shadow-[0_0_8px_rgba(255,61,154,0.4)]`}
    >
      {initials}
    </div>
  );
}
