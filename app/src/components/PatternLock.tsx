import { useRef, useState, useCallback, useEffect } from 'react';
import { Lock, RefreshCw } from 'lucide-react';

interface PatternLockProps {
  value?: number[];
  onChange: (pattern: number[]) => void;
  size?: number;
}

export function PatternLock({ value = [], onChange, size = 240 }: PatternLockProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pattern, setPattern] = useState<number[]>(value);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  const dotRadius = size / 12;
  const spacing = size / 3;
  const offset = spacing / 2;

  // Calculate dot positions
  const getDotPosition = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: offset + col * spacing,
      y: offset + row * spacing,
    };
  };

  // Get dot index from position
  const getDotAtPosition = useCallback((x: number, y: number): number | null => {
    for (let i = 0; i < 9; i++) {
      const pos = getDotPosition(i);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance < dotRadius * 1.5) {
        return i;
      }
    }
    return null;
  }, []);

  // Draw the pattern
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw connecting lines
    if (pattern.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      pattern.forEach((dotIndex, i) => {
        const pos = getDotPosition(dotIndex);
        if (i === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      });
      ctx.stroke();
    }

    // Draw dots
    for (let i = 0; i < 9; i++) {
      const pos = getDotPosition(i);
      const isSelected = pattern.includes(i);
      const isHovered = hoveredDot === i;

      // Outer glow for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotRadius + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(57, 255, 20, 0.2)';
        ctx.fill();
      }

      // Main dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#39FF14' : isHovered ? '#4A5568' : '#2D3748';
      ctx.fill();

      // Inner dot for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#0D0F12';
        ctx.fill();
      }

      // Dot number
      ctx.fillStyle = isSelected ? '#0D0F12' : '#6B7280';
      ctx.font = `bold ${dotRadius * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), pos.x, pos.y);
    }
  }, [pattern, hoveredDot, size]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle mouse/touch events
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setPattern([]);
    handleMove(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const dotIndex = getDotAtPosition(x, y);
    setHoveredDot(dotIndex);

    if (dotIndex !== null && !pattern.includes(dotIndex)) {
      const newPattern = [...pattern, dotIndex];
      setPattern(newPattern);
      onChange(newPattern);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setHoveredDot(null);
  };

  const handleClear = () => {
    setPattern([]);
    onChange([]);
  };

  // Convert pattern to visual representation
  const getPatternString = () => {
    if (pattern.length === 0) return 'Ningún patrón dibujado';
    return `Patrón: ${pattern.map((i) => i + 1).join(' → ')}`;
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="cursor-crosshair touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{
            background: 'linear-gradient(145deg, #1A1D23, #0D0F12)',
            borderRadius: '16px',
            border: '2px solid #2D3748',
          }}
        />
        {pattern.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Lock className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
              <span className="text-xs text-[#6B7280]">Dibuja el patrón</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full">
        <span className="text-sm text-[#A0AEC0]">{getPatternString()}</span>
        <button
          onClick={handleClear}
          className="p-2 rounded-lg bg-[#2D3748] hover:bg-[#4A5568] transition-colors"
          title="Limpiar patrón"
        >
          <RefreshCw className="w-4 h-4 text-[#A0AEC0]" />
        </button>
      </div>
    </div>
  );
}
