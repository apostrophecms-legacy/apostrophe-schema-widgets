# apostrophe-schema-widgets

apostrophe-schema-widgets is a widget builder for the [Apostrophe](http://apostrophenow.org) content management system. You can easily configure any number of custom widgets using [Apostrophe schemas](https://github.com/punkave/apostrophe-schemas).

## Installation

```
npm install apostrophe-schema-widgets
```

*Make sure you add it to `package.json` so it also installs on deployment.*

## Usage

In `app.js`, just configure the module:

```javascript
'apostrophe-schema-widgets': {
  widgets: [
    {
      name: 'prettyLink',
      label: 'Pretty Link',
      schema: [
        {
          name: 'label',
          type: 'string',
          label: 'Label'
        },
        {
          name: 'url',
          type: 'url',
          value: 'URL'
        }
      ]
    }
  ]
}
```

Here I've configured one simple widget, which has two fields in its editor, "label" and "URL."

Now, create a template for displaying this widget as the file `lib/modules/apostrophe-schema-widgets/views/prettyLink.html`:

```markup
<div class="so-pretty">
  <a href="{{ item.url | e }}">{{ item.label | e }}</a>
</div>
```

Note that your template can also access options passed to the widget via the `options` object.

Right away, this is useful. But it's a lot more useful if you use the "array" feature of schemas. This way we can edit an entire list of "pretty links" in a single place, which gives us more control over presentation.

In `app.js`:

```javascript
`apostrophe-schema-widgets`: {
  widgets: [
    {
      name: 'prettyLinks',
      label: 'Pretty Links',
      schema: [
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          schema: [
            {
              name: 'label',
              type: 'string',
              label: 'Label'
            },
            {
              name: 'url',
              type: 'url',
              value: 'URL'
            }
          ]
        }
      ]
    }
  ]
}
```

And in `lib/modules/apostrophe-schema-widgets/views/prettyLinks.html`:

```markup
<ul class="so-pretty">
  {% for link in item.links %}
    <li><a href="{{ link.url | e }}">{{ link.label | e }}</a></li>
  {% endfor %}
</ul>
```
