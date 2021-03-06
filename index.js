/* jshint node:true */

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
  self.toggleUi = options.toggleUi || false;
  self._apos = apos;
  self._app = app;
  self._schemas = schemas;
  self._options = options;
  self._pages = options.pages;
  self._apos.mixinModuleAssets(self, 'schema-widgets', __dirname, options);
  self._action = '/apos-schema-widgets';

  self._apos.pushGlobalData({
    schemaWidgetsUi: {
      toggleUi: self.toggleUi
    }
  });

  self.pushAsset('script', 'editor', { when: 'user' });
  self.pushAsset('stylesheet', 'editor', { when: 'user' });

  self.registerWidget = function(options) {
    var widget = {};
    apos.defaultControls.push(options.name);
    widget.name = options.name;
    widget.widget = true;
    widget.label = options.label || options.name;
    widget.css = options.css || apos.cssName(options.name);
    widget.icon = options.icon;

    if (options.afterLoad) {
      widget.afterLoad = options.afterLoad;
    }

    if (_.find(options.schema, function(field) {
      return (field.name === 'content');
    })) {
      console.error('\n\nERROR: apostrophe-schema-widgets schema fields must not be named "content". Fix your \"' + widget.name + '\" widget definition.\n\n');
    }

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

    widget.renderWidget = options.renderWidget || function(data) {
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
        return setImmediate(callback);
      }
      if (req.deferredLoads) {
        if (!req.deferredLoads[options.name]) {
          req.deferredLoads[options.name] = [];
          req.deferredLoaders[options.name] = widget.loadNow;
        }
        req.deferredLoads[options.name].push(item);
        return setImmediate(callback);
      }
      return widget.loadNow(req, [ item ], callback);
    };

    widget.loadNow = function(req, items, callback) {
      req.aposSchemaWidgetLoading = true;
      return self._schemas.join(req, options.schema, items, undefined, function(err) {
        if (err || typeof widget.afterLoad !== 'function'){
          req.aposSchemaWidgetLoading = false;
          return setImmediate(_.partial(callback, err));
        }
        return widget.afterLoad(req, items[0], function(err) {
          req.aposSchemaWidgetLoading = false;
          return setImmediate(_.partial(callback, err));
        });
      });
    };
    apos.addWidgetType(widget.name, widget);
    self.widgets[widget.name] = widget;
    var data = {
      schemaWidgets: {}
    };
    options.css = options.css || apos.cssName(options.name);
    data.schemaWidgets[widget.name] = options;
    self._apos.pushGlobalData(data);
    // originally designed to output templates for many widgets at once, this template
    // can be repurposed to push them one at a time
    self.pushAsset('template', 'widgetEditors', { when: 'user', data: { widgets: [ options ] } });

  };

  _.each(options.widgets, self.registerWidget);

  if (callback) {
    process.nextTick(function() { return callback(null); });
  }
}
