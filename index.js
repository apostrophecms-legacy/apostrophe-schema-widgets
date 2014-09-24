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
  self.widgets = {};
  self._apos = apos;
  self._app = app;
  self._schemas = schemas;
  self._options = options;
  self._pages = options.pages;
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
  self.pushAsset('stylesheet', 'editor', { when: 'user' });

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

        if (err) {
          return callback(err, object);
        } 
        return widget.afterConvertFields(req, object, function(e) {
          return callback(e, object);
        });
      });
    };

    widget.renderWidget = function(data) {
      return self.render(widget.name, data);
    };

    widget.empty = function(data) {
      return self._schemas.empty(options.schema, data);
    };

    widget.afterConvertFields = function(req, object, callback) {
      return callback(null);
    };

    widget.load = function(req, item, callback) {
      if (req.aposSchemaWidgetLoading) {
        // Refuse to do perform joins through two levels of schema widgets.
        // This prevents a number of infinite loop scenarios. For this to
        // work properly page loaders should continue to run in series
        // rather than in parallel. -Tom
        return setImmediate(callback());
      }
      req.aposSchemaWidgetLoading = true;
      return self._schemas.join(req, options.schema, item, undefined, function(err) {
        req.aposSchemaWidgetLoading = false;
        return setImmediate(_.partial(callback, err));
      });
    };
    apos.addWidgetType(widget.name, widget);
    self.widgets[widget.name] = widget;
  });

  return setImmediate(function() { return callback && callback(null); });
}
