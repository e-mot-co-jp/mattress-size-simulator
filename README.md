# Mattress Size Simulator

Elementor widget for mattress size simulation with sleeper silhouette overlay.

## Features

- **Interactive Simulator**: Visualize mattress sizes with overlaid human silhouettes
- **Responsive Design**: Maintains aspect ratios and scales responsively
- **Draggable Silhouette**: Move silhouettes around the mattress for better visualization
- **Customizable Parameters**: Configure mattress products, sizes, and shapes from Elementor editor
- **SVG Support**: Upload custom SVG assets for mattressand silhouettes
- **Gender Selection**: Support for male and female silhouettes
- **Body Measurements**: Input height and shoulder width to simulate different body types

## Requirements

- WordPress 6.0+
- PHP 8.0+
- Elementor 3.0+
- Elementor Pro 3.0+ (optional, for advanced features)

## Installation

1. Upload the plugin directory to `/wp-content/plugins/`
2. Activate the plugin through the WordPress admin panel
3. Create a page with Elementor and add the "Mattress Size Simulator" widget

## Configuration

### Widget Settings

1. **Mattress Products**: Add/edit mattress products with:
   - Product Name (e.g., "R+")
   - Width (cm)
   - Length (cm)
   - Shape (Mummy or Square)

2. **SVG Assets**: Upload custom SVG files for:
   - Mummy Mat
   - Square Mat
   - Female Silhouette
   - Male Silhouette

3. **Canvas Settings**:
   - Maximum Canvas Width (px)
   - Minimum Canvas Height (px)

4. **Styling**: Customize colors for:
   - Input Labels
   - Input Backgrounds
   - Canvas Background

## Default Mattress Sizes

- R+: 56 x 185 cm (Mummy)
- RW+: 66 x 185 cm (Mummy)
- L+: 66 x 198 cm (Mummy)
- S: 51 x 119 cm (Square)
- R: 51 x 183 cm (Mummy)
- L: 64 x 196 cm (Square)
- XL: 76 x 196 cm (Square)
- XXL: 76 x 203 cm (Square)

## Usage

### For End Users

1. Select a mattress size from the dropdown
2. Choose male or female silhouette
3. Enter your height (cm)
4. Enter your shoulder width (cm)
5. Drag the silhouette on the canvas to explore different positions

### For Developers

The widget uses the following JavaScript class:
```javascript
new MattressSizeSimulator($wrapper);
```

## Files Structure

```
mattress-size-simulator/
├── mattress-size-simulator.php       # Main plugin file
├── includes/
│   └── class-widget-loader.php       # Widget loader class
├── widgets/
│   └── class-mattress-simulator-widget.php # Main widget class
├── assets/
│   ├── css/
│   │   └── frontend.css              # Frontend styles
│   └── js/
│       ├── frontend.js               # Frontend JavaScript
│       └── editor.js                 # Editor integration
├── languages/                         # Translation files
├── .gitignore
└── README.md

## Development

### Testing Commands

```bash
# Check if plugin is activated
wp plugin status mattress-size-simulator

# List all widgets
wp elementor-widgets list

# Test widget rendering
wp post list --post_type=page --format=table

# Check for PHP errors
wp shell
> error_log() calls and PHP notices check
```

## Troubleshooting

### SVG Not Loading

- Verify SVG files are uploaded to the media library
- Check browser console for CORS errors
- Ensure SVG MIME type is allowed in wp-config.php

### Silhouette Not Draggable

- Check that JavaScript is enabled
- Verify jQuery is loaded
- Clear browser cache

### Canvas Not Responsive

- Check CSS media queries are applied
- Verify canvas width calculation in frontend.js
- Test on different screen sizes

## Version History

### 1.0.0 (Initial Release)
- Initial widget implementation
- Support for mattress products and silhouettes
- Drag functionality
- Responsive design

## License

GPL v3 or later

## Author

e-mot.co.jp
