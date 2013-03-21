apos.widgetTypes.rss = {
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
      self.$feed = self.$el.find('[name="feed"]');
      self.$feed.val(self.data.feed);
      self.$limit = self.$el.find('[name="limit"]');
      self.$limit.val(self.data.limit);
      setTimeout(function() {
        self.$feed.focus();
        self.$feed.setSelection(0, 0);
      }, 500);
    };

    self.type = 'rss';
    options.template = '.apos-rss-editor';

    self.prePreview = getFeed;
    self.preSave = getFeed;

    function getFeed(callback) {
      self.exists = !!self.$feed.val();
      if (self.exists) {
        self.data.feed = self.$feed.val();
        self.data.limit = self.$limit.val();
      }
      return callback();
    }

    // Parent class constructor shared by all widget editors
    apos.widgetEditor.call(self, options);
  },
};

