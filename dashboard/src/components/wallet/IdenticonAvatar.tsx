import React from "react";
import { getIdenticonGrid } from "../../lib/identicon.ts";

export { getIdenticonGrid };

export interface IdenticonAvatarProps {
  address: string;
  size?: number;
  className?: string;
}

export function IdenticonAvatar({ address, size = 24, className = "" }: IdenticonAvatarProps) {
  const { grid, color } = getIdenticonGrid(address);
  const cellSize = size / 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-full overflow-hidden bg-[#21262d] flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      {grid.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}
