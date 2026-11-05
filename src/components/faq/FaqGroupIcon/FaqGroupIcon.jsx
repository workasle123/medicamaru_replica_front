/* FAQ topic icons (Admin → FAQ Groups → Icon) — outline style on a 24px grid,
   matching the footer's icons. Sized by the CSS of wherever they are placed:
   the FAQ page's jump menu and headings, and the FAQ box in the side column. */
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function IconOrder() {
  return (
    <svg {...iconProps}>
      <path d="M6 7h12l1 13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L6 7Z" />
      <path d="M9 7V6a3 3 0 0 1 6 0v1" />
    </svg>
  );
}

/* Yen rather than a card: bank transfer is how customers actually pay. */
function IconPayment() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 7 3.5 4.5L15.5 7M12 11.5V17M9 12.5h6M9 15h6" />
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function IconImport() {
  return (
    <svg {...iconProps}>
      <path d="M12 3 19 6v5c0 4.5-3 8.4-7 10-4-1.6-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconAccount() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconQuestion() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01" />
    </svg>
  );
}

/* Keys are what Admin → FAQ Groups → Icon stores (FaqGroup::ICONS in the
   admin panel). A key missing here — or no icon chosen — gets the question
   mark, so a new admin option never breaks the page. */
const ICONS = {
  order: IconOrder,
  payment: IconPayment,
  delivery: IconDelivery,
  import: IconImport,
  account: IconAccount,
  question: IconQuestion,
};

/**
 * @param {{name: string}} props  The group's icon key
 */
export default function FaqGroupIcon({ name }) {
  const Icon = ICONS[name] ?? IconQuestion;
  return <Icon />;
}
