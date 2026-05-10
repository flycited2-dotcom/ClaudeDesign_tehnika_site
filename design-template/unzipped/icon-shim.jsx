// Single Icon helper expected by screen-bot.jsx — wraps Ico.* names

const NAME_MAP = {
  "search": "Search", "play": "Play", "check": "Check", "phone": "Phone",
  "more": "Settings", "paperclip": "Doc", "mic": "Mic", "bot": "Bot",
  "sliders": "Settings", "compare": "Compare", "receipt": "Receipt",
  "doc": "Doc", "headset": "Headset", "chev-left": "ChevronDown",
};

const Icon = ({ name, size = 18, stroke = 2, ...rest }) => {
  const key = NAME_MAP[name] || name;
  const C = window.Ico && window.Ico[key];
  if (!C) return null;
  const style = { transform: name === "chev-left" ? "rotate(90deg)" : undefined };
  return <C width={size} height={size} strokeWidth={stroke} style={style} {...rest} />;
};

window.Icon = Icon;
