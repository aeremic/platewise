const { AndroidConfig, withAndroidColors, withAndroidStyles } = require('expo/config-plugins');

/**
 * Native Android dialogs (Alert buttons) and pickers take the theme's `colorAccent`, which
 * otherwise falls back to the stock Material teal. Sets it to the app's accent color.
 */
module.exports = function withAndroidAccentColor(config, { color }) {
  config = withAndroidColors(config, (cfg) => {
    cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, { name: 'colorAccent', value: color });
    return cfg;
  });
  return withAndroidStyles(config, (cfg) => {
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'colorAccent',
      value: '@color/colorAccent',
    });
    return cfg;
  });
};
