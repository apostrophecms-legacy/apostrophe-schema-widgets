var _ = require('lodash');

module.exports = function(options, callback) {
  return new Construct(options, callback);
};

module.exports.Construct = Construct;

function Construct(options, callback) {
  var apos = options.apos;
  var app = options.app;
  var schemas = options.schemas;
  var self = this;
  self._apos = apos;
  self._app = app;
  self._schemas = schemas;
  self._options = options;
  self._apos.mixinModuleAssets(self, 'schema-widgets', __dirname, options);

  self._apos.pushGlobalData({
    schemaWidgets: _.map(options.widgets, function(info) {
      info.css = info.css || apos.cssName(info.name);
      return info;
    })
  });

  // widgetEditors.html will spit out a frontend DOM template for editing
  // each widget type we register
  self.pushAsset('template', 'widgetEditors', { when: 'user', data: options });

  self.pushAsset('script', 'editor', { when: 'user' });

  _.each(options.widgets, function(options) {
    var widget = {};
    apos.defaultControls.push(options.name);
    widget.name = options.name;
    widget.widget = true;
    widget.label = options.label || options.name;
    widget.css = options.css || apos.cssName(options.name);
    widget.icon = options.icon;
    widget.sanitize = function(req, item, callback) {
      var object = {};
      return schemas.convertFields(req, options.schema, 'form', item, object, function(err) {
        return callback(err, object);
      });
    };
    widget.renderWidget = function(data) {
      return self.render(widget.name, data);
    };
    widget.load = function(req, item, callback) {
      // TODO: carry out joins in the schema, including
      // those nested in arrays
      return callback(null);
    };
    console.log('adding ' + widget.name);
    apos.addWidgetType(widget.name, widget);
  });

  return setImmediate(function() { return callback(null); });
}
