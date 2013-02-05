var feedparser = require('feedparser');

var cache = {};

module.exports = function(options) {
  new widget(options);
};

function widget(options) {
  var jot = options.jot;
  var app = options.app;
  var self = this;
  
  var lifetime = options.lifetime ? options.lifetime : 60000;

  // This widget should be part of the default set of widgets for areas
  // (this isn't mandatory)
  jot.defaultControls.push('rss');

  // Include our editor template in the markup when jotTemplates is called
  jot.templates.push(__dirname + '/views/rssEditor');

  // Make sure that jotScripts and jotStylesheets summon our assets

  // We need the editor for RSS feeds. (TODO: consider separate script lists for
  // resources needed also by non-editing users.)
  jot.scripts.push('/jot-rss/js/rss.js');

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
    // The properties you add should start with an _ to denote that
    // they shouldn't become data attributes or get stored back to MongoDB

    load: function(item, callback) {
      item._entries = [];

      var now = new Date();
      if (cache.hasOwnProperty(item.feed) && ((cache[item.feed].when + lifetime) > now.getTime())) {
        item._entries = cache[item.feed].data;
        return callback();
      } 

      feedparser.parseUrl(item.feed).on('complete', function(meta, articles) {
        // map is native in node
        item._entries = articles.map(function(article) {
          return {
            title: article.title,
            body: article.description,
            date: article.pubDate
          };
        });
        // Cache for fast access later
        cache[item.feed] = { when: now.getTime(), data: item._entries };
        return callback();
      }).on('error', function(error) {
        item._failed = true;
        return callback();
      });
    }
  };
}
