import type { CSSProperties } from 'react';
import './winter-artwork.css';

const snowPositions = [5, 11, 17, 23, 31, 39, 46, 52, 60, 67, 73, 81, 88, 96];

export function WinterArtwork({ className = '', snowfall = false }: { className?: string; snowfall?: boolean }) {
  return <div className={`winter-artwork ${className}`} aria-hidden="true">
    {snowfall && <div className="winter-snow">
      {snowPositions.map((position, index) => (
        <span key={position} className="winter-flake" style={{
          left: `${position}%`,
          '--snow-size': `${2 + (index % 4)}px`,
          '--snow-time': `${13 + (index % 5) * 3}s`,
          '--snow-delay': `-${(index * 7 + 3) % 21}s`,
          '--snow-drift': `${index % 2 === 0 ? 26 : -22}px`,
        } as CSSProperties} />
      ))}
    </div>}
  </div>;
}
