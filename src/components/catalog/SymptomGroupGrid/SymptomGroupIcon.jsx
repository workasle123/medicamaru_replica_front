/**
 * Outline icons for the symptom browse groups.
 *
 * The admin stores a KEY (SymptomGroup::ICONS), not a file, so every group
 * gets a drawing in the same weight and style however many groups are added
 * — an uploaded image per group would drift within a week.
 *
 * A key with no drawing here falls back to `question` rather than rendering
 * nothing, so a group added in the admin before its icon exists still shows a
 * complete card. Keep this list and SymptomGroup::ICONS in step.
 */

const PATHS = {
  // ♂ — circle with the arrow out of its top-right
  mars: (
    <>
      <circle cx="10" cy="14" r="6" />
      <path d="M14.5 9.5 20 4m0 0h-5m5 0v5" />
    </>
  ),
  // A head in profile with thinning strands over the crown
  hairloss: (
    <>
      <path d="M5 20a7 7 0 0 1 14 0" />
      <path d="M7.5 10.5c1-1.5 2.5-2 4.5-2s3.5.5 4.5 2" />
      <path d="M9 7.5V5M12 7V4.5M15 7.5V5.5" />
    </>
  ),
  // Comb
  hair: (
    <>
      <path d="M4 7.5h16a0 0 0 0 1 0 0v3H4z" />
      <path d="M6 10.5V17M9.5 10.5V19M14.5 10.5V19M18 10.5V17" />
    </>
  ),
  // Droplet — moisture, skin
  skin: <path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10Z" />,
  // Four-point sparkle — brightening
  sparkle: (
    <>
      <path d="M12 3.5c0 4 1.5 6 6 6-4.5 0-6 2-6 6 0-4-1.5-6-6-6 4.5 0 6-2 6-6Z" />
      <path d="M18.5 16.5c0 1.6.7 2.4 2.5 2.4-1.8 0-2.5.8-2.5 2.4 0-1.6-.7-2.4-2.5-2.4 1.8 0 2.5-.8 2.5-2.4Z" />
    </>
  ),
  // ♀
  venus: (
    <>
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M12 14v7M9 18h6" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="11" r="7" />
      <path d="M9.5 9.5h.01M14.5 9.5h.01" />
      <path d="M9.5 14a3.5 3.5 0 0 0 5 0" />
    </>
  ),
  // Capsule
  pill: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" />
      <path d="M12 8.5v7" />
    </>
  ),
  // A flexed arm
  muscle: (
    <>
      <path d="M4 8h7a5 5 0 0 1 5 5v1" />
      <path d="M16 14a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8" />
      <path d="M16 14h2a2.5 2.5 0 0 0 0-5h-1" />
    </>
  ),
  // Balance scales
  scale: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M5 8h14M5 8 2.5 14h5zM19 8l-2.5 6h5z" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  brain: (
    <>
      <path d="M12 5.5a3 3 0 0 0-5.7 1.3A3 3 0 0 0 5 12a3 3 0 0 0 2 2.8A3 3 0 0 0 12 19" />
      <path d="M12 5.5A3 3 0 0 1 17.7 6.8 3 3 0 0 1 19 12a3 3 0 0 1-2 2.8A3 3 0 0 1 12 19" />
      <path d="M12 5.5V19" />
    </>
  ),
  // Sticking plaster
  bandage: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="M10 10.5h.01M13.5 10.5h.01M10 13.5h.01M13.5 13.5h.01" />
    </>
  ),
  // A nose in profile
  nose: (
    <>
      <path d="M13 4c0 4 4 6.5 4 9.5 0 1.5-1.2 2-2.5 2" />
      <path d="M9 17a4.5 4.5 0 0 0 6 0" />
    </>
  ),
  virus: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.2 5.2l2.9 2.9M15.9 15.9l2.9 2.9M18.8 5.2l-2.9 2.9M8.1 15.9l-2.9 2.9" />
    </>
  ),
  tooth: <path d="M8 3.5c-2.2 0-3.5 1.7-3.5 4 0 2 .7 3 1.2 5 .4 1.7.3 5 .8 6.6.4 1.2 1.7 1.3 2.1 0 .6-1.9.7-4.6 2.4-4.6s1.8 2.7 2.4 4.6c.4 1.3 1.7 1.2 2.1 0 .5-1.6.4-4.9.8-6.6.5-2 1.2-3 1.2-5 0-2.3-1.3-4-3.5-4-1.6 0-2.2.8-3 .8s-1.4-.8-3-.8Z" />,
  eye: (
    <>
      <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  leaf: (
    <>
      <path d="M4.5 19.5C3 15 5 8 12 5.5c3-1 6-1 7.5-1 .3 3.5-.3 10-4.5 13-3 2.1-7.5 2.5-10.5 2Z" />
      <path d="M5 19c3-5.5 6.5-8.5 11-11" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2-2.5 3.5" />
      <path d="M12 17h.01" />
    </>
  ),
};

/**
 * @param {Object} props
 * @param {string} [props.name]  A key from SymptomGroup::ICONS
 */
export default function SymptomGroupIcon({ name }) {
  const path = PATHS[name] ?? PATHS.question;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Decorative: the group name sits directly beneath and says the same thing.
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}
