import MobileDetect from 'mobile-detect';
import { init } from './js/bounce-logo.js';

const kickIt = () => {
	const md = new MobileDetect(window.navigator.userAgent);
	window.mobile = md.mobile() ? true : false;

	init();
};


document.addEventListener('DOMContentLoaded', kickIt);