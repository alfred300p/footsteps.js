(function(document) {
	// this will simulate people walking on the page background,
	// which is simultaneously cool and creepy
	// sadly, people don't bump into each other when their paths intersect
	// collisions should definitely come on v2, with the subsequent buttprints

	function extend(original) {
		// extend the first object with the following objects' properties; return the first object
		for (var i = 1, l = arguments.length; i < l; ++i) {
			for (var key in arguments[i]) {
				original[key] = arguments[i][key];
			}
		}
		return original;
	}

	function px(v) {
		return v + 'px';
	}

	function point(x, y) {
		return {x:x, y:y};
	}

	function make(style, parent) {
		var div = document.createElement('div');
		extend(div.style, style || {});
		(parent || container).appendChild(div);
		return div;
	}

	function footprint(pos, sole, left, angle) {
		// adds a footprint, which will fade automatically
		function fade() {
			opacity -= 0.025;
			if (opacity <= 0) {
				// fade done, the element is no longer necessary
				container.removeChild(div);
			} else {
				div.style.opacity = opacity;
				setTimeout(fade, 50);
			}
		}

		// build style
		var transform = 'rotate(' + (angle || 0) + 'deg)' + (left ? 'scaleX(-1)' : '');
		var origin = '50% 50%';
		var style = {
			// position
			position: screen_position,
			display: 'block',
			left: px(pos.x - sprite_width / 2),
			top: px(pos.y - sprite_height / 2),
			// size
			width: px(sprite_width),
			height: px(sprite_height),
			// sprite
			background: 'url(' + sprite_src + ') ' + px((sole||0) * sprite_width * -1) + ' 0 no-repeat',
			// angle
			'-webkit-transform': transform,
			'-webkit-transform-origin': origin,
			'-o-transform': transform,
			'-o-transform-origin': origin,
			'transform': transform,
			'transform-origin': origin
		};
		if (left) extend(style, {
			// there's always a special place in our hearts for IE idiosyncrasies
			'filter': 'FlipH',
			'-ms-filter': '"FlipH"'
		});

		// add the div, schedule fading
		var div = make(style);
		var opacity = 1;
		setTimeout(fade, 5000);
	}

	function pythagorize(start, angle, length) {
		// sum vectors 'n stuff; don't ask why -90
		return point(
			start.x + length * Math.cos((angle - 90) * Math.PI / 180),
			start.y + length * Math.sin((angle - 90) * Math.PI / 180)
		)
	}

	function random(min, max) {
		// Math.random() wrapper, because convenience
		if (max === undefined) {
			max = min;
			min = 0;
		}
		return min + Math.floor(Math.random() * (max - min));
	}

	function new_walker() {
		// adds a new walker
		function edge_point(edge) {
			// returns a random point between 10% and 90% of the specified edge
			return point(
				edge == 1 ? screen_size.x : (edge == 3 ? 0 : random(screen_size.x * 0.1, screen_size.x * 0.9)),
				edge == 2 ? screen_size.y : (edge == 0 ? 0 : random(screen_size.y * 0.1, screen_size.y * 0.9))
			);
		}

		function next_step(argument) {
			distance += step_distance;
			var pt = pythagorize(start, angle, distance);
			var step_point = pythagorize(pt, angle - 90, foot_spacing * (left ? 1 : -1));
			footprint(step_point, sole, left, angle);
			if (distance <= total_distance) {
				left = !left;
				setTimeout(next_step, step_interval);
			} else {
				new_walker();
			}
		}

		// determine the gait characteristics
		var screen_size = get_container_size();
		var step_interval = random(1500, 500);
		var step_distance = random(sprite_height * 0.5, sprite_height * 1.5);
		var foot_spacing = random(sprite_width / 2, sprite_width * 2);
		var sole = random(sprite_count);

		// determine the start and end points for the walk
		var starting_edge = random(4); // 0:top, 1:right, 2:bottom, 3:left
		var ending_edge;
		do { ending_edge = random(4); } while (starting_edge == ending_edge);
		var start = edge_point(starting_edge);
		var end = edge_point(ending_edge);

		// get the total distance and angle
		var total_distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
		var angle = 90 - (Math.atan2(-(end.y - start.y), (end.x - start.x))) * 180 / Math.PI;

		var distance = 0;
		var left = false; // start with the right foot
		next_step();
	}

	function init() {
		if (!document.body) {
			// wait until document is loaded
			setTimeout(init, 50);
			return;
		}
		// use a container to:
		// 1. avoid triggering scroll events when footsteps go outside the body
		// 2. make it easier to get the screen size, through the computed style
		container = make({
			position: 'fixed',
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			'z-index': -1
		}, document.body);

		while (walkers > 0) {
			new_walker();
			walkers--;
		}
	}

	// gets the container/screen style
	var get_container_size = window.getComputedStyle ? function() {
		var style = getComputedStyle(container);
		return point(parseInt(style.width), parseInt(style.height));
	} : function() {
		// because IE (getComputedStyle only on 9.0+)
		var style = container.currentStyle || {};
		return point(parseInt(style.width), parseInt(style.height));
	};

	var sprite_count;
	var container;

	// screen_position: use "absolute" to include whole body; footsteps move when scrolling
	// use "fixed" for visible area only; footsteps don't move when scrolling
	var screen_position = 'absolute';
	var walkers = 3;
	var sprite_src = 'footprints.png';
	var sprite_width = 20;
	var sprite_height = 50;

	// preload sprite, call init() when done
	extend(new Image(), {
		onload: function() {
			sprite_count = this.width / sprite_width;
			init();
		},
		src: sprite_src
	});
})(document);