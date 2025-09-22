import React, { useRef, useEffect } from 'react';
import type { JSX } from 'react';
import { IconButton } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

type KanaCanvasProps = {
  kana: string;
}

const strokeImages = import.meta.glob('../../assets/kanaStrokes/*.svg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const KanaCanvas: React.FC<KanaCanvasProps> = ({ kana }): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [kana]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleTouchEnd = () => {
    drawing.current = false;
  };

  const strokeImage = strokeImages[`../../assets/kanaStrokes/${kana}.svg`];

  return (
    <div style={{ position: 'relative', width: 300, height: 300, overflow: 'hidden', backgroundColor: '#fff3e0' }}>
      <IconButton
        onClick={clearCanvas}
        size="small"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 2,
          background: '#fff',
          border: '1px solid #ccc',
        }}
        title="清除畫布"
      >
        <RestartAltIcon />
      </IconButton>

      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{
          border: '1px solid #ccc',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 1,
          touchAction: 'none',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}  //block right-click context menu
      />
      <img
        src={strokeImage}
        alt={`假名：${kana}`}
        draggable={false}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 300,
          height: 300,
          objectFit: 'contain',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.3,
        }}
      />
    </div>
  );
};

export default KanaCanvas;
