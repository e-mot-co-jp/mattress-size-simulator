<?php
/**
 * Plugin Name: Mattress Size Simulator
 * Plugin URI: https://e-mot.co.jp
 * Description: Elementor widget for mattress size simulation with sleeper silhouette overlay
 * Version: 1.0.11
 * Author: e-mot.co.jp
 * Author URI: https://e-mot.co.jp
 * Text Domain: mattress-size-simulator
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Elementor tested up to: 3.35
 * License: GPL v3 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * @package MattressSizeSimulator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * Define constants
 */
define( 'MATTRESS_SIZE_SIMULATOR_VERSION', '1.0.11' );
define( 'MATTRESS_SIZE_SIMULATOR_PATH', plugin_dir_path( __FILE__ ) );
define( 'MATTRESS_SIZE_SIMULATOR_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load the plugin
 */
class Mattress_Size_Simulator {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'plugins_loaded', [ $this, 'init' ] );
	}

	/**
	 * Initialize the plugin
	 */
	public function init() {
		// Check if Elementor is active
		if ( ! did_action( 'elementor/loaded' ) ) {
			add_action( 'admin_notices', [ $this, 'admin_notice_missing_elementor' ] );
			return;
		}

		// Check Elementor version
		if ( ! version_compare( ELEMENTOR_VERSION, '3.0', '>=' ) ) {
			add_action( 'admin_notices', [ $this, 'admin_notice_elementor_version' ] );
			return;
		}

		// Load required files
		require_once MATTRESS_SIZE_SIMULATOR_PATH . 'includes/class-widget-loader.php';

		// Initialize widget loader
		new Mattress_Size_Simulator_Widget_Loader();

		// Enqueue scripts and styles
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_editor_scripts' ] );
	}

	/**
	 * Admin notice: Missing Elementor
	 */
	public function admin_notice_missing_elementor() {
		if ( isset( $_GET['activate'] ) ) {
			unset( $_GET['activate'] );
		}
		?>
		<div class="notice notice-warning is-dismissible">
			<p>
				<?php
				echo wp_kses_post(
					sprintf(
						/* translators: 1: Plugin name 2: Elementor URL */
						__( '%1$s requires %2$s to be installed and activated.', 'mattress-size-simulator' ),
						'<strong>Mattress Size Simulator</strong>',
						'<a href="' . esc_url( admin_url( 'plugin-install.php?tab=search&s=elementor&plugin-search-input=Search+Plugins' ) ) . '"><strong>Elementor</strong></a>'
					)
				);
				?>
			</p>
		</div>
		<?php
	}

	/**
	 * Admin notice: Elementor version check
	 */
	public function admin_notice_elementor_version() {
		if ( isset( $_GET['activate'] ) ) {
			unset( $_GET['activate'] );
		}
		?>
		<div class="notice notice-warning is-dismissible">
			<p>
				<?php
				echo wp_kses_post(
					sprintf(
						/* translators: 1: Plugin name 2: Elementor minimum version */
						__( '%1$s requires Elementor version 3.0 or later.', 'mattress-size-simulator' ),
						'<strong>Mattress Size Simulator</strong>'
					)
				);
				?>
			</p>
		</div>
		<?php
	}

	/**
	 * Enqueue editor scripts
	 */
	public function enqueue_editor_scripts() {
		wp_enqueue_script(
			'mattress-size-simulator-editor',
			MATTRESS_SIZE_SIMULATOR_URL . 'assets/js/editor.js',
			[ 'elementor-editor' ],
			MATTRESS_SIZE_SIMULATOR_VERSION,
			true
		);
	}
}

// Initialize the plugin
new Mattress_Size_Simulator();
