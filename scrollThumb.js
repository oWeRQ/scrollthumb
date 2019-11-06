function listenPointerMove(el, onMove, onEnd) {
	function onEndHandler(event) {
		if (typeof onEnd === 'function') {
			onEnd.call(this, event);
		}

		el.removeEventListener('mousemove', onMove);
		el.removeEventListener('mouseup', onEndHandler);
		el.removeEventListener('mouseleave', onEndHandler);

		el.removeEventListener('touchmove', onMove);
		el.removeEventListener('touchend', onEndHandler);
		el.removeEventListener('touchcancel', onEndHandler);
	}

	el.addEventListener('mousemove', onMove, {passive: true});
	el.addEventListener('mouseup', onEndHandler, {passive: true});
	el.addEventListener('mouseleave', onEndHandler, {passive: true});

	el.addEventListener('touchmove', onMove, {passive: true});
	el.addEventListener('touchend', onEndHandler, {passive: true});
	el.addEventListener('touchcancel', onEndHandler, {passive: true});

	return onEndHandler;
}

function getEventOffset(event, el) {
	var rect = el.getBoundingClientRect();
	var pointer = (event.targetTouches ? event.targetTouches[0] : event);

	return {
		left: pointer['clientX'] - rect['left'],
		top: pointer['clientY'] - rect['top'],
	};
}

function scrollThumb(options) {
	options = Object.assign({
		content: null,
		track: null,
		thumb: null,
		axis: 'y',
		activeClass: 'm-active',
		alwaysShow: false,
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

	function setScroll(offset) {
		var scrollOffsetMax = options.content[scrollSize] - options.content[clientSize];

		options.content[scrollOffset] = scrollOffsetMax * offset;
	}

	function setThumb(offset) {
		var size = options.content[clientSize] / options.content[scrollSize];

		options.thumb.style[styleSize] = size * 100 + '%';
		options.thumb.style[styleOffset] = offset * (1 - size) * 100 + '%';
	}

	function updateThumb() {
		var scrollOffsetMax = options.content[scrollSize] - options.content[clientSize];

		options.track.hidden = (scrollOffsetMax === 0 && !options.alwaysShow);

		if (scrollOffsetMax) {
			setThumb(options.content[scrollOffset] / scrollOffsetMax);
		} else if (options.alwaysShow) {
			setThumb(0);
		}
	}

	var startThumbOffset = null;
	function onMoveThumb(event) {
		var trackOffset = getEventOffset(event, options.track)[styleOffset];
		var thumbSize = options.track[clientSize] * options.content[clientSize] / options.content[scrollSize];
		var thumbOffset = (startThumbOffset || thumbSize / 2);
		var offset = (trackOffset - thumbOffset) / (options.track[clientSize] - thumbSize);

		setScroll(offset);
	}

	function onDragThumb(event) {
		if (event.type === 'mousedown') {
			event.preventDefault(); // prevent text selection
		}

		startThumbOffset = (event.target === options.thumb ? getEventOffset(event, options.thumb)[styleOffset] : null);

		options.track.classList.add(options.activeClass);
		listenPointerMove(document, onMoveThumb, function(e) {
			options.track.classList.remove(options.activeClass);
		});
	}

	function init() {
		updateThumb();
		options.content.addEventListener('scroll', updateThumb, {passive: true});
		window.addEventListener('resize', updateThumb, {passive: true});

		options.track.addEventListener('click', onMoveThumb);
		options.track.addEventListener('mousedown', onDragThumb);
		options.track.addEventListener('touchstart', onDragThumb);
	}

	function destroy() {
		options.content.removeEventListener('scroll', updateThumb);
		window.removeEventListener('resize', updateThumb);

		options.track.removeEventListener('click', onMoveThumb);
		options.track.removeEventListener('mousedown', onDragThumb);
		options.track.removeEventListener('touchstart', onDragThumb);
	}

	init();

	return destroy;
}