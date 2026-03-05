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
		return __( 'Mattress Size Simulator', 'mattress-size-simulator' );
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
				'label' => __( 'Mattress Products', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'mattress_products',
			[
				'label'       => __( 'Mattress Products', 'mattress-size-simulator' ),
				'type'        => Controls_Manager::REPEATER,
				'default'     => $this->get_default_mattress_products(),
				'fields'      => [
					[
						'name'       => 'product_name',
						'label'      => __( 'Product Name', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::TEXT,
						'default'    => 'R+',
						'placeholder' => __( 'e.g., R+ (56 x 185 cm)', 'mattress-size-simulator' ),
					],
					[
						'name'       => 'mattress_width',
						'label'      => __( 'Mattress Width (cm)', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::NUMBER,
						'default'    => 56,
						'min'        => 1,
					],
					[
						'name'       => 'mattress_length',
						'label'      => __( 'Mattress Length (cm)', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::NUMBER,
						'default'    => 185,
						'min'        => 1,
					],
					[
						'name'       => 'mattress_shape',
						'label'      => __( 'Mattress Shape', 'mattress-size-simulator' ),
						'type'       => Controls_Manager::SELECT,
						'default'    => 'mummy',
						'options'    => [
							'mummy'  => __( 'Mummy', 'mattress-size-simulator' ),
							'square' => __( 'Square', 'mattress-size-simulator' ),
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
				'label' => __( 'SVG Assets', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'mummy_svg',
			[
				'label'      => __( 'Mummy Mat SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( 'Upload SVG file for mummy-shaped mattress', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'square_svg',
			[
				'label'      => __( 'Square Mat SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( 'Upload SVG file for square-shaped mattress', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'female_silhouette_svg',
			[
				'label'      => __( 'Female Silhouette SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( 'Upload SVG file for female silhouette', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'male_silhouette_svg',
			[
				'label'      => __( 'Male Silhouette SVG', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::MEDIA,
				'media_types' => [ 'image/svg+xml' ],
				'default'    => [],
				'description' => __( 'Upload SVG file for male silhouette', 'mattress-size-simulator' ),
			]
		);

		$this->end_controls_section();

		// Settings Section
		$this->start_controls_section(
			'section_settings',
			[
				'label' => __( 'Settings', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_responsive_control(
			'max_canvas_width',
			[
				'label'      => __( 'Max Canvas Width (px)', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::NUMBER,
				'default'    => 600,
				'min'        => 200,
				'tablet_default' => 500,
				'mobile_default' => 300,
				'description' => __( 'Maximum width of the simulator canvas', 'mattress-size-simulator' ),
			]
		);

		$this->add_control(
			'min_height',
			[
				'label'      => __( 'Min Canvas Height (px)', 'mattress-size-simulator' ),
				'type'       => Controls_Manager::NUMBER,
				'default'    => 400,
				'min'        => 200,
				'description' => __( 'Minimum height of the simulator canvas', 'mattress-size-simulator' ),
			]
		);

		$this->end_controls_section();

		// Styling Section
		$this->start_controls_section(
			'section_style',
			[
				'label' => __( 'Style', 'mattress-size-simulator' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'input_label_color',
			[
				'label'     => __( 'Input Label Color', 'mattress-size-simulator' ),
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
				'label'     => __( 'Input Background Color', 'mattress-size-simulator' ),
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
				'label'     => __( 'Canvas Background Color', 'mattress-size-simulator' ),
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

		wp_localize_script(
			'mattress-size-simulator-frontend',
			'mattressSizeSimulatorData',
			[
				'products'        => $products,
				'svgUrls'         => [
					'mummy'  => $mummy_svg_url,
					'square' => $square_svg_url,
					'female' => $female_svg_url,
					'male'   => $male_svg_url,
				],
				'maxCanvasWidth'  => $max_canvas_width,
				'minHeight'       => $min_height,
			]
		);

		?>
		<div class="mss-wrapper" style="max-width: <?php echo esc_attr( $max_canvas_width ); ?>px;">
			<!-- Input Controls -->
			<div class="mss-controls">
				<div class="mss-control-group">
					<label class="mss-label" for="mss-product-select">
						<?php esc_html_e( 'Select Mattress', 'mattress-size-simulator' ); ?>
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
						<?php esc_html_e( 'Select Gender', 'mattress-size-simulator' ); ?>
					</label>
					<select id="mss-gender-select" class="mss-input mss-select">
						<option value="male"><?php esc_html_e( 'Male', 'mattress-size-simulator' ); ?></option>
						<option value="female"><?php esc_html_e( 'Female', 'mattress-size-simulator' ); ?></option>
					</select>
				</div>

				<div class="mss-control-group">
					<label class="mss-label" for="mss-height-input">
						<?php esc_html_e( 'Height (cm)', 'mattress-size-simulator' ); ?>
					</label>
					<input type="number" id="mss-height-input" class="mss-input" min="140" max="220" value="170" step="1">
				</div>

				<div class="mss-control-group">
					<label class="mss-label" for="mss-shoulder-width-input">
						<?php esc_html_e( 'Shoulder Width (cm)', 'mattress-size-simulator' ); ?>
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
				<p><?php esc_html_e( 'Drag the silhouette on the canvas to move it around the mattress.', 'mattress-size-simulator' ); ?></p>
			</div>
		</div>
		<?php
	}
}
