import MobileDetect from 'mobile-detect';
import { init } from './js/bounce-logo.js';

const kickIt = () => {
	const md = new MobileDetect(window.navigator.userAgent);
	window.mobile = md.mobile() ? true : false;
	window.mobileLayout = (window.innerWidth <= 768) && (window.innerWidth < window.innerHeight);

	window.addEventListener('resize', () => {
		window.mobileLayout = (window.innerWidth <= 768) && (window.innerWidth < window.innerHeight);
	});

	init();
};


document.addEventListener('DOMContentLoaded', kickIt);