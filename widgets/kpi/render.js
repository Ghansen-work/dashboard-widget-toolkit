/* KPI widget: one headline number, optional delta and sparkline. */
(function () {
  'use strict';
  var SVG = 'http://www.w3.org/2000/svg';

  function sparkline(values) {
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'dk-kpi__spark');
    svg.setAttribute('viewBox', '0 0 100 32');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var span = max - min || 1;
    var step = 100 / (values.length - 1);
    var points = values.map(function (v, i) {
      return (i * step).toFixed(2) + ',' + (30 - ((v - min) / span) * 28).toFixed(2);
    });
    var line = document.createElementNS(SVG, 'polyline');
    line.setAttribute('class', 'dk-kpi__spark-line');
    line.setAttribute('points', points.join(' '));
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(line);
    return svg;
  }

  DashKit.widgets.kpi = {
    render: function (widget, body, ctx) {
      var kind = widget.format || 'number';

      if (widget.value === null) {
        body.appendChild(ctx.el('p', 'dk-kpi__value dk-kpi__value--empty', 'No data'));
      } else {
        var value = ctx.el('p', 'dk-kpi__value', ctx.format(widget.value, kind, { compact: true }));
        value.title = ctx.format(widget.value, kind);
        body.appendChild(value);
      }

      if (widget.delta) {
        var delta = widget.delta;
        var goodWhenUp = (delta.good_direction || 'up') === 'up';
        var tone = delta.value === 0 ? 'neutral' : (delta.value > 0) === goodWhenUp ? 'good' : 'critical';
        var deltaKind = (delta.format || 'percent') === 'percent' ? 'percent' : kind;
        var amount = ctx.format(delta.value, deltaKind, { signed: true, compact: true });
        var arrow = delta.value > 0 ? '\u25B2 ' : delta.value < 0 ? '\u25BC ' : '';

        var row = ctx.el('p', 'dk-kpi__delta');
        var chip = ctx.el('span', 'dk-pill dk-tone-' + tone, arrow + amount);
        chip.setAttribute('aria-label', (delta.value > 0 ? 'Up ' : delta.value < 0 ? 'Down ' : 'No change ') + amount.replace(/^[+\-\u2212]/, ''));
        row.appendChild(chip);
        row.appendChild(ctx.el('span', 'dk-kpi__delta-label', delta.label));
        body.appendChild(row);
      }

      if (widget.sparkline) body.appendChild(sparkline(widget.sparkline));
    }
  };
})();
