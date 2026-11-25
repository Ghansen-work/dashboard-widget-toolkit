/* Donut widget: an ECharts ring with the total in the middle and a legend listing each share. */
(function () {
  'use strict';

  DashKit.widgets.donut = {
    render: function (widget, body, ctx) {
      var t = ctx.tokens;
      var kind = widget.format || 'number';
      var total = widget.slices.reduce(function (sum, s) { return sum + s.value; }, 0);
      function share(v) { return total ? ctx.format(v / total, 'percent') : '—'; }

      var layout = ctx.el('div', 'dk-donut');
      var ring = ctx.el('div', 'dk-donut__chart');
      layout.appendChild(ring);
      body.appendChild(layout);

      var option = {
        color: t.series,
        textStyle: { fontFamily: t.font, color: t.ink },
        title: {
          text: ctx.format(total, kind, { compact: true }),
          subtext: widget.center_label || 'Total',
          left: 'center',
          top: 'center',
          itemGap: 2,
          textStyle: { color: t.ink, fontFamily: t.font, fontSize: 20, fontWeight: 600 },
          subtextStyle: { color: t.muted, fontFamily: t.font, fontSize: 12 }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: t.surface,
          borderColor: t.rule,
          textStyle: { color: t.ink, fontFamily: t.font, fontSize: 12 },
          valueFormatter: function (v) { return ctx.format(v, kind) + ' (' + share(v) + ')'; }
        },
        series: [{
          type: 'pie',
          radius: ['60%', '88%'],
          center: ['50%', '50%'],
          startAngle: 90,
          clockwise: true,
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          emphasis: { scale: false },
          itemStyle: { borderColor: t.surface, borderWidth: 2 },
          data: widget.slices.map(function (s) { return { name: s.label, value: s.value }; })
        }]
      };
      ctx.chart(ring, option, 200);

      // The legend is the readable version of the chart: label, amount, and share for every slice.
      var legend = ctx.el('ul', 'dk-donut__legend');
      widget.slices.forEach(function (s, i) {
        var item = ctx.el('li', 'dk-donut__item');
        item.appendChild(ctx.el('span', 'dk-swatch dk-swatch-' + (i + 1)));
        item.appendChild(ctx.el('span', 'dk-donut__label', s.label));
        item.appendChild(ctx.el('span', 'dk-donut__value', ctx.format(s.value, kind, { compact: true })));
        item.appendChild(ctx.el('span', 'dk-donut__share', share(s.value)));
        legend.appendChild(item);
      });
      layout.appendChild(legend);
    }
  };
})();
