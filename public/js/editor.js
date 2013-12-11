// @class Editor for RSS feed widgets

function AposRssWidgetEditor(options) {
  var self = this;

  if (!options.messages) {
    options.messages = {};
  }
  if (!options.messages.missing) {
    options.messages.missing = 'Paste in an RSS feed URL first.';
  }

  self.type = 'rss';
  options.template = '.apos-rss-editor';

  AposWidgetEditor.call(self, options);

  self.prePreview = getFeed;
  self.preSave = getFeed;

  self.afterCreatingEl = function() {
    self.$feed = self.$el.find('[name="feed"]');
    self.$feed.val(self.data.feed);
    self.$limit = self.$el.find('[name="limit"]');
    self.$limit.val(self.data.limit || 10);
    setTimeout(function() {
      self.$feed.focus();
      self.$feed.setSelection(0, 0);
    }, 500);
  };

  function getFeed(callback) {
    self.exists = !!self.$feed.val();
    if (self.exists) {
      self.data.feed = self.$feed.val();
      self.data.limit = self.$limit.val();
    }
    return callback();
  }
}

AposRssWidgetEditor.label = 'RSS Feed';

apos.addWidgetType('rss');
