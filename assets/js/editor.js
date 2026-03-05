/**
 * Elementor Editor Integration Script
 */

;(function() {
	'use strict';

	window.addEventListener('elementor/frontend/init', function() {
		// Widget handler for preview
		elementorFrontend.hooks.addAction(
			'frontend/element_ready/mattress-simulator.default',
			function($scope) {
				// Re-initialize the simulator for preview
				if (typeof MattressSizeSimulator !== 'undefined') {
					new MattressSizeSimulator($scope);
				}
			}
		);
	});
})();
