/**
 * Smooth scroll
 * ------------------------------------------------------
 * Enable smooth scrolling to the href anchor on the element.
 * Author: Jeroen Ransijn, Raoul de Best
 * Company: Aan Zee
 * Inspired by https://github.com/cferdinandi/smooth-scroll/blob/master/src/js/smooth-scroll.js
 * Version: 1.0.0
 * ------------------------------------------------------
 * Usage:
 * Auto initialized for every anchor tag
 * Add 'data-smooth-scroll="disable"' to disable for a link
 * Add 'data-smooth-scroll="click"' to scroll and trigger a click
 */
(function (root, factory) {

	if ( typeof define === 'function' && define.amd ) {
		define([], factory(root));
	} else if ( typeof exports === 'object' ) {
		module.exports = factory(root);
	} else {
		root.smoothScroll = factory(root);
	}
})(this, function (root) {
	'use strict';

	var settings = {
		speed: 4000, // px / second
		easing: 'easeInOutCubic',
		offset: 1/20  // percentage of viewport height (relative)
	};

	/**
	 * Calculate the easing pattern
	 * @private
	 * @link https://gist.github.com/gre/1650294
	 * @param {String} type Easing pattern
	 * @param {Number} time Time animation should take to complete
	 * @returns {Number}
	 */
	var easingPattern = function ( type, time ) {
		var pattern;
		if ( type === 'easeInOutCubic' ) pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1; // acceleration until halfway, then deceleration
		return pattern || time; // no easing, no acceleration
	};

	/**
	 * Scroll to a certain destination
	 * @private
	 * @param {Node} destination, The element
	 */
	var scrollTo = function (destination, callback) {
		var startLocation = root.pageYOffset;
		var documentHeight = getDocumentHeight();
		var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
		var endLocation = getEndLocation(destination) - (viewportHeight * parseFloat(settings.offset));
		var height = getHeight(destination);
		var distance = endLocation - startLocation; // distance to travel
		var animationInterval; // interval timer
		var timeLapsed = 0;
		var percentage, position;
		var acceleration;
		var timeToAnimate = distance / parseInt(settings.speed, 10) * 1000;

		/**
		 * Loop scrolling animation
		 * @private
		 */
		var loopAnimateScroll = function () {
			timeLapsed += 16;
			percentage = ( timeLapsed / timeToAnimate );
			percentage = ( percentage > 1 ) ? 1 : percentage;

			// Check for negative  acceleration value for scrolling upwards
			acceleration = easingPattern(settings.easing, percentage);
			if(acceleration < 0 ){
				acceleration *= -1;
			}

			position = startLocation + ( distance * acceleration );
			root.scrollTo( 0, Math.floor(position) );
			stopAnimateScroll(position, endLocation, animationInterval);
		};

		/**
		 * Stop the scroll animation when it reaches its target (or the bottom/top of page)
		 * @private
		 * @param {Number} position Current position on the page
		 * @param {Number} endLocation Scroll to location
		 * @param {Number} animationInterval How much to scroll on this loop
		 */
		var stopAnimateScroll = function (position, endLocation, animationInterval) {
			var currentLocation = root.pageYOffset;
			if ( position == endLocation || currentLocation == endLocation || ( (root.innerHeight + currentLocation) >= documentHeight || position < 0 ) ) {
				clearInterval(animationInterval);
				destination.focus();
				if (callback) callback();
			}
		};

		/**
		 * Set interval timer
		 * @private
		 */
		var startAnimateScroll = function () {
			animationInterval = setInterval(loopAnimateScroll, 16);
		};

		/**
		 * Reset position to fix weird iOS bug
		 * @link https://github.com/cferdinandi/smooth-scroll/issues/45
		 */
		if ( root.pageYOffset === 0 ) {
			root.scrollTo( 0, 0 );
		}

		// Start scrolling animation
		startAnimateScroll();
	}

	/**
	 * Scroll to a certain destination
	 * @private
	 * @param {Node} destination, The element
	 * @return {Number} The height of the element
	 */
	var getHeight = function (elem) {
		return Math.max( elem.scrollHeight, elem.offsetHeight, elem.clientHeight );
	}

	/**
	 * Calculate how far to scroll
	 * @private
	 * @param {Element} anchor The anchor element to scroll to
	 * @returns {Number}
	 */
	var getEndLocation = function (anchor) {
		var location = 0;
		if (anchor.offsetParent) {
			do {
				location += anchor.offsetTop;
				anchor = anchor.offsetParent;
			} while (anchor);
		}
		location = location ;
		return location >= 0 ? location : 0;
	};

	/**
	 * Determine the document's height
	 * @private
	 * @returns {Number}
	 */
	var getDocumentHeight = function () {
		return Math.max(
			document.body.scrollHeight, document.documentElement.scrollHeight,
			document.body.offsetHeight, document.documentElement.offsetHeight,
			document.body.clientHeight, document.documentElement.clientHeight
		);
	};

	/**
	 * Update the URL
	 * @private
	 * @param {Element} anchor The element to scroll to
	 * @param {Boolean} url Whether or not to update the URL history
	 */
	var updateUrl = function ( anchor, url ) {
		if ( history.pushState && (url || url === 'true') ) {
			history.pushState( null, null, [root.location.protocol, '//', root.location.host, root.location.pathname, root.location.search, anchor].join('') );
		}
	};

	/**
	 * Gets called at the start
	 */
	function smoothScroll () {
		function handler (e) {
			var href = this.getAttribute('href'), linkedElement;

			if (href && href.substring(0,1) === '#' && this.dataset.smoothScroll !== 'ignore') {
				linkedElement = document.getElementById(href.substr(1));

				if (linkedElement) {
					e.preventDefault();
					if (this.dataset.smoothScroll === 'click') {
						scrollTo(linkedElement, function () {
							// Trigger a custom click
							window.setTimeout(function () {
								var event = document.createEvent('HTMLEvents');
								event.initEvent('click', true, false);
								linkedElement.dispatchEvent(event);
							}, 300);
						});
					} else {
						scrollTo(linkedElement);
					}

					updateUrl(href, false)
				}
			}
		}

		document.addEventListener('click', function (e) {

			for (var target = e.target; target && target != this; target = target.parentNode) {
				// loop parent nodes from the target to the delegation node
				if (target.tagName === 'A') {
					handler.call(target, e);
					break;
				}
			}
		}, false);
	}

	return smoothScroll;
});
