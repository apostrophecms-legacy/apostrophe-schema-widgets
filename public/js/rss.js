jot.widgetTypes.rss = {
  label: 'RSS',
  editor: function(options) {
    var self = this;
        
    if (!options.messages) {
      options.messages = {};
    }
    if (!options.messages.missing) {
      options.messages.missing = 'Paste in an RSS feed URL first.';
    }

    self.afterCreatingEl = function() {
      self.$feed = self.$el.find('.jot-rss-feed');
      self.$feed.val(self.data.feed);
      setTimeout(function() {
        self.$feed.focus();
        self.$feed.setSelection(0, 0);
      }, 500);
      self.$el.find('.jot-preview-button').click(function() {
        self.preview();
        return false;
      });
    };

    self.type = 'rss';
    options.template = '.jot-rss-editor';

    self.prePreview = getFeed;
    self.preSave = getFeed;

    function getFeed(callback) {
      self.exists = !!self.$feed.val();
      if (self.exists) {
        self.data.feed = self.$feed.val();
      }
      return callback();
    }

    // Parent class constructor shared by all widget editors
    jot.widgetEditor.call(self, options);
  },
};

