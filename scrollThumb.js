function listenPointerMove(el, onMove, onEnd) {
	function onEndWrap(event) {
		if (typeof onEnd === 'function') {
			onEnd.call(this, event);
		}

		detach();
	}

	function attach() {
		el.addEventListener('mousemove', onMove, {passive: true});
		el.addEventListener('mouseup', onEndWrap, {passive: true});
		el.addEventListener('mouseleave', onEndWrap, {passive: true});

		el.addEventListener('touchmove', onMove, {passive: true});
		el.addEventListener('touchend', onEndWrap, {passive: true});
		el.addEventListener('touchcancel', onEndWrap, {passive: true});
	}

	function detach() {
		el.removeEventListener('mousemove', onMove);
		el.removeEventListener('mouseup', onEndWrap);
		el.removeEventListener('mouseleave', onEndWrap);

		el.removeEventListener('touchmove', onMove);
		el.removeEventListener('touchend', onEndWrap);
		el.removeEventListener('touchcancel', onEndWrap);
	}

	attach();

	return detach;
}

function getEventOffset(event, el) {
	var rect = (el instanceof HTMLElement ? el.getBoundingClientRect() : {left: 0, top: 0});
	var pointer = (event.targetTouches ? event.targetTouches[0] : event);

	return {
		left: pointer['clientX'] - rect['left'],
		top: pointer['clientY'] - rect['top'],
	};
}

function scrollThumb(options) {
	'use strict';

	options = Object.assign({
		content: null,
		track: null,
		thumb: null,
		axis: 'y',
		activeClass: 'm-active',
		alwaysShow: false,
		scrollSteps: 0,
	}, options);

	if (!(options.content instanceof HTMLElement && options.track instanceof HTMLElement && options.thumb instanceof HTMLElement)) {
		console.error('scrollThumb options: content, track and thumb must be HTMLElement');
		return;
	}

	if (options.axis === 'x') {
		var clientOffset = 'clientX';
		var clientSize = 'clientWidth';
		var scrollOffset = 'scrollLeft';
		var scrollSize = 'scrollWidth';
		var styleOffset = 'left';
		var styleSize = 'width';
	} else if (options.axis === 'y') {
		var clientOffset = 'clientY';
		var clientSize = 'clientHeight';
		var scrollOffset = 'scrollTop';
		var scrollSize = 'scrollHeight';
		var styleOffset = 'top';
		var styleSize = 'height';
	} else {
		console.error('scrollThumb options: wrong axis');
		return;
	}

	var scrollOffsetMax = 0;
	var visibleArea = 0;
	var trackSize = 0;
	var thumbSize = 0;
	var thumbOffset = 0;

	function getScroll() {
		return options.content[scrollOffset] / scrollOffsetMax;
	}

	function setScroll(scroll) {
		options.content[scrollOffset] = scrollOffsetMax * scroll;
	}

	function renderThumb() {
		options.thumb.style[styleSize] = visibleArea * 100 + '%';
		options.thumb.style[styleOffset] = getScroll() * (1 - visibleArea) * 100 + '%';
	}

	function refresh() {
		scrollOffsetMax = options.content[scrollSize] - options.content[clientSize];
		visibleArea = options.content[clientSize] / options.content[scrollSize];
		trackSize = options.track[clientSize];
		thumbSize = trackSize * visibleArea;

		options.track.hidden = (scrollOffsetMax === 0 && !options.alwaysShow);

		renderThumb();
	}

	function onMoveThumb(event) {
		var trackOffset = getEventOffset(event, options.track)[styleOffset];

		if (options.scrollSteps) {
			var stepArea = visibleArea / options.scrollSteps;
			var scrollArea = (trackOffset - thumbOffset) / trackSize;
			var scroll = Math.round(scrollArea / stepArea) * stepArea / (1 - visibleArea);
		} else {
			var scroll = (trackOffset - thumbOffset) / (trackSize - thumbSize);
		}

		setScroll(scroll);
	}

	function onDragThumb(event) {
		if (event.type === 'mousedown') {
			event.preventDefault(); // prevent text selection
		}

		if (event.target === options.thumb) {
			thumbOffset = getEventOffset(event, options.thumb)[styleOffset];
		} else {
			thumbOffset = thumbSize / 2;
		}

		options.track.classList.add(options.activeClass);
		listenPointerMove(document, onMoveThumb, function(e) {
			options.track.classList.remove(options.activeClass);
		});
	}

	function attach() {
		refresh();
		window.addEventListener('resize', refresh, {passive: true});
		options.content.addEventListener('scroll', renderThumb, {passive: true});

		options.track.addEventListener('click', onMoveThumb, {passive: true});
		options.track.addEventListener('mousedown', onDragThumb, {passive: false});
		options.track.addEventListener('touchstart', onDragThumb, {passive: true});
	}

	function detach() {
		window.removeEventListener('resize', refresh);
		options.content.removeEventListener('scroll', renderThumb);

		options.track.removeEventListener('click', onMoveThumb);
		options.track.removeEventListener('mousedown', onDragThumb);
		options.track.removeEventListener('touchstart', onDragThumb);
	}

	attach();

	return {
		attach: attach,
		detach: detach,
		refresh: refresh,
		setScroll: setScroll,
	};
}