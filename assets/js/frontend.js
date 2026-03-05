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

			// Load widget configuration from data attribute
			const configJson = this.$wrapper.attr('data-widget-config');
			let config = {};
			try {
				config = configJson ? JSON.parse(configJson) : {};
			} catch (e) {
				console.error('Error parsing widget config:', e);
			}

			// SVG URLs
			this.svgUrls = config.svgUrls || {};
			this.products = config.products || [];

			// Canvas dimensions
			this.canvasWidth = this.$canvas.width();
			this.canvasHeight = this.$canvas.height();
			this.maxCanvasWidth = config.maxCanvasWidth || 600;
			this.minHeight = config.minHeight || 400;

			// Shoulder width ratio (SVG actual width / shoulder width cm)
			this.femaleShoulderRatio = parseFloat(config.femaleShoulderRatio) || 1.943; // 68 / 35
			this.maleShoulderRatio = parseFloat(config.maleShoulderRatio) || 1.651; // 71 / 43

			// Current state
			this.currentProduct = null;
			this.currentGender = 'male';
			this.currentHeight = 170;
			this.currentShoulderWidth = 45;

			// Base scale for consistent sizing (set during initialization)
			this.baseScale = null;

			// Silhouette position for dragging
			this.silhouetteOffsetX = 0;
			this.silhouetteOffsetY = 0;
			this.isDragging = false;
			this.dragStartX = 0;
			this.dragStartY = 0;
			this.lastRenderTime = 0;
			this.renderTimeout = null;

			this.init();
		}

		init() {
			console.log('マットレスサイズシミュレーターを初期化中');
			console.log('商品:', this.products);
			console.log('SVG URL:', this.svgUrls);
			console.log('詳細な設定情報:', {
				products: this.products,
				svgUrls: this.svgUrls,
				maxCanvasWidth: this.maxCanvasWidth,
				minHeight: this.minHeight,
				femaleShoulderRatio: this.femaleShoulderRatio,
				maleShoulderRatio: this.maleShoulderRatio
			});

			// Check if we have products
			if (!this.products || this.products.length === 0) {
				console.error('薬を設定していません');
				this.$canvas.html('<div style="padding: 20px; text-align: center; color: #d32f2f;">薬が設定されていません。ウィジェット設定で薬を追加してください。</div>');
				return;
			}

			// Load initial product
			this.loadProduct();

			if (!this.currentProduct) {
				console.error('初期薬の読み込みに失敗');
				return;
			}

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

			// Calculate base scale using initial product
			this.calculateBaseScale();

			// Initial render
			this.render();
		}

		loadProduct() {
			const selectedOption = this.$productSelect.find('option:selected');
			const productJson = selectedOption.val();
			console.log('Loading product:', productJson);
			try {
				this.currentProduct = JSON.parse(productJson);
				console.log('Product loaded:', this.currentProduct);
			} catch (e) {
				console.error('Error parsing product JSON:', e);
				if (this.products && this.products.length > 0) {
					this.currentProduct = this.products[0];
					console.log('Using first product as fallback:', this.currentProduct);
				}
			}
		}

		onProductChange() {
			this.loadProduct();
			this.silhouetteOffsetX = 0;
			this.silhouetteOffsetY = 0;
			// Don't recalculate base scale to keep person size consistent
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
			// Use requestAnimationFrame for smooth updates
			if (this.renderTimeout) {
				cancelAnimationFrame(this.renderTimeout);
			}
			this.renderTimeout = requestAnimationFrame(() => {
				this.render();
			});
		}

		onWindowResize() {
			this.canvasWidth = this.$canvas.width();
			this.canvasHeight = this.$canvas.height();
			// Recalculate base scale on resize
			this.calculateBaseScale();
			this.render();
		}

		calculateBaseScale() {
			if (!this.currentProduct) {
				console.error('Cannot calculate base scale without product');
				return;
			}

			// Use canvas dimensions
			const canvasWidth = this.$canvas.width() || this.maxCanvasWidth;
			const canvasHeight = this.$canvas.height() || this.minHeight;

			// Use initial product as reference for base scale
			const refWidthCm = parseFloat(this.currentProduct.mattress_width);
			const refLengthCm = parseFloat(this.currentProduct.mattress_length);
			const refAspectRatio = refWidthCm / refLengthCm;

			// Calculate max display size (90% width, 70% height)
			const maxWidth = canvasWidth * 0.9;
			const maxHeight = canvasHeight * 0.7;

			// Calculate scale based on which dimension is limiting
			let displayHeight = maxWidth / refAspectRatio;
			if (displayHeight > maxHeight) {
				displayHeight = maxHeight;
			}

			// Base scale = display size (px) / actual size (cm)
			// Using length as the reference dimension
			this.baseScale = displayHeight / refLengthCm;

			console.log('Base scale calculated:', {
				baseScale: this.baseScale,
				refProduct: this.currentProduct.product_name,
				refSize: `${refWidthCm} x ${refLengthCm} cm`,
				displayHeight: displayHeight
			});
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

			if (!this.currentProduct) {
				console.error('No current product selected');
				return;
			}

			if (!this.baseScale) {
				console.error('Base scale not calculated');
				return;
			}

			// Update canvas dimensions
			this.canvasWidth = this.$canvas.width();
			if (this.canvasWidth === 0) {
				this.canvasWidth = this.maxCanvasWidth;
				this.$canvas.width(this.canvasWidth);
			}

			// Set canvas height if not set
			if (this.$canvas.height() < this.minHeight) {
				this.$canvas.height(this.minHeight);
			}
			this.canvasHeight = this.$canvas.height();

			console.log('Rendering:', {
				canvasWidth: this.canvasWidth,
				canvasHeight: this.canvasHeight,
				product: this.currentProduct,
				baseScale: this.baseScale,
				height: this.currentHeight,
				shoulderWidth: this.currentShoulderWidth
			});

			// マットの実際のサイズ（cm単位）
			const mattressWidthCm = parseFloat(this.currentProduct.mattress_width);
			const mattressLengthCm = parseFloat(this.currentProduct.mattress_length);

			console.log('Mattress size (cm):', {width: mattressWidthCm, length: mattressLengthCm});

			// 基準スケールを使用してマットのピクセルサイズを計算
			// 1cmの表現がマットと人で統一される
			const mattressWidthPx = mattressWidthCm * this.baseScale;
			const mattressHeightPx = mattressLengthCm * this.baseScale;

			console.log('Mattress size (px):', {width: mattressWidthPx, height: mattressHeightPx});

			// Center the mattress horizontally and position it in the middle
			const mattressX = (this.canvasWidth - mattressWidthPx) / 2;
			const mattressY = (this.canvasHeight - mattressHeightPx) / 2;

			// Load and render mattress SVG
			this.loadAndRenderMattress(mattressWidthPx, mattressHeightPx, mattressX, mattressY);

			// シルエットのサイズを基準スケールで計算
			// 入力値のみで決定され、マットのサイズに依存しない
			const silhouetteHeightPx = this.currentHeight * this.baseScale;

			// 肩幅比率を適用: SVG実際の幅 = 肩幅(cm) × 基準スケール × 肩幅比率
			const shoulderRatio = this.currentGender === 'female' ? this.femaleShoulderRatio : this.maleShoulderRatio;
			const silhouetteWidthPx = this.currentShoulderWidth * this.baseScale * shoulderRatio;

			console.log('Silhouette size:', {
				heightCm: this.currentHeight,
				widthCm: this.currentShoulderWidth,
				shoulderRatio: shoulderRatio,
				heightPx: silhouetteHeightPx,
				widthPx: silhouetteWidthPx
			});

			// シルエットの初期位置（中央配置 + オフセット）
			const silhouetteX = mattressX + (mattressWidthPx - silhouetteWidthPx) / 2 + this.silhouetteOffsetX;
			const silhouetteY = mattressY + (mattressHeightPx - silhouetteHeightPx) / 2 + this.silhouetteOffsetY;

			this.loadAndRenderSilhouette(silhouetteWidthPx, silhouetteHeightPx, silhouetteX, silhouetteY);
		}

		loadAndRenderMattress(width, height, x, y) {
			const svgUrl = this.currentProduct.mattress_shape === 'mummy' ? this.svgUrls.mummy : this.svgUrls.square;

			console.log('マットレス SVG を読み込み中:', {
				url: svgUrl,
				mattress_shape: this.currentProduct.mattress_shape,
				width: width,
				height: height,
				x: x,
				y: y
			});

			if (!svgUrl) {
				console.warn('マットレス SVG URL が設定されていません。プレースホルダーを表示');
				this.renderMattressPlaceholder(width, height, x, y);
				return;
			}

			// Check cache first
			if (this.svgCache[svgUrl]) {
				console.log('Using cached mattress SVG');
				this.placeSvgInCanvas(this.svgCache[svgUrl].clone(), width, height, x, y, 'mattress');
				return;
			}

			$.ajax({
				url: svgUrl,
				type: 'GET',
				dataType: 'text',
				success: (svgContent) => {
					console.log('マットレス SVG を正常に読み込みました', {
						url: svgUrl,
						contentLength: svgContent.length,
						contentPreview: svgContent.substring(0, 100)
					});
					const $svg = $(svgContent).filter('svg').add($(svgContent).find('svg'));

					if ($svg.length === 0) {
						console.warn('SVG 要素が見つかりません。ラッパーを作成しています');
						// If no SVG found, try wrapping the content as SVG
						const $svgWrapper = $('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
						$svgWrapper.html(svgContent);
						this.svgCache[svgUrl] = $svgWrapper.clone();
						this.placeSvgInCanvas($svgWrapper, width, height, x, y, 'mattress');
					} else {
						console.log('SVG 要素が見つかり、キャッシュして描画します');
						this.svgCache[svgUrl] = $svg.eq(0).clone();
						this.placeSvgInCanvas($svg.eq(0).clone(), width, height, x, y, 'mattress');
					}
				},
				error: (xhr, status, error) => {
					console.error('マットレス SVG の読み込みに失敗:', {
						url: svgUrl,
						status: status,
						error: error,
						statusCode: xhr.status,
						statusText: xhr.statusText
					});
					// Render placeholder
					this.renderMattressPlaceholder(width, height, x, y);
				}
			});
		}

		loadAndRenderSilhouette(width, height, x, y) {
			const svgUrl = this.currentGender === 'female' ? this.svgUrls.female : this.svgUrls.male;

			console.log('シルエット SVG を読み込み中:', {
				url: svgUrl,
				gender: this.currentGender,
				width: width,
				height: height,
				x: x,
				y: y
			});

			if (!svgUrl) {
				console.warn('シルエット SVG URL が設定されていません。プレースホルダーを表示');
				this.renderSilhouettePlaceholder(width, height, x, y);
				return;
			}

			// Check cache first
			if (this.svgCache[svgUrl]) {
				console.log('キャッシュされたシルエット SVG を使用');
				this.placeSvgInCanvas(this.svgCache[svgUrl].clone(), width, height, x, y, 'silhouette');
				return;
			}

			$.ajax({
				url: svgUrl,
				type: 'GET',
				dataType: 'text',
				success: (svgContent) => {
					console.log('シルエット SVG を正常に読み込みました', {
						url: svgUrl,
						contentLength: svgContent.length,
						contentPreview: svgContent.substring(0, 100)
					});
					const $svg = $(svgContent).filter('svg').add($(svgContent).find('svg'));

					if ($svg.length === 0) {
						console.warn('SVG 要素が見つかりません。ラッパーを作成しています');
						const $svgWrapper = $('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
						$svgWrapper.html(svgContent);
						this.svgCache[svgUrl] = $svgWrapper.clone();
						this.placeSvgInCanvas($svgWrapper, width, height, x, y, 'silhouette');
					} else {
						console.log('SVG 要素が見つかり、キャッシュして描画します');
						const $clonedSvg = $svg.eq(0).clone();
						this.svgCache[svgUrl] = $clonedSvg.clone();
						this.placeSvgInCanvas($clonedSvg, width, height, x, y, 'silhouette');
					}
				},
				error: (xhr, status, error) => {
					console.error('シルエット SVG の読み込みに失敗:', {
						url: svgUrl,
						status: status,
						error: error,
						statusCode: xhr.status,
						statusText: xhr.statusText
					});
					// Render placeholder
					this.renderSilhouettePlaceholder(width, height, x, y);
				}
			});
		}

		placeSvgInCanvas($svg, width, height, x, y, type) {
			console.log('Placing SVG in canvas:', {width, height, x, y, type});

			const $clonedSvg = $svg.clone();

			// Remove any existing width/height attributes to allow CSS sizing
			$clonedSvg.removeAttr('width').removeAttr('height');

			// Set positioning and dimensions
			$clonedSvg.css({
				position: 'absolute',
				left: x + 'px',
				top: y + 'px',
				width: width + 'px',
				height: height + 'px',
				overflow: 'visible'
			});

			// Set preserveAspectRatio based on type
			// Silhouette: 'none' to allow independent width/height scaling
			// Mattress: 'none' to allow independent width/height scaling
			$clonedSvg.attr({
				'data-type': type,
				'preserveAspectRatio': 'none',
				'viewBox': $clonedSvg.attr('viewBox') || '0 0 100 100'
			});

			// Apply styles based on type
			if (type === 'silhouette') {
				// Silhouette: black fill
				$clonedSvg.css('cursor', 'grab');
				$clonedSvg.find('*').each(function() {
					const $el = $(this);
					// Keep original fill or set to black if not set
					if (!$el.attr('fill') || $el.attr('fill') === 'none') {
						$el.attr('fill', '#000000');
					}
					// Remove stroke if any
					$el.css('stroke', 'none');
				});
				this.silhouetteSvgElement = $clonedSvg[0];
			} else {
				// Mattress: outline only (no fill, with stroke)
				$clonedSvg.find('*').each(function() {
					const $el = $(this);
					// Remove fill
					$el.attr('fill', 'none');
					// Set stroke if not already set
					if (!$el.attr('stroke') || $el.attr('stroke') === 'none') {
						$el.attr('stroke', '#333333');
						$el.attr('stroke-width', $el.attr('stroke-width') || '2');
					}
				});
				this.mattressSvgElement = $clonedSvg[0];
			}

			this.$canvas.append($clonedSvg);
			console.log('SVG appended to canvas with styles');
		}

		renderMattressPlaceholder(width, height, x, y) {
			console.log('Rendering mattress placeholder');
			const $svg = $('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
			$svg.attr({
				width: width,
				height: height,
				viewBox: `0 0 ${width} ${height}`
			});

			// Mattress placeholder: outline only (no fill)
			const $rect = $('<rect/>');
			$rect.attr({
				width: width - 4,
				height: height - 4,
				x: 2,
				y: 2,
				fill: 'none',
				stroke: '#333333',
				'stroke-width': 2
			});

			const $text = $('<text/>');
			$text.attr({
				x: width / 2,
				y: height / 2,
				'text-anchor': 'middle',
				'dominant-baseline': 'middle',
				fill: '#999',
				'font-size': '12px'
			}).text('Mattress SVG');

			$svg.append($rect).append($text);

			$svg.css({
				position: 'absolute',
				left: x + 'px',
				top: y + 'px'
			}).attr('data-type', 'mattress');

			this.mattressSvgElement = $svg[0];
			this.$canvas.append($svg);
		}

		renderSilhouettePlaceholder(width, height, x, y) {
			console.log('Rendering silhouette placeholder');
			const $svg = $('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
			$svg.attr({
				width: width,
				height: height,
				viewBox: `0 0 ${width} ${height}`
			});

			// Silhouette placeholder: black fill
			const $ellipse = $('<ellipse/>');
			$ellipse.attr({
				cx: width / 2,
				cy: height / 2,
				rx: width / 3,
				ry: height / 2.2,
				fill: '#000000',
				stroke: 'none'
			});

			const $text = $('<text/>');
			$text.attr({
				x: width / 2,
				y: height / 2,
				'text-anchor': 'middle',
				'dominant-baseline': 'middle',
				fill: '#ffffff',
				'font-size': '10px'
			}).text('Silhouette');

			$svg.append($ellipse).append($text);

			$svg.css({
				position: 'absolute',
				left: x + 'px',
				top: y + 'px',
				cursor: 'grab'
			}).attr('data-type', 'silhouette');

			this.silhouetteSvgElement = $svg[0];
			this.$canvas.append($svg);
		}
	}

	// Initialize on document ready
	$(document).ready(function() {
		console.log('Mattress Size Simulator: Document ready');
		const $wrappers = $('.mss-wrapper');
		console.log('Found widget wrappers:', $wrappers.length);

		$wrappers.each(function(index) {
			console.log('Initializing widget', index);
			new MattressSizeSimulator($(this));
		});
	});

})(jQuery);
