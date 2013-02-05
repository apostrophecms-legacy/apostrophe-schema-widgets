var feedparser = require('feedparser');

module.exports = function(options) {
  new widget(options);
};

function widget(options) {
  var jot = options.jot;
  var app = options.app;
  var self = this;
  
  // This widget should be part of the default set of widgets for areas
  // (this isn't mandatory)
  jot.defaultControls.push('rss');

  // Include our editor template in the markup when jotTemplates is called
  jot.templates.push(__dirname + '/views/rssEditor');

  // Make sure that jotScripts and jotStylesheets summon our assets

  // We don't need any browser-side js in this case, so far anyway
  // jot.scripts.push('/jot-rss/js/rss.js');

  jot.stylesheets.push('/jot-rss/css/rss.css');

  // Serve our assets
  app.get('/jot-rss/*', jot.static(__dirname + '/public'));

  jot.itemTypes.rss = {
    widget: true,
    label: 'RSS Feed',
    css: 'rss',
    sanitize: function(item) {
      if (!item.feed.match(/^https?\:\/\//)) {
        item.feed = 'http://' + item.feed;
      }
    },
    render: function(data) {
      return jot.partial('rss.html', data, __dirname + '/views');
    },
    // Asynchronously load the actual RSS feed
    load: function(item, callback) {
      item.entries = [];
      // TODO: we must interpose a cache here!
      feedparser.parseUrl(item.feed).on('complete', function(meta, articles) {
        item.entries = articles;
        console.log(item);
        return callback();
      }).on('error', function(error) {
        item.failed = true;
        return callback();
      });
    }
  };
}
