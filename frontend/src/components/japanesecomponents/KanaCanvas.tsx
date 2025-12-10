import { useRef, useEffect, forwardRef, useImperativeHandle, type JSX } from 'react';
import { Box } from '@mui/material';

interface KanaCanvasProps {
	kana: string;
}

export type KanaCanvasHandle = {
	clearCanvas: () => void;
};

const strokeImages = import.meta.glob('../../assets/kanaStrokes/*.svg', {
	eager: true,
	import: 'default',
}) as Record<string, string>;

const CANVAS_SIZE = 300;

const KanaCanvas = forwardRef<KanaCanvasHandle, KanaCanvasProps>(({ kana }, ref): JSX.Element => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const drawing = useRef(false);

	// Initialize canvas for high DPI so pixel size = CSS size * devicePixelRatio
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = CANVAS_SIZE * dpr;
		canvas.height = CANVAS_SIZE * dpr;

		const ctx = canvas.getContext('2d');
		if (ctx) {
			// Make 1 unit = 1 CSS pixel
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		}
	}, []);

	// Clear canvas when kana changes
	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (canvas && ctx) {
			ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		}
	}, [kana]);

	const getPos = (clientX: number, clientY: number) => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		return {
			x: clientX - rect.left,
			y: clientY - rect.top,
		};
	};

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
		drawing.current = true;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const { x, y } = getPos(e.clientX, e.clientY);
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.lineWidth = 6;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.beginPath();
			ctx.moveTo(x, y);
		}
	};

	const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!drawing.current) return;
		const canvas = canvasRef.current;
		if (!canvas) return;

		const { x, y } = getPos(e.clientX, e.clientY);
		const ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.lineTo(x, y);
			ctx.stroke();
		}
	};

	const stopDrawing = () => {
		drawing.current = false;
	};

	const clearCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (canvas && ctx) {
			ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		}
	};

	// Touch events
	const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
		e.preventDefault();
		drawing.current = true;
		const touch = e.touches[0];
		const { x, y } = getPos(touch.clientX, touch.clientY);
		const ctx = canvasRef.current?.getContext('2d');
		if (ctx) {
			ctx.lineWidth = 6;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.beginPath();
			ctx.moveTo(x, y);
		}
	};

	const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
		e.preventDefault();
		if (!drawing.current) return;
		const touch = e.touches[0];
		const { x, y } = getPos(touch.clientX, touch.clientY);
		const ctx = canvasRef.current?.getContext('2d');
		if (ctx) {
			ctx.lineTo(x, y);
			ctx.stroke();
		}
	};

	const handleTouchEnd = () => {
		drawing.current = false;
	};

	const strokeImage = strokeImages[`../../assets/kanaStrokes/${kana}.svg`];

	// Expose clearCanvas to parent via ref (e.g. Dialog)
	useImperativeHandle(ref, () => ({
		clearCanvas,
	}));

	return (
		<Box
			sx={{
				position: 'relative',
				width: CANVAS_SIZE,
				height: CANVAS_SIZE,
				overflow: 'hidden',
				bgcolor: '#fff3e0',
			}}
		>
			{/* Background stroke hint image */}
			<Box
				component="img"
				src={strokeImage}
				alt={kana}
				draggable={false}
				sx={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: CANVAS_SIZE,
					height: CANVAS_SIZE,
					objectFit: 'contain',
					zIndex: 0,
					pointerEvents: 'none',
					userSelect: 'none',
					opacity: 0.3,
				}}
			/>
			{/* Drawing canvas layer */}
			<Box
				component="canvas"
				ref={canvasRef}
				width={CANVAS_SIZE}
				height={CANVAS_SIZE}
				sx={{
					border: '1px solid #cccccc',
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
				onContextMenu={(e) => e.preventDefault()}
			/>
		</Box>
	);
});

KanaCanvas.displayName = 'KanaCanvas';

export default KanaCanvas;