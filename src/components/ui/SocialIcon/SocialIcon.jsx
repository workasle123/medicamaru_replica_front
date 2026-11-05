/**
 * Brand marks for the social accounts in SOCIAL_LINKS (constants/nav), keyed
 * by the same `key`. Shared by the footer and the FAQ page's sidebar.
 *
 * Decorative: every caller labels the link itself.
 *
 * @param {{name: string, size?: number}} props
 */
export default function SocialIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
  };

  if (name === 'x') {
    return (
      <svg {...common}>
        <path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.3-5.6L6.5 21H3.4l7-8L2.6 3h6l3.9 5.2L17.5 3Zm-1.1 16h1.7L7.7 4.8H5.9L16.4 19Z" />
      </svg>
    );
  }

  if (name === 'instagram') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === 'facebook') {
    return (
      <svg {...common}>
        <path d="M14 9V7.5c0-.7.3-1 1-1h1.5V4H14c-2.2 0-3.5 1.3-3.5 3.4V9H8.5v2.6h2V21h3v-9.4h2.2l.4-2.6H13.5Z" />
      </svg>
    );
  }

  if (name === 'youtube') {
    return (
      <svg {...common}>
        <path d="M22 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.8C18.3 5 12 5 12 5s-6.3 0-7.9.5a2.5 2.5 0 0 0-1.7 1.8C2 8.8 2 12 2 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.8c1.6.5 7.9.5 7.9.5s6.3 0 7.9-.5a2.5 2.5 0 0 0 1.7-1.8C22 15.2 22 12 22 12ZM10 15V9l5.2 3L10 15Z" />
      </svg>
    );
  }

  /* line */
  return (
    <svg {...common}>
      <path d="M12 3C6.9 3 2.8 6.4 2.8 10.6c0 3.7 3.2 6.8 7.6 7.5.3.1.7.2.8.5.1.3.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.3-3.1 7.2-5.3c1.3-1.4 2-2.9 2-4.9C21.1 6.4 17 3 12 3Z" />
    </svg>
  );
}
