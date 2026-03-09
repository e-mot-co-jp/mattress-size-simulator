(function($) {
	'use strict';

	/**
	 * Mattress Size Simulator
	 */
	class MattressSizeSimulator {
		constructor($wrapper) {
			this.$wrapper = $wrapper;
			this.$canvasContainer = $wrapper.find('.mss-canvas-container');
			this.$productSelect = $wrapper.find('#mss-product-select');
			this.$genderSelect = $wrapper.find('#mss-gender-select');
			this.$heightInput = $wrapper.find('#mss-height-input');
			this.$shoulderWidthInput = $wrapper.find('#mss-shoulder-width-input');
			this.$fullscreenToggle = $wrapper.find('.mss-fullscreen-toggle');
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
			this.productTitle = config.productTitle || '';

			// Canvas dimensions
			this.canvasWidth = this.$canvas.width();
			this.canvasHeight = this.$canvas.height();
			this.maxCanvasWidth = config.maxCanvasWidth || 600;
			this.minHeight = config.minHeight || 400;

			// Shoulder width ratio (SVG actual width / shoulder width cm)
			this.femaleShoulderRatio = parseFloat(config.femaleShoulderRatio) || 1.943; // 68 / 35
			this.maleShoulderRatio = parseFloat(config.maleShoulderRatio) || 1.651; // 71 / 43

			// 性別ごとの初期値
			this.defaultValues = {
				male: { height: 171, shoulderWidth: 40 },
				female: { height: 158, shoulderWidth: 36 }
			};

			// Current state
			this.currentProduct = null;
			this.currentGender = 'male';
			this.currentHeight = 171;
			this.currentShoulderWidth = 40;

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
			this.isFullscreen = false;
			this.boundTouchMoveHandler = (e) => this.onTouchMove(e);
			this.boundTouchEndHandler = () => this.onTouchEnd();

			// プライベートモード対応：初期化フラグと監視機能
			this.initialized = false;
			this.resizeObserver = null;

			// ResizeObserver でラッパーのサイズ決定を監視
			this.waitForWrapperReady();
		}

		waitForWrapperReady() {
			// プライベートモード対応：ラッパーのサイズが決定されるまで待つ
			const getWrapperWidth = () => {
				return this.$wrapper[0]?.offsetWidth || this.$wrapper.width() || 0;
			};

			const wrapperWidth = getWrapperWidth();
			console.log('waitForWrapperReady - ラッパー幅チェック:', {
				offsetWidth: this.$wrapper[0]?.offsetWidth,
				jQueryWidth: this.$wrapper.width(),
				calculated: wrapperWidth
			});

			if (wrapperWidth > 0 && !this.initialized) {
				// ラッパーのサイズが決定されたので初期化可能
				console.log('waitForWrapperReady - サイズ決定. 初期化を開始します');
				this.init();
				this.cleanupObserver();
			} else if (!this.initialized) {
				// ResizeObserver を使ってラッパーの後続のサイズ変更を監視
				if (!this.resizeObserver && typeof ResizeObserver !== 'undefined') {
					this.resizeObserver = new ResizeObserver(() => {
						const currentWidth = getWrapperWidth();
						if (currentWidth > 0 && !this.initialized) {
							console.log('ResizeObserver - ラッパー幅が確定:', currentWidth);
							this.init();
							this.cleanupObserver();
						}
					});
					this.resizeObserver.observe(this.$wrapper[0]);
				} else {
					// ResizeObserver 非対応の場合はタイムアウト後に初期化
					setTimeout(() => {
						if (!this.initialized) {
							console.log('Timeout fallback - 初期化を強制開始');
							this.init();
						}
					}, 500);
				}
			}
		}

		cleanupObserver() {
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}
		}

		init() {
			if (this.initialized) {
				console.log('既に初期化済みです');
				return;
			}

			this.initialized = true;

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

			// キャンバス幅を親要素から取得（offsetWidth を優先）
			const wrapperWidth = this.$wrapper[0]?.offsetWidth || this.$wrapper.width() || 0;
			console.log('ラッパー幅:', {
				offsetWidth: this.$wrapper[0]?.offsetWidth,
				jQueryWidth: this.$wrapper.width(),
				maxCanvasWidth: this.maxCanvasWidth,
				jQueryCanvasWidth: this.$canvas.width()
			});

			// Check if we have products
			if (!this.products || this.products.length === 0) {
				console.error('薬を設定していません');
				this.$canvas.html('<div style="padding: 20px; text-align: center; color: #d32f2f;">薬が設定されていません。ウィジェット設定で薬を追加してください。</div>');
				return;
			}

			// 商品タイトルに基づいて自動選択
			if (this.productTitle) {
				this.autoSelectProductByTitle();
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
			this.$fullscreenToggle.on('click', () => this.toggleFullscreen());
			$(document).on('keydown', (e) => {
				if (this.isFullscreen && e.key === 'Escape') {
					this.exitFullscreen();
				}
			});

			// Bind mouse events for dragging
			this.$canvas.on('mousedown', (e) => this.onMouseDown(e));
			$(document).on('mousemove', (e) => this.onMouseMove(e));
			$(document).on('mouseup', () => this.onMouseUp());

			// Bind touch events for mobile
			if (this.$canvas[0]) {
				this.$canvas[0].addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
			}
			document.addEventListener('touchmove', this.boundTouchMoveHandler, { passive: false });
			document.addEventListener('touchend', this.boundTouchEndHandler, { passive: true });

			// Handle window resize
			$(window).on('resize', () => this.onWindowResize());

			// Calculate base scale based on silhouette (not product dependent)
			this.calculateBaseScale();

			// Initial render
			this.render();
		}

		autoSelectProductByTitle() {
			if (!this.productTitle) {
				return;
			}

			console.log('商品タイトルによる自動選択を試行:', this.productTitle);

			// セレクトボックスの全オプションをループ
			let matchedIndex = -1;
			this.$productSelect.find('option').each((index, element) => {
				const $option = $(element);
				const optionText = $option.text();
				const optionValue = $option.val();
				
				// タイトルにオプションテキストが含まれているか、またはその逆をチェック
				if (this.productTitle.includes(optionText) || optionText.includes(this.productTitle)) {
					matchedIndex = index;
					console.log('マッチしたマットレス:', optionText, 'at index', index);
					return false; // ループを中断
				}

				// JSON内の product_name もチェック
				try {
					const productData = JSON.parse(optionValue);
					if (productData.product_name && 
					    (this.productTitle.includes(productData.product_name) || 
					     productData.product_name.includes(this.productTitle))) {
						matchedIndex = index;
						console.log('マッチしたマットレス (product_name):', productData.product_name, 'at index', index);
						return false;
					}
				} catch (e) {
					// JSON parse error - skip
				}
			});

			// マッチした場合、そのオプションを選択
			if (matchedIndex >= 0) {
				this.$productSelect.prop('selectedIndex', matchedIndex);
				console.log('自動選択完了: index', matchedIndex);
			} else {
				console.log('マッチするマットレスが見つかりませんでした');
			}
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
			
			// 性別に応じた初期値を設定
			const defaults = this.defaultValues[this.currentGender];
			this.currentHeight = defaults.height;
			this.currentShoulderWidth = defaults.shoulderWidth;
			
			// 入力欄にも初期値を反映
			this.$heightInput.val(defaults.height);
			this.$shoulderWidthInput.val(defaults.shoulderWidth);
			
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

		toggleFullscreen() {
			if (this.isFullscreen) {
				this.exitFullscreen();
			} else {
				this.enterFullscreen();
			}
		}

		enterFullscreen() {
			this.isFullscreen = true;
			this.$wrapper.addClass('mss-fullscreen');
			$('body').addClass('mss-fullscreen-active');
			this.$fullscreenToggle.text('全画面を閉じる');

			setTimeout(() => {
				this.onWindowResize();
			}, 50);
		}

		exitFullscreen() {
			this.isFullscreen = false;
			this.$wrapper.removeClass('mss-fullscreen');
			$('body').removeClass('mss-fullscreen-active');
			this.$fullscreenToggle.text('全画面表示');

			setTimeout(() => {
				this.onWindowResize();
			}, 50);
		}

		calculateBaseScale() {
			// シルエット基準でスケール計算（商品に依存しない）
			
			// 幅取得の優先順位：offsetWidth > jQuery.width() > getBoundingClientRect() > fallback
			let canvasWidth = this.$wrapper[0]?.offsetWidth || this.$wrapper.width() || 0;
			let canvasHeight = this.$canvas[0]?.offsetHeight || this.$canvas.height() || 0;

			// フォールバック1：getBoundingClientRect で正確な寸法を取得
			if (!canvasWidth || canvasWidth <= 0) {
				const wrapperRect = this.$wrapper[0]?.getBoundingClientRect();
				if (wrapperRect && wrapperRect.width > 0) {
					canvasWidth = wrapperRect.width;
					console.log('getBoundingClientRect からラッパー幅を取得:', canvasWidth);
				}
			}

			if (!canvasHeight || canvasHeight <= 0) {
				const canvasRect = this.$canvas[0]?.getBoundingClientRect();
				if (canvasRect && canvasRect.height > 0) {
					canvasHeight = canvasRect.height;
					console.log('getBoundingClientRect からキャンバス高さを取得:', canvasHeight);
				}
			}

			// キャンバス寸法の正当性確認（負の値やゼロは不正）
			if (!canvasWidth || canvasWidth <= 0) {
				console.warn('Canvas width is invalid:', canvasWidth, 'using maxCanvasWidth:', this.maxCanvasWidth);
				canvasWidth = this.maxCanvasWidth;
			}
			if (!canvasHeight || canvasHeight <= 0) {
				console.warn('Canvas height is invalid:', canvasHeight, 'using minHeight:', this.minHeight);
				canvasHeight = this.minHeight;
			}

			console.log('Canvas dimensions for scaling:', {
				canvasWidth: canvasWidth,
				canvasHeight: canvasHeight,
				wrapperOffsetWidth: this.$wrapper[0]?.offsetWidth,
				wrapperJQueryWidth: this.$wrapper.width(),
				canvasOffsetHeight: this.$canvas[0]?.offsetHeight,
				canvasJQueryHeight: this.$canvas.height()
			});

			// シルエットを基準にスケールを計算（初期身長171cm）
			// 画像height : 身長部分 = 17 : 15 なので、画像heightは 171 * (17/15)
			const heightRatio = 17 / 15;
			const referenceHeight = 171; // 男性の初期身長（cm）
			const referenceSilhouetteHeight = referenceHeight * heightRatio; // 実際の画像高さ（cm相当）

			// キャンバス高さの60%をシルエットの表示高さとして使用（余白確保）
			const maxSilhouetteDisplayHeight = canvasHeight * 0.6;

			// Base scale = 表示サイズ (px) / 実際のサイズ (cm)
			this.baseScale = maxSilhouetteDisplayHeight / referenceSilhouetteHeight;

			// Ensure base scale is positive
			if (this.baseScale <= 0) {
				console.error('Calculated base scale is invalid:', this.baseScale, 'using fallback');
				this.baseScale = 1; // Fallback to 1:1 scale
			}

			console.log('Base scale calculated (silhouette-based):', {
				baseScale: this.baseScale,
				referenceHeight: referenceHeight,
				referenceSilhouetteHeight: referenceSilhouetteHeight,
				maxSilhouetteDisplayHeight: maxSilhouetteDisplayHeight,
				canvasHeight: canvasHeight
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
				if (e.cancelable) {
					e.preventDefault();
				}
				e.stopPropagation();
				this.isDragging = true;
				this.dragStartX = touchX;
				this.dragStartY = touchY;
			}
		}

		onTouchMove(e) {
			if (!this.isDragging) return;
			if (e.cancelable) {
				e.preventDefault();
			}
			e.stopPropagation();

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

			// Update canvas dimensions with validation
			// 親要素の幅を最優先で使用
			this.canvasWidth = this.$wrapper.width() || this.$canvas.width() || this.maxCanvasWidth;
			this.canvasHeight = this.$canvas.height() || this.minHeight;

			// getBoundingClientRect での正確な寸法取得（フォールバック）
			if (!this.canvasWidth || this.canvasWidth <= 0) {
				const wrapperRect = this.$wrapper[0]?.getBoundingClientRect();
				if (wrapperRect && wrapperRect.width > 0) {
					this.canvasWidth = wrapperRect.width;
				}
			}

			// キャンバス寸法の正当性確認（負の値やゼロは不正）
			if (!this.canvasWidth || this.canvasWidth <= 0) {
				console.warn('Canvas width is invalid:', this.canvasWidth, 'using max width:', this.maxCanvasWidth);
				this.canvasWidth = this.maxCanvasWidth;
				this.$canvas.css('width', this.canvasWidth);
			}

			if (!this.canvasHeight || this.canvasHeight <= 0) {
				console.warn('Canvas height is invalid:', this.canvasHeight, 'using min height:', this.minHeight);
				this.canvasHeight = this.minHeight;
				this.$canvas.css('height', this.canvasHeight);
			}

			console.log('Rendering:', {
				canvasWidth: this.canvasWidth,
				canvasHeight: this.canvasHeight,
				product: this.currentProduct.product_name,
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
			
			// 身長比率を適用: 画像height : 身長部分 = 15 : 14
			// 15 : 14 = x : 170 => x = 170 × (15/14)
			const heightRatio = 17 / 15.5; // 1.071...
			const silhouetteHeightPx = (this.currentHeight * this.baseScale) * heightRatio;

			// 肩幅比率を適用: SVG実際の幅 = 肩幅(cm) × 基準スケール × 肩幅比率
			const shoulderRatio = this.currentGender === 'female' ? this.femaleShoulderRatio : this.maleShoulderRatio;
			const silhouetteWidthPx = this.currentShoulderWidth * this.baseScale * shoulderRatio;

			console.log('Silhouette size:', {
				heightCm: this.currentHeight,
				widthCm: this.currentShoulderWidth,
				heightRatio: heightRatio,
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
