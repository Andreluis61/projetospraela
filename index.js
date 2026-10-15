const canvas = document.querySelector("#word-heart");
const context = canvas.getContext("2d");
const fallingCanvas = document.querySelector("#falling-hearts");
const fallingContext = fallingCanvas.getContext("2d");
const replayButton = document.querySelector("#replay-heart");

const phrases = [
	"Amo seus beijinhos.",
	"Amo seu sorriso.",
	"Amo seus abraços.",
	"Amo seus risos.",
	"Amo seus cachinhos.",
	"Amo tudo em você."
];
const colors = ["#ff78ad", "#fff0f6", "#ffb1d0", "#f75c98"];
const words = phrases.join(" ").split(/\s+/);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let placements = [];
let animationFrame = 0;
let animationStart = 0;
let fallingHearts = [];
let fallingFrame = 0;
let previousFallingFrame = 0;

function resizeFallingHearts() {
	const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
	fallingCanvas.width = Math.round(window.innerWidth * pixelRatio);
	fallingCanvas.height = Math.round(window.innerHeight * pixelRatio);
	fallingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

	const count = Math.min(140, Math.max(60, Math.round(window.innerWidth / 14)));
	fallingHearts = Array.from({ length: count }, () => ({
		x: Math.random() * window.innerWidth,
		y: Math.random() * window.innerHeight,
		size: 9 + Math.random() * 12,
		speed: 42 + Math.random() * 58,
		drift: 8 + Math.random() * 20,
		phase: Math.random() * Math.PI * 2,
		rotation: (Math.random() - 0.5) * 0.55,
		spin: (Math.random() - 0.5) * 0.16,
		opacity: 0.32 + Math.random() * 0.42,
		color: colors[Math.floor(Math.random() * colors.length)]
	}));

	if (!fallingFrame) {
		previousFallingFrame = 0;
		fallingFrame = requestAnimationFrame(animateFallingHearts);
	}
}

function drawFallingHearts(elapsed) {
	const width = window.innerWidth;
	const height = window.innerHeight;
	fallingContext.clearRect(0, 0, width, height);

	for (const heart of fallingHearts) {
		const sway = reducedMotion.matches ? 0 : Math.sin(elapsed * 0.0007 + heart.phase) * heart.drift;
		fallingContext.save();
		fallingContext.translate(heart.x + sway, heart.y);
		fallingContext.rotate(heart.rotation);
		fallingContext.scale(heart.size, heart.size);
		fallingContext.globalAlpha = heart.opacity;
		fallingContext.fillStyle = heart.color;
		fallingContext.beginPath();
		fallingContext.moveTo(0, 0.46);
		fallingContext.bezierCurveTo(-0.18, 0.31, -0.5, 0.08, -0.5, -0.18);
		fallingContext.bezierCurveTo(-0.5, -0.49, -0.12, -0.56, 0, -0.29);
		fallingContext.bezierCurveTo(0.12, -0.56, 0.5, -0.49, 0.5, -0.18);
		fallingContext.bezierCurveTo(0.5, 0.08, 0.18, 0.31, 0, 0.46);
		fallingContext.fill();
		fallingContext.restore();
	}
}

function animateFallingHearts(timestamp) {
	const delta = previousFallingFrame ? Math.min((timestamp - previousFallingFrame) / 1000, 0.05) : 0;
	previousFallingFrame = timestamp;

	for (const heart of fallingHearts) {
		heart.y += heart.speed * delta;
		heart.rotation += heart.spin * delta;
		if (heart.y > window.innerHeight + heart.size) {
			heart.y = -heart.size;
			heart.x = Math.random() * window.innerWidth;
		}
	}

	drawFallingHearts(timestamp);
	fallingFrame = requestAnimationFrame(animateFallingHearts);
}

function buildHeart() {
	const bounds = canvas.getBoundingClientRect();
	if (!bounds.width || !bounds.height) return false;

	const pixelRatio = window.devicePixelRatio || 1;
	canvas.width = Math.round(bounds.width * pixelRatio);
	canvas.height = Math.round(bounds.height * pixelRatio);
	context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

	const fontSize = Math.max(11, Math.min(19, bounds.width / 43));
	const lineHeight = fontSize * 1.3;
	const centerX = bounds.width / 2;
	const heartHeight = bounds.height * 0.94;
	const heartWidth = Math.min(heartHeight * 0.96, bounds.width * 0.9);
	const heartLeft = centerX - heartWidth / 2;
	const heartTop = (bounds.height - heartHeight) / 2;
	const heartPath = new Path2D();
	heartPath.moveTo(centerX, heartTop + heartHeight * 0.98);
	heartPath.bezierCurveTo(centerX - heartWidth * 0.48, heartTop + heartHeight * 0.80, heartLeft, heartTop + heartHeight * 0.61, heartLeft, heartTop + heartHeight * 0.37);
	heartPath.bezierCurveTo(heartLeft, heartTop + heartHeight * 0.07, centerX - heartWidth * 0.24, heartTop + heartHeight * 0.02, centerX, heartTop + heartHeight * 0.25);
	heartPath.bezierCurveTo(centerX + heartWidth * 0.24, heartTop + heartHeight * 0.02, centerX + heartWidth / 2, heartTop + heartHeight * 0.07, centerX + heartWidth / 2, heartTop + heartHeight * 0.37);
	heartPath.bezierCurveTo(centerX + heartWidth / 2, heartTop + heartHeight * 0.61, centerX + heartWidth * 0.48, heartTop + heartHeight * 0.80, centerX, heartTop + heartHeight * 0.98);
	heartPath.closePath();
	const sampleStep = Math.max(2, fontSize / 6);
	let wordIndex = 0;
	placements = [];

	context.font = `600 ${fontSize}px Georgia, "Times New Roman", serif`;
	context.textAlign = "left";
	context.textBaseline = "middle";

	for (let y = heartTop + lineHeight / 2; y < heartTop + heartHeight; y += lineHeight) {
		const segments = [];
		let segmentStart = null;
		let lastInside = null;

		for (let x = heartLeft; x <= heartLeft + heartWidth; x += sampleStep) {
			if (context.isPointInPath(heartPath, x, y)) {
				if (segmentStart === null) segmentStart = x;
				lastInside = x;
			} else if (segmentStart !== null) {
				segments.push([segmentStart, lastInside]);
				segmentStart = null;
			}
		}
		if (segmentStart !== null) segments.push([segmentStart, lastInside]);

		for (const [leftEdge, rightEdge] of segments) {
			const lineWidth = rightEdge - leftEdge - fontSize * 0.4;
			const lineWords = [];
			let usedWidth = 0;

			while (lineWords.length < 80) {
				const word = words[wordIndex % words.length];
				const wordWidth = context.measureText(`${word} `).width;
				if (usedWidth + wordWidth > lineWidth) break;
				lineWords.push({ word, width: wordWidth, color: colors[wordIndex % colors.length] });
				usedWidth += wordWidth;
				wordIndex += 1;
			}

			let xPosition = (leftEdge + rightEdge) / 2 - usedWidth / 2;
			const yPosition = y;
			for (const item of lineWords) {
				const order = placements.length;
				const wordCenter = xPosition + item.width / 2;
				const direction = wordCenter < centerX ? -1 : 1;
				placements.push({
					...item,
					x: xPosition,
					y: yPosition,
					offsetX: reducedMotion.matches ? 0 : direction * (24 + Math.abs(Math.sin(order * 12.9898)) * 20),
					offsetY: reducedMotion.matches ? 0 : 10 + Math.abs(Math.cos(order * 7.233)) * 12,
					delay: order
				});
				xPosition += item.width;
			}
		}
	}

	const stagger = reducedMotion.matches ? 300 : 1100;
	placements.forEach((item, index) => {
		item.delay = placements.length > 1 ? index / (placements.length - 1) * stagger : 0;
	});
	return true;
}

function drawFrame(timestamp) {
	const bounds = canvas.getBoundingClientRect();
	context.clearRect(0, 0, bounds.width, bounds.height);
	let isComplete = true;
	const wordDuration = reducedMotion.matches ? 400 : 650;

	for (const item of placements) {
		const progress = Math.min(1, Math.max(0, (timestamp - animationStart - item.delay) / wordDuration));
		if (progress < 1) isComplete = false;
		if (!progress) continue;

		const eased = 1 - (1 - progress) ** 3;
		context.globalAlpha = eased;
		context.fillStyle = item.color;
		context.fillText(item.word, item.x + item.offsetX * (1 - eased), item.y + item.offsetY * (1 - eased));
	}

	context.globalAlpha = 1;
	if (!isComplete) animationFrame = requestAnimationFrame(drawFrame);
	else animationFrame = 0;
}

function replayHeart() {
	if (animationFrame) cancelAnimationFrame(animationFrame);
	if (!buildHeart()) return;

	animationStart = performance.now();
	animationFrame = requestAnimationFrame(drawFrame);
}

const resizeObserver = new ResizeObserver(replayHeart);
resizeObserver.observe(canvas);
replayButton.addEventListener("click", replayHeart);
window.addEventListener("resize", resizeFallingHearts);
resizeFallingHearts();
replayHeart();
