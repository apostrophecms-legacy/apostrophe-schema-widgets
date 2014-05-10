// @class Editor for all schema widgets

// After apos.data is available
$(function() {
  _.each(apos.data.schemaWidgets, function(info) {
    apos.widgetTypes[info.name] = {
      label: info.label,
      editor: function(options) {
        var self = this;

        self.type = info.name;
        options.template = '.apos-' + info.css + '-editor';

        AposWidgetEditor.call(self, options);

        self.prePreview = function(callback) {
          // The preview call at startup just causes false negatives for
          // the "required" fields, and we don't do preview in the
          // widget editors anymore anyway
          // return self.debrief(callback);
        };

        self.preSave = function(callback) {
          return self.debrief(callback);
        };

        self.afterCreatingEl = function(callback) {
          self.$fields = aposSchemas.findSafe(self.$el, '[data-fields]');
          return aposSchemas.populateFields(self.$fields, info.schema, self.data, callback);
        };

        self.debrief = function(callback) {
          self.exists = false;
          return aposSchemas.convertFields(self.$fields, info.schema, self.data, function(err) {
            if (err) {
              aposSchemas.scrollToError($piece);
              return;
            }
            self.exists = true;
            return callback(null);
          });
        };
      }
    };

  });
});
