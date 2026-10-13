export type SupportedLanguage =
  | "pt-BR"
  | "en"
  | "es"
  | "zh-CN"
  | "fr"
  | "de"
  | "it"
  | "ar"
  | "id"
  | "ja"
  | "ko"
  | "nl"
  | "pt-PT"
  | "ru"
  | "vi";

export type LanguageSetting = "system" | SupportedLanguage;

export interface LanguageOption {
  code: LanguageSetting;
  label: string;
  flag: string;
  native: string;
  dir?: "ltr" | "rtl";
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: "system", label: "Idioma do Sistema", flag: "🌐", native: "System Default" },
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷", native: "Português (Brasil)" },
  { code: "en", label: "English", flag: "🇺🇸", native: "English" },
  { code: "es", label: "Español", flag: "🇪🇸", native: "Español" },
  { code: "zh-CN", label: "中文 (简体)", flag: "🇨🇳", native: "简体中文" },
  { code: "fr", label: "Français", flag: "🇫🇷", native: "Français" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", native: "Deutsch" },
  { code: "it", label: "Italiano", flag: "🇮🇹", native: "Italiano" },
  { code: "ar", label: "العربية", flag: "🇸🇦", native: "العربية", dir: "rtl" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", native: "Bahasa Indonesia" },
  { code: "ja", label: "日本語", flag: "🇯🇵", native: "日本語" },
  { code: "ko", label: "한국어", flag: "🇰🇷", native: "한국어" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱", native: "Nederlands" },
  { code: "pt-PT", label: "Português (Portugal)", flag: "🇵🇹", native: "Português (Portugal)" },
  { code: "ru", label: "Русский", flag: "🇷🇺", native: "Русский" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", native: "Tiếng Việt" },
] as const;

export interface TranslationDictionary {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    aster_network: string;
    arena_subtitle: string;
    login_aster: string;
    logout: string;
    logout_title: string;
  };
  header: {
    memory_game: string;
    remastered: string;
  };
  tabs: {
    play: string;
    rank: string;
    help: string;
  };
  identity: {
    title: string;
    guest: string;
    guest_desc: string;
    account: string;
    account_desc_logged: string;
    account_desc_guest: string;
    switch_account: string;
    account_hint: string;
    fighter_name_label: string;
    fighter_name_placeholder: string;
  };
  diff: {
    title: string;
    novato: {
      label: string;
      tag: string;
      desc: string;
    };
    lutador: {
      label: string;
      tag: string;
      desc: string;
    };
    lenda: {
      label: string;
      tag: string;
      desc: string;
    };
    classico: {
      label: string;
      tag: string;
      desc: string;
    };
    pts_badge: string;
  };
  play_btn: {
    ready: string;
    need_name: string;
  };
  guide: {
    title: string;
    version: string;
    card1_title: string;
    card1_tag: string;
    card1_desc: string;
    card2_title: string;
    card2_tag: string;
    card2_desc: string;
    card3_title: string;
    card3_tag: string;
    card4_title: string;
    card4_tag: string;
    card4_desc: string;
    shortcuts_title: string;
    shortcut_pause: string;
    shortcut_audio: string;
    shortcut_restart: string;
  };
  footer: {
    made_by: string;
    remastered: string;
  };
  hud: {
    soul: string;
    boss_label: string;
    boss_name: string;
    pairs_counter: string;
    points: string;
    moves: string;
    accuracy: string;
    menu_btn: string;
    sound_unmute: string;
    sound_mute: string;
    restart_btn: string;
    pause_btn: string;
  };
  phases: {
    round_1: string;
    memorize: string;
    fight: string;
    pause_title: string;
    exit_btn: string;
    resume_btn: string;
    combo_popup: string;
  };
  result: {
    ko: string;
    defeat: string;
    victory: string;
    game_over: string;
    shaco_won: string;
    flavor_win: string;
    flavor_lose: string;
    stat_time: string;
    stat_moves: string;
    stat_accuracy: string;
    stat_max_combo: string;
    pairs_and_combos: string;
    time_bonus: string;
    life_bonus: string;
    total: string;
    new_record: string;
    menu_btn: string;
    rematch_btn: string;
    retry_btn: string;
  };
  ranks: {
    S: string;
    A: string;
    B: string;
    C: string;
    D: string;
  };
  leaderboard: {
    general_tab: string;
    general_sub: string;
    general_info_title: string;
    general_info_desc: string;
    diff_info: string;
    top_fighters: string;
    loading: string;
    empty_title: string;
    empty_desc: string;
    modes_count: string;
    moves_suffix: string;
    verified_aster: string;
    vip_badge: string;
    footer_legend: string;
  };
  auth: {
    badge: string;
    login_title: string;
    register_title: string;
    header_desc: string;
    verified: string;
    vip: string;
    login_tab: string;
    register_tab: string;
    login_id_label: string;
    login_id_placeholder: string;
    fighter_name_label: string;
    fighter_name_placeholder: string;
    space_warning: string;
    email_label: string;
    email_placeholder: string;
    password_label: string;
    password_login_ph: string;
    password_reg_ph: string;
    confirm_password_label: string;
    confirm_password_ph: string;
    loading: string;
    login_btn: string;
    register_btn: string;
    guest_continue: string;
    err_missing_login: string;
    err_missing_name: string;
    err_name_length: string;
    err_missing_email: string;
    err_password_length: string;
    err_password_match: string;
  };
  language: {
    selector_title: string;
    system_label: string;
    system_desc: string;
    current: string;
  };
  card: {
    prestige: string;
    face_down: string;
  };
}
