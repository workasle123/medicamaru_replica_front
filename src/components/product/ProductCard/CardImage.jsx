'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * The pack photo on a homepage card.
 *
 * Takes the product's pack photos in order and shows the first one that loads.
 * Some products list an image whose file is missing on the media server; a
 * load error moves on to the next one. If none load, an empty box is shown —
 * the primary (banner-style) image is never used as a fallback.
 */
export default function CardImage({ sources, name, className, missingClassName, sizes, priority }) {
  const [index, setIndex] = useState(0);
  const shown = sources[index];

  if (!shown) return <div className={missingClassName} aria-hidden="true" />;

  return (
    <Image
      key={shown.url}
      src={shown.url}
      alt={shown.alt || name}
      width={shown.width || 600}
      height={shown.height || 600}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
