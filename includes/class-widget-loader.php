<?php
/**
 * Widget Loader Class
 *
 * @package MattressSizeSimulator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Class Mattress_Size_Simulator_Widget_Loader
 */
class Mattress_Size_Simulator_Widget_Loader {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_frontend_scripts' ] );
	}

	/**
	 * Register widgets
	 *
	 * @param \Elementor\Widgets_Manager $widgets_manager The widgets manager instance.
	 */
	public function register_widgets( $widgets_manager ) {
		require_once MATTRESS_SIZE_SIMULATOR_PATH . 'widgets/class-mattress-simulator-widget.php';
		$widgets_manager->register( new \Elementor\Mattress_Simulator_Widget() );
	}

	/**
	 * Enqueue frontend scripts and styles
	 */
	public function enqueue_frontend_scripts() {
		// Only enqueue on pages that use the widget
		if ( ! $this->has_widget_on_page() ) {
			return;
		}

		wp_enqueue_style(
			'mattress-size-simulator-style',
			MATTRESS_SIZE_SIMULATOR_URL . 'assets/css/frontend.css',
			[],
			MATTRESS_SIZE_SIMULATOR_VERSION
		);

		wp_enqueue_script(
			'mattress-size-simulator-frontend',
			MATTRESS_SIZE_SIMULATOR_URL . 'assets/js/frontend.js',
			[ 'jquery' ],
			MATTRESS_SIZE_SIMULATOR_VERSION,
			true
		);

		wp_localize_script(
			'mattress-size-simulator-frontend',
			'mattressSizeSimulatorConfig',
			[
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			]
		);
	}

	/**
	 * Check if the widget is used on the current page
	 *
	 * @return bool
	 */
	private function has_widget_on_page() {
		global $post;

		if ( ! isset( $post->ID ) ) {
			return false;
		}

		if ( ! function_exists( 'has_blocks' ) || ! has_blocks( $post->ID ) ) {
			return false;
		}

		$content = get_post_field( 'post_content', $post->ID );

		return strpos( $content, 'mattress-simulator' ) !== false;
	}
}
