(function($) {
	'use strict';

	/**
	 * Mattress Size Simulator
	 */
	class MattressSizeSimulator {
		constructor($wrapper) {
			this.$wrapper = $wrapper;
			this.$productSelect = $wrapper.find('#mss-product-select');
			this.$genderSelect = $wrapper.find('#mss-gender-select');
			this.$heightInput = $wrapper.find('#mss-height-input');
			this.$shoulderWidthInput = $wrapper.find('#mss-shoulder-width-input');
			this.$canvas = $wrapper.find('#mss-canvas');

			// SVG elements and cache
			this.mattressSvgElement = null;
			this.silhouetteSvgElement = null;
			this.svgCache = {};
			this.isRendering = false;

			// SVG URLs
			this.svgUrls = window.mattressSizeSimulatorData ? window.mattressSizeSimulatorData.svgUrls : {};
			this.products = window.mattressSizeSimulatorData ? window.mattressSizeSimulatorData.products : [];

			// Canvas dimensions
			this.canvasWidth = this.$canvas.width();
			this.canvasHeight = this.$canvas.height();
			this.maxCanvasWidth = window.mattressSizeSimulatorData ? window.mattressSizeSimulatorData.maxCanvasWidth : 600;
			this.minHeight = window.mattressSizeSimulatorData ? window.mattressSizeSimulatorData.minHeight : 400;

			// Current state
			this.currentProduct = null;
			this.currentGender = 'male';
			this.currentHeight = 170;
			this.currentShoulderWidth = 45;

			// Silhouette position for dragging
			this.silhouetteOffsetX = 0;
			this.silhouetteOffsetY = 0;
			this.isDragging = false;
			this.dragStartX = 0;
			this.dragStartY = 0;
			this.lastRenderTime = 0;

			this.init();
		}

		init() {
			// Load initial product
			this.loadProduct();

			// Bind events
			this.$productSelect.on('change', () => this.onProductChange());
			this.$genderSelect.on('change', () => this.onGenderChange());
			this.$heightInput.on('input', () => this.onHeightChange());
			this.$shoulderWidthInput.on('input', () => this.onShoulderWidthChange());

			// Bind mouse events for dragging
			this.$canvas.on('mousedown', (e) => this.onMouseDown(e));
			$(document).on('mousemove', (e) => this.onMouseMove(e));
			$(document).on('mouseup', () => this.onMouseUp());

			// Bind touch events for mobile
			this.$canvas.on('touchstart', (e) => this.onTouchStart(e));
			$(document).on('touchmove', (e) => this.onTouchMove(e));
			$(document).on('touchend', () => this.onTouchEnd());

			// Handle window resize
			$(window).on('resize', () => this.onWindowResize());

			// Initial render
			this.render();
		}

		loadProduct() {
			const selectedOption = this.$productSelect.find('option:selected');
			const productJson = selectedOption.val();
			try {
				this.currentProduct = JSON.parse(productJson);
			} catch (e) {
				console.error('Error parsing product JSON:', e);
				this.currentProduct = this.products[0];
			}
		}

		onProductChange() {
			this.loadProduct();
			this.silhouetteOffsetX = 0;
			this.silhouetteOffsetY = 0;
			this.render();
		}

		onGenderChange() {
			this.currentGender = this.$genderSelect.val();
			this.render();
		}

		onHeightChange() {
			this.currentHeight = parseInt(this.$heightInput.val(), 10);
			this.debounceRender();
		}

		onShoulderWidthChange() {
			this.currentShoulderWidth = parseInt(this.$shoulderWidthInput.val(), 10);
			this.debounceRender();
		}

		debounceRender() {
			const now = Date.now();
			if (now - this.lastRenderTime < 100) {
				// Skip render if less than 100ms since last render
				return;
			}
			this.lastRenderTime = now;
			this.render();
		}

		onWindowResize() {
			this.canvasWidth = this.$canvas.width();
			this.canvasHeight = this.$canvas.height();
			this.render();
		}

		onMouseDown(e) {
			if (!this.silhouetteSvgElement) return;

			const rect = this.$canvas[0].getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			if (this.isSilhouetteClicked(mouseX, mouseY)) {
				this.isDragging = true;
				this.dragStartX = mouseX;
				this.dragStartY = mouseY;
				this.$canvas.css('cursor', 'grabbing');
			}
		}

		onMouseMove(e) {
			if (!this.isDragging) return;

			const rect = this.$canvas[0].getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			const deltaX = mouseX - this.dragStartX;
			const deltaY = mouseY - this.dragStartY;

			this.silhouetteOffsetX += deltaX;
			this.silhouetteOffsetY += deltaY;

			this.dragStartX = mouseX;
			this.dragStartY = mouseY;

			this.render();
		}

		onMouseUp() {
			if (this.isDragging) {
				this.isDragging = false;
				this.$canvas.css('cursor', 'grab');
			}
		}

		onTouchStart(e) {
			if (!this.silhouetteSvgElement) return;

			const touch = e.touches[0];
			const rect = this.$canvas[0].getBoundingClientRect();
			const touchX = touch.clientX - rect.left;
			const touchY = touch.clientY - rect.top;

			if (this.isSilhouetteClicked(touchX, touchY)) {
				this.isDragging = true;
				this.dragStartX = touchX;
				this.dragStartY = touchY;
			}
		}

		onTouchMove(e) {
			if (!this.isDragging) return;
			e.preventDefault();

			const touch = e.touches[0];
			const rect = this.$canvas[0].getBoundingClientRect();
			const touchX = touch.clientX - rect.left;
			const touchY = touch.clientY - rect.top;

			const deltaX = touchX - this.dragStartX;
			const deltaY = touchY - this.dragStartY;

			this.silhouetteOffsetX += deltaX;
			this.silhouetteOffsetY += deltaY;

			this.dragStartX = touchX;
			this.dragStartY = touchY;

			this.render();
		}

		onTouchEnd() {
			if (this.isDragging) {
				this.isDragging = false;
			}
		}

		isSilhouetteClicked(x, y) {
			if (!this.silhouetteSvgElement) return false;

			const rect = this.silhouetteSvgElement.getBoundingClientRect();
			const canvasRect = this.$canvas[0].getBoundingClientRect();

			const silhouetteX = rect.left - canvasRect.left;
			const silhouetteY = rect.top - canvasRect.top;
			const silhouetteWidth = rect.width;
			const silhouetteHeight = rect.height;

			return (
				x >= silhouetteX &&
				x <= silhouetteX + silhouetteWidth &&
				y >= silhouetteY &&
				y <= silhouetteY + silhouetteHeight
			);
		}

		render() {
			// Clear canvas
			this.$canvas.empty();

			// Calculate mattress dimensions based on canvas width and aspect ratio
			const mattressAspectRatio = this.currentProduct.mattress_width / this.currentProduct.mattress_length;
			const maxMattressWidth = this.canvasWidth * 0.9; // 90% of canvas width

			let mattressWidth = maxMattressWidth;
			let mattressHeight = mattressWidth / mattressAspectRatio;

			// If mattress height exceeds canvas height, scale down
			if (mattressHeight > this.canvasHeight * 0.7) {
				mattressHeight = this.canvasHeight * 0.7;
				mattressWidth = mattressHeight * mattressAspectRatio;
			}

			// Center the mattress horizontally and position it in the middle
			const mattressX = (this.canvasWidth - mattressWidth) / 2;
			const mattressY = (this.canvasHeight - mattressHeight) / 2;

			// Load and render mattress SVG
			this.loadAndRenderMattress(mattressWidth, mattressHeight, mattressX, mattressY);

			// Calculate and render silhouette
			const silhouetteHeight = this.canvasHeight * (this.currentHeight / 200); // Scale based on height
			const silhouetteWidth = silhouetteHeight * (this.currentShoulderWidth / this.currentHeight); // Maintain proportions

			const silhouetteX = mattressX + (mattressWidth - silhouetteWidth) / 2 + this.silhouetteOffsetX;
			const silhouetteY = mattressY + (mattressHeight - silhouetteHeight) / 2 + this.silhouetteOffsetY;

			this.loadAndRenderSilhouette(silhouetteWidth, silhouetteHeight, silhouetteX, silhouetteY);
		}

		loadAndRenderMattress(width, height, x, y) {
			const svgUrl = this.currentProduct.mattress_shape === 'mummy' ? this.svgUrls.mummy : this.svgUrls.square;

			if (!svgUrl) {
				console.warn('Mattress SVG URL not set');
				return;
			}

			// Check cache first
			if (this.svgCache[svgUrl]) {
				this.placeSvgInCanvas(this.svgCache[svgUrl].clone(), width, height, x, y, 'mattress');
				return;
			}

			$.ajax({
				url: svgUrl,
				type: 'GET',
				dataType: 'html',
				success: (svgContent) => {
					const $svg = $(svgContent).find('svg');

					if ($svg.length === 0) {
						// If no SVG found, try wrapping the content as SVG
						const $svgWrapper = $('<svg></svg>');
						$svgWrapper.html(svgContent);
						this.svgCache[svgUrl] = $svgWrapper.clone();
						this.placeSvgInCanvas($svgWrapper, width, height, x, y, 'mattress');
					} else {
						this.svgCache[svgUrl] = $svg.eq(0).clone();
						this.placeSvgInCanvas($svg.eq(0).clone(), width, height, x, y, 'mattress');
					}
				},
				error: () => {
					console.error('Failed to load mattress SVG:', svgUrl);
					// Render placeholder
					this.renderMattressPlaceholder(width, height, x, y);
				}
			});
		}

		loadAndRenderSilhouette(width, height, x, y) {
			const svgUrl = this.currentGender === 'female' ? this.svgUrls.female : this.svgUrls.male;

			if (!svgUrl) {
				console.warn('Silhouette SVG URL not set');
				return;
			}

			// Check cache first
			if (this.svgCache[svgUrl]) {
				this.placeSvgInCanvas(this.svgCache[svgUrl].clone(), width, height, x, y, 'silhouette');
				return;
			}

			$.ajax({
				url: svgUrl,
				type: 'GET',
				dataType: 'html',
				success: (svgContent) => {
					const $svg = $(svgContent).find('svg');

					if ($svg.length === 0) {
						const $svgWrapper = $('<svg></svg>');
						$svgWrapper.html(svgContent);
						this.svgCache[svgUrl] = $svgWrapper.clone();
						this.placeSvgInCanvas($svgWrapper, width, height, x, y, 'silhouette');
					} else {
						const $clonedSvg = $svg.eq(0).clone();
						this.svgCache[svgUrl] = $clonedSvg.clone();
						this.placeSvgInCanvas($clonedSvg, width, height, x, y, 'silhouette');
					}
				},
				error: () => {
					console.error('Failed to load silhouette SVG:', svgUrl);
					// Render placeholder
					this.renderSilhouettePlaceholder(width, height, x, y);
				}
			});
		}

		placeSvgInCanvas($svg, width, height, x, y, type) {
			const $clonedSvg = $svg.clone();

			// Set positioning and dimensions
			$clonedSvg.css({
				position: 'absolute',
				left: x + 'px',
				top: y + 'px',
				width: width + 'px',
				height: height + 'px',
				overflow: 'visible'
			});

			$clonedSvg.attr({
				'data-type': type,
				'preserveAspectRatio': 'xMidYMid meet'
			});

			// Add cursor for silhouette
			if (type === 'silhouette') {
				$clonedSvg.css('cursor', 'grab');
				this.silhouetteSvgElement = $clonedSvg[0];
			}

			this.$canvas.append($clonedSvg);
		}

		renderMattressPlaceholder(width, height, x, y) {
			const $rect = $('<svg><rect/></svg>')
				.css({
					position: 'absolute',
					left: x + 'px',
					top: y + 'px',
					width: width + 'px',
					height: height + 'px'
				})
				.attr('data-type', 'mattress');

			$rect.find('rect').attr({
				width: width,
				height: height,
				fill: '#e0e0e0',
				stroke: '#999',
				'stroke-width': 2
			});

			this.$canvas.append($rect);
		}

		renderSilhouettePlaceholder(width, height, x, y) {
			const $rect = $('<svg><rect/></svg>')
				.css({
					position: 'absolute',
					left: x + 'px',
					top: y + 'px',
					width: width + 'px',
					height: height + 'px',
					cursor: 'grab'
				})
				.attr('data-type', 'silhouette');

			$rect.find('rect').attr({
				width: width,
				height: height,
				fill: '#ffcc99',
				stroke: '#ff9900',
				'stroke-width': 2
			});

			this.silhouetteSvgElement = $rect[0];
			this.$canvas.append($rect);
		}
	}

	// Initialize on document ready
	$(document).ready(function() {
		$('.mss-wrapper').each(function() {
			new MattressSizeSimulator($(this));
		});
	});

})(jQuery);
