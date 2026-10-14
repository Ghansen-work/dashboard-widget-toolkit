/*
  Renders the widget body. The card, title, subtitle, and notes are drawn for
  you by the renderer; only fill in `body`.

  ctx.el(tag, className, text)        create an element (text set safely)
  ctx.format(value, kind, options)    the shared number/date formatter
  ctx.tokens                          theme values (colors, font) for charts
  ctx.chart(body, echartsOption, h)   draw an ECharts chart (set x-requires-charts)
  ctx.addNote(text)                   add a footnote under the widget

  Rules: no innerHTML, no fetch, no literal colors or fonts.
*/
(function () {
  'use strict';
  DashKit.widgets.my_widget = {
    render: function (widget, body, ctx) {
      body.appendChild(ctx.el('p', null, ctx.format(widget.value, 'number')));
    }
  };
})();
