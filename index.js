var feedparser = require('feedparser');

var cache = {};

module.exports = function(options) {
  return new widget(options);
};

function widget(options) {
  var apos = options.apos;
  var app = options.app;
  var self = this;

  var lifetime = options.lifetime ? options.lifetime : 60000;

  self.pushAsset = function(type, name) {
    return apos.pushAsset(type, name, __dirname, '/apos-rss');
  };

  // This widget should be part of the default set of widgets for areas
  // (this isn't mandatory)
  apos.defaultControls.push('rss');

  // Include our editor template in the markup when aposTemplates is called
  self.pushAsset('template', 'rssEditor');

  // Make sure that aposScripts and aposStylesheets summon our assets

  // We need the editor for RSS feeds. (TODO: consider separate script lists for
  // resources needed also by non-editing users.)
  self.pushAsset('script', 'rss');
  self.pushAsset('stylesheet', 'rss');

  // Serve our assets
  app.get('/apos-rss/*', apos.static(__dirname + '/public'));

  apos.itemTypes.rss = {
    widget: true,
    label: 'RSS Feed',
    css: 'rss',
    sanitize: function(item) {
      if (!item.feed.match(/^https?\:\/\//)) {
        item.feed = 'http://' + item.feed;
      }
      item.limit = parseInt(item.limit);
      console.log(item);
    },
    render: function(data) {
      return apos.partial('rss', data, __dirname + '/views');
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
        articles = articles.slice(0, item.limit);
        console.log('SLICED: ', articles.length);

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
