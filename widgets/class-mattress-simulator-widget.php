<?php
/**
 * Mattress Simulator Widget
 *
 * @package MattressSizeSimulator
 */

namespace Elementor;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Class Mattress_Simulator_Widget
 */
class Mattress_Simulator_Widget extends Widget_Base {

	/**
	 * Get widget name
	 *
	 * @return string
	 */
	public function get_name() {
		return 'mattress-simulator';
	}

	/**
	 * Get widget title
	 *
	 * @return string
	 */
	public function get_title() {
		return __( 'マットレスサイズシミュレーター', 'mattress-size-simulator' );
	}

	/**
	 * Get widget icon
	 *
	 * @return string
	 */
	public function get_icon() {
		return 'eicon-heading';
	}

	/**
	 * Get widget categories
	 *
	 * @return array
	 */
	public function get_categories() {
		return [ 'general' ];
	}

	/**
	 * Get script dependencies
	 *
	 * @return array
	 */
	public function get_script_deps() {
		return [ 'jquery' ];
	}

	/**
	 * Get style dependencies
	 *
	 * @return array
	 */
	public function get_style_deps() {
		return [];
	}

	/**
	 * Register widget controls
	 */
	protected function register_controls() {
		// Mattress Products Section
		$this->start_controls_section(
			'section_mattress_products',
			[
				'label' => __( 'マットレス商品', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'mattress_products',
			[
				'label'       => __( 'マットレス商品', 'mattress-size-simulator' ),
				'type'        => Controls_Manager::REPEATER,
				'default'     => $this->get_default_mattress_products(),
				'fields'      => [
					[
						'name'       => 'product_name',
						'label'      => __( '商品名', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::TEXT,
						'default'    => 'R+',
						'placeholder' => __( '例: R+ (56 x 185 cm)', 'mattress-size-simulator' ),
					],
					[
						'name'       => 'mattress_width',
						'label'      => __( 'マット幅 (cm)', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::NUMBER,
						'default'    => 56,
						'min'        => 1,
					],
					[
						'name'       => 'mattress_length',
						'label'      => __( 'マット長さ (cm)', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::NUMBER,
						'default'    => 185,
						'min'        => 1,
					],
					[
						'name'       => 'mattress_shape',
						'label'      => __( 'マット形状', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::SELECT,
						'default'    => 'mummy',
						'options'    => [
							'mummy'  => __( 'ミイラ型', 'mattress-size-simulator' ),
							'square' => __( '長方形', 'mattress-size-simulator' ),
						],
					],
				],
				'title_field' => '{{{ product_name }}}',
			]
		);

		$this->end_controls_section();

		// SVG Assets Section
		$this->start_controls_section(
			'section_svg_assets',
			[
				'label' => __( 'SVG アセット', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'mummy_svg',
			[
				'label'      => __( 'ミイラ型マット SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( 'ミイラ型マット用のSVGファイルをアップロード', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'square_svg',
			[
				'label'      => __( '長方形マット SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( '長方形マット用のSVGファイルをアップロード', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'female_silhouette_svg',
			[
				'label'      => __( '女性シルエット SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( '女性シルエット用のSVGファイルをアップロード', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'male_silhouette_svg',
			[
				'label'      => __( '男性シルエット SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( '男性シルエット用のSVGファイルをアップロード', 'mattress-size-simulator' ),
			]
		);

		$this->end_controls_section();

		// Settings Section
		$this->start_controls_section(
			'section_settings',
			[
				'label' => __( '設定', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_responsive_control(
			'max_canvas_width',
			[
				'label'      => __( 'キャンバス最大幅 (px)', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::NUMBER,
				'default'    => 600,
				'min'        => 200,
				'tablet_default' => 500,
				'mobile_default' => 300,
				'description' => __( 'シミュレーターキャンバスの最大幅', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'min_height',
			[
				'label'      => __( 'キャンバス最小高さ (px)', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::NUMBER,
				'default'    => 400,
				'min'        => 200,
				'description' => __( 'シミュレーターキャンバスの最小高さ', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'shoulder_ratio_label',
			[
				'label' => __( '肩幅比率設定', 'mattress-size-simulator' ),
				'type'  => Controls_Manager::HEADING,
				'separator' => 'before',
			]
		);

		$this->add_control(
			'female_shoulder_ratio',
			[
				'label'       => __( '女性肩幅比率 (SVG幅 / 肩幅cm)', 'mattress-size-simulator' ),
				'type'        => Controls_Manager::NUMBER,
				'default'     => 1.943, // 68 / 35
				'min'        => 0.1,
				'step'       => 0.001,
				'description' => __( '例: 68px SVG幅 / 35cm肩幅 = 1.943', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'male_shoulder_ratio',
			[
				'label'       => __( '男性肩幅比率 (SVG幅 / 肩幅cm)', 'mattress-size-simulator' ),
				'type'        => Controls_Manager::NUMBER,
				'default'     => 1.651, // 71 / 43
				'min'        => 0.1,
				'step'       => 0.001,
				'description' => __( '例: 71px SVG幅 / 43cm肩幅 = 1.651', 'mattress-size-simulator' ),
			]
		);

		$this->end_controls_section();

		// Styling Section
		$this->start_controls_section(
			'section_style',
			[
				'label' => __( 'スタイル', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'input_label_color',
			[
				'label'     => __( '入力ラベル色', 'mattress-size-simulator' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#333333',
				'selectors' => [
					'{{WRAPPER}} .mss-label' => 'color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'input_background_color',
			[
				'label'     => __( '入力背景色', 'mattress-size-simulator' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#ffffff',
				'selectors' => [
					'{{WRAPPER}} .mss-input' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->add_control(
			'canvas_background_color',
			[
				'label'     => __( 'キャンバス背景色', 'mattress-size-simulator' ),
				'type'      => Controls_Manager::COLOR,
				'default'   => '#f5f5f5',
				'selectors' => [
					'{{WRAPPER}} .mss-canvas' => 'background-color: {{VALUE}};',
				],
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Get default mattress products
	 *
	 * @return array
	 */
	private function get_default_mattress_products() {
		return [
			[
				'product_name'  => 'R+',
				'mattress_width'  => 56,
				'mattress_length' => 185,
				'mattress_shape'  => 'mummy',
			],
			[
				'product_name'  => 'RW+',
				'mattress_width'  => 66,
				'mattress_length' => 185,
				'mattress_shape'  => 'mummy',
			],
			[
				'product_name'  => 'L+',
				'mattress_width'  => 66,
				'mattress_length' => 198,
				'mattress_shape'  => 'mummy',
			],
			[
				'product_name'  => 'S',
				'mattress_width'  => 51,
				'mattress_length' => 119,
				'mattress_shape'  => 'square',
			],
			[
				'product_name'  => 'R',
				'mattress_width'  => 51,
				'mattress_length' => 183,
				'mattress_shape'  => 'mummy',
			],
			[
				'product_name'  => 'L',
				'mattress_width'  => 64,
				'mattress_length' => 196,
				'mattress_shape'  => 'square',
			],
			[
				'product_name'  => 'XL',
				'mattress_width'  => 76,
				'mattress_length' => 196,
				'mattress_shape'  => 'square',
			],
			[
				'product_name'  => 'XXL',
				'mattress_width'  => 76,
				'mattress_length' => 203,
				'mattress_shape'  => 'square',
			],
		];
	}

	/**
	 * Render widget output
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();

		$products = ! empty( $settings['mattress_products'] ) ? $settings['mattress_products'] : $this->get_default_mattress_products();

		$max_canvas_width  = ! empty( $settings['max_canvas_width'] ) ? $settings['max_canvas_width'] : 600;
		$min_height        = ! empty( $settings['min_height'] ) ? $settings['min_height'] : 400;

		$mummy_svg_url    = ! empty( $settings['mummy_svg']['url'] ) ? $settings['mummy_svg']['url'] : '';
		$square_svg_url   = ! empty( $settings['square_svg']['url'] ) ? $settings['square_svg']['url'] : '';
		$female_svg_url   = ! empty( $settings['female_silhouette_svg']['url'] ) ? $settings['female_silhouette_svg']['url'] : '';
		$male_svg_url     = ! empty( $settings['male_silhouette_svg']['url'] ) ? $settings['male_silhouette_svg']['url'] : '';

		$female_shoulder_ratio = ! empty( $settings['female_shoulder_ratio'] ) ? (float) $settings['female_shoulder_ratio'] : 1.943;
		$male_shoulder_ratio   = ! empty( $settings['male_shoulder_ratio'] ) ? (float) $settings['male_shoulder_ratio'] : 1.651;

		$widget_data = [
			'products'               => $products,
			'svgUrls'                => [
				'mummy'  => $mummy_svg_url,
				'square' => $square_svg_url,
				'female' => $female_svg_url,
				'male'   => $male_svg_url,
			],
			'maxCanvasWidth'         => $max_canvas_width,
			'minHeight'              => $min_height,
			'femaleShoulderRatio'    => $female_shoulder_ratio,
			'maleShoulderRatio'      => $male_shoulder_ratio,
		];

		?>
		<div class="mss-wrapper" 
		     style="max-width: <?php echo esc_attr( $max_canvas_width ); ?>px;"
		     data-widget-config="<?php echo esc_attr( wp_json_encode( $widget_data ) ); ?>">
			<!-- Input Controls -->
			<div class="mss-controls">
				<div class="mss-control-group">
					<label class="mss-label" for="mss-product-select">
					<?php esc_html_e( 'マットレスを選択', 'mattress-size-simulator' ); ?>
					</label>
					<select id="mss-product-select" class="mss-input mss-select">
						<?php foreach ( $products as $product ) : ?>
							<option value="<?php echo esc_attr( wp_json_encode( $product ) ); ?>">
								<?php echo esc_html( $product['product_name'] ); ?> 
								(<?php echo esc_html( $product['mattress_width'] ); ?> x <?php echo esc_html( $product['mattress_length'] ); ?> cm)
							</option>
						<?php endforeach; ?>
					</select>
				</div>

				<div class="mss-control-group">
					<label class="mss-label" for="mss-gender-select">
					<?php esc_html_e( '性別を選択', 'mattress-size-simulator' ); ?>
				</label>
				<select id="mss-gender-select" class="mss-input mss-select">
					<option value="male"><?php esc_html_e( '男性', 'mattress-size-simulator' ); ?></option>
					<option value="female"><?php esc_html_e( '女性', 'mattress-size-simulator' ); ?></option>
					</select>
				</div>

				<div class="mss-control-group">
					<label class="mss-label" for="mss-height-input">
					<?php esc_html_e( '身長 (cm)', 'mattress-size-simulator' ); ?>
				</label>
				<input type="number" id="mss-height-input" class="mss-input" min="140" max="220" value="170" step="1">
			</div>

			<div class="mss-control-group">
				<label class="mss-label" for="mss-shoulder-width-input">
					<?php esc_html_e( '肩幅 (cm)', 'mattress-size-simulator' ); ?>
					</label>
					<input type="number" id="mss-shoulder-width-input" class="mss-input" min="30" max="60" value="45" step="1">
				</div>
			</div>

			<!-- Canvas -->
			<div class="mss-canvas-container">
				<div class="mss-canvas" id="mss-canvas" style="min-height: <?php echo esc_attr( $min_height ); ?>px;">
					<!-- SVG will be rendered here -->
				</div>
			</div>

			<!-- Instructions -->
			<div class="mss-instructions">
			<p><?php esc_html_e( 'キャンバス上の人体をドラッグしてマットレス上を移動できます。', 'mattress-size-simulator' ); ?></p>
			</div>
		</div>
		<?php
	}
}
