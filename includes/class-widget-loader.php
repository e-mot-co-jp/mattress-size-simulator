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
		add_action( 'elementor/frontend/after_enqueue_scripts', [ $this, 'enqueue_frontend_scripts' ] );
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
	}
}
