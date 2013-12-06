var feedparser = require('feedparser');
var extend = require('extend');
var cache = {};

module.exports = function(options, callback) {
  return new Construct(options, callback);
};

module.exports.Construct = Construct;

function Construct(options, callback) {
  var apos = options.apos;
  var app = options.app;
  var self = this;

  var lifetime = options.lifetime ? options.lifetime : 60000;

  self.pushAsset = function(type, name, optionsArg) {
    var options = {};
    if (optionsArg) {
      extend(true, options, optionsArg);
    }
    options.fs = __dirname;
    options.web = '/apos-rss';
    return apos.pushAsset(type, name, options);
  };

  // This widget should be part of the default set of widgets for areas
  // (this isn't mandatory)
  apos.defaultControls.push('rss');

  // Include our editor template in the markup when aposTemplates is called
  self.pushAsset('template', 'rssEditor', { when: 'user' });

  // Make sure that aposScripts and aposStylesheets summon our assets

  // We need the editor for RSS feeds. (TODO: consider separate script lists for
  // resources needed also by non-editing users.)
  self.pushAsset('script', 'editor', { when: 'user' });
  self.pushAsset('stylesheet', 'content', { when: 'always' });

  // Serve our assets
  app.get('/apos-rss/*', apos.static(__dirname + '/public'));

  apos.itemTypes.rss = {
    widget: true,
    label: 'RSS Feed',
    css: 'rss',
    icon: 'rss',
    sanitize: function(item) {
      if (!item.feed.match(/^https?\:\/\//)) {
        item.feed = 'http://' + item.feed;
      }
      item.limit = parseInt(item.limit, 10);
    },
    render: function(data) {
      return apos.partial('rss', data, __dirname + '/views');
    },

    // Asynchronously load the actual RSS feed
    // The properties you add should start with an _ to denote that
    // they shouldn't become data attributes or get stored back to MongoDB

    load: function(req, item, callback) {
      item._entries = [];

      var now = new Date();
      // Take all properties into account, not just the feed, so the cache
      // doesn't prevent us from seeing a change in the limit property right away
      var key = JSON.stringify({ feed: item.feed, limit: item.limit });
      if (cache.hasOwnProperty(key) && ((cache[key].when + lifetime) > now.getTime())) {
        item._entries = cache[key].data;
        return callback();
      }

      feedparser.parseUrl(item.feed).on('complete', function(meta, articles) {
        articles = articles.slice(0, item.limit);

        // map is native in node
        item._entries = articles.map(function(article) {
          return {
            title: article.title,
            body: article.description,
            date: article.pubDate
          };
        });
        // Cache for fast access later
        cache[key] = { when: now.getTime(), data: item._entries };
        return callback();
      }).on('error', function(error) {
        item._failed = true;
        return callback();
      });
    }
  };
  return setImmediate(function() { return callback(null); });
}
