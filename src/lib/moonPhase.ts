// SVG path for the lit part of the moon at phase index 0–7
// (0 new, 2 first quarter, 4 full, 6 last quarter), on a 20×20 box, r = 8.
// The lit limb is a semicircle; the terminator is a half-ellipse whose
// width follows cos(2π·phase) and bulges toward the lit side for a crescent
// and toward the dark side for a gibbous moon.

export function moonLitPath(index: number): string {
	const i = ((Math.round(index) % 8) + 8) % 8;
	const f = i / 8;
	const k = Math.cos(2 * Math.PI * f); // 1 new … -1 full
	const rx = Math.abs(k) * 8;
	const waxing = f < 0.5;
	const crescent = k > 0;
	// Limb: top → bottom along the lit side.
	const limb = waxing ? 'A8 8 0 0 1 10 18' : 'A8 8 0 0 0 10 18';
	// Terminator: bottom → top. sweep 0 passes the right side, 1 the left.
	const sweep = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
	return `M10 2 ${limb} A${rx.toFixed(3)} 8 0 0 ${sweep} 10 2Z`;
}
