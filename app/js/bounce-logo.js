import _ from 'lodash';
const paper = require('paper');

let MAX_STRETCH, SPRING_STRENGTH, MOUSE_ATTRECTION_STRENGTH;

const DAMPING = 0.85;

let logo, tool, mousePosition, isTouched, isMoving, movement = 0;
const calibrationValues = [];
const orientation = {
	beta: 0,
	gamma: 0,
};

export const init = () => {
	MAX_STRETCH = window.mobile ? 0.25 : 0.08;
	SPRING_STRENGTH = 0.033;
	MOUSE_ATTRECTION_STRENGTH = window.mobile ? 0.028 : 0.015;
	isTouched = window.mobile ? false : true;

	paper.install(window);

	const canvas = document.getElementsByClassName('paper-canvas')[0];
	paper.setup(canvas);
	mousePosition = new Point(0, 0);
	tool = new Tool();
	tool.onMouseMove = onMouseMove;
	view.onFrame = onFrame;
	view.onResize = () => {
		logo.group.remove();
		logo = Logo(document.getElementById('logo'));
	}

	logo = Logo(document.getElementById('logo'));

	if (!window.mobile) return;

	window.addEventListener('touchstart', onTouchStart);
	window.addEventListener('touchend', onTouchEnd);
	window.addEventListener('deviceorientation', onOrientation);
};

const SpringPoint = (point, r) => {
	const current = point;
	const rest = new Point(point);
	const target = new Point(point);
	const velocity = new Point(0, 0);

	const maxStretch = r * MAX_STRETCH;

	const update = () => {
		const diffMouse = new Point(current).subtract(mousePosition);
		const diffRest = new Point(rest).subtract(current);

		if (diffMouse.length < maxStretch && diffRest.length < maxStretch && (isTouched || isMoving)) { // mouse is close
			const multiplier = 1 - (diffMouse.length / maxStretch);

			target.x = rest.x - (diffMouse.x * multiplier);
			target.y = rest.y - (diffMouse.y * multiplier);

			velocity.x += (target.x - current.x) * MOUSE_ATTRECTION_STRENGTH;
			velocity.y += (target.y - current.y) * MOUSE_ATTRECTION_STRENGTH;
		} else {
			target.x = rest.x;
			target.y = rest.y;

			velocity.x += (target.x - current.x) * SPRING_STRENGTH;
			velocity.y += (target.y - current.y) * SPRING_STRENGTH;
		}

		current.x += velocity.x *= DAMPING;
		current.y += velocity.y *= DAMPING;
	};

	return { update };
};

const Logo = (svg) => {
	const logoSVG = paper.project.importSVG(svg, {
		onError: e => console.log('error', e),
		applyMatrix: true,
		expandShapes: true,
		insert: false,
	});
	const group = new Group();
	const main = logoSVG.children['main'];
	logoSVG._children.forEach(c => group.addChild(c));
	group.addChild(main);

	const ratio = group.bounds.height / group.bounds.width;

	const scale = !window.mobileLayout ? 0.18 : 0.45;
	group.bounds.width = window.innerWidth * scale;
	group.bounds.height = group.bounds.width * ratio;
	group.center = view.center;
	group.center.y -= !window.mobileLayout ? group.bounds.height * 0.4 : group.bounds.height * 0.45;
	group.position = view.center;

	// return;
	const springPoints = [];
	const paths = [];


	const addSpringPoints = (path) => {
		paths.push(path);
		path.segments.forEach((segment, i) => {
			const spring = SpringPoint(segment.point, segment.point.getDistance(new Point(0, 0)));
			springPoints.push(spring);
		});
	};

	group.children.forEach(path => {
		if (path.name === 'main') return path.children.forEach(c => addSpringPoints(c));
		addSpringPoints(path);
	});


	const update = () => {
		springPoints.forEach(spring => spring.update());
		// paths.forEach(p => p.smooth());
	};


	return { update, group };
};

const convertToRange = (value, srcRange, dstRange) => {
	if (value < srcRange[0]) return dstRange[0];
	if (value > srcRange[1]) return dstRange[1];

	const srcMax = srcRange[1] - srcRange[0];
	const dstMax = dstRange[1] - dstRange[0];
	const adjValue = value - srcRange[0];

	return (adjValue * dstMax / srcMax) + dstRange[0];
};

const onMouseMove = ({ point }) => {
	mousePosition.x = point.x;
	mousePosition.y = point.y;
};

const onTouchStart = ({ clientX, clientY }) => {
	isTouched = true;
	onMouseMove({ point: { x: clientX, y: clientY }});
};

const onTouchEnd = () => {
	isTouched = false;
};

const onOrientation = ({ alpha, beta, gamma }) => {
	if (isTouched) return;
	let _b = window.innerWidth < window.innerHeight ? beta : gamma;
	const _g = window.innerWidth < window.innerHeight ? gamma : beta;

	if (calibrationValues.length > 60 * 6) calibrationValues.shift();
	calibrationValues.push(_b);
	let calibration = calibrationValues.reduce((acc, val) => acc + val);
	calibration /= calibrationValues.length;

	_b -= calibration;

	const x = convertToRange(_g, [-34, 34], [window.innerWidth * 0.18, window.innerWidth * 0.82]);
	const y = convertToRange(_b, [-45, 45], [window.innerHeight * 0.16, window.innerHeight * 0.55]);

	if (movement < 50) {
		movement += Math.abs(beta - orientation.beta);
		movement += Math.abs(gamma - orientation.gamma);
	}

	orientation.beta = beta;
	orientation.gamma = gamma;

	// document.querySelector('.tilt').style.top = y + 'px';
	// document.querySelector('.tilt').style.left = x + 'px';

	onMouseMove({ point: { x, y }});
};

const onFrame = () => {
	if (movement > 0) movement -= 1;
	if (movement > 10) {
		isMoving = true;
	} else {
		isMoving = false;
	}

	if (logo) logo.update();
};
