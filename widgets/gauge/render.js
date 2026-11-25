/* Gauge widget: a KPI-style value with a linear bar against a floor, ceiling, or goal. Plain DOM. */
(function () {
  'use strict';

  var LABELS = { floor: 'floor', ceiling: 'ceiling', goal: 'goal' };

  // Rounds up to a tidy scale end (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 times a power of ten).
  function niceCeil(x) {
    if (x <= 0) return 1;
    var power = Math.pow(10, Math.floor(Math.log(x) / Math.LN10));
    var steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (x <= steps[i] * power * 1.0000001) return steps[i] * power;
    return 10 * power;
  }

  // good | warning | critical | neutral, from where the value sits against the target.
  function toneFor(value, target) {
    var t = target.value;
    var w = target.warning_within || 0;
    if (target.kind === 'goal') return value >= t ? 'good' : 'neutral';
    if (target.kind === 'floor') {
      if (value < t) return 'critical';
      return w && value < t + w ? 'warning' : 'good';
    }
    if (value > t) return 'critical';
    return w && value > t - w ? 'warning' : 'good';
  }

  DashKit.widgets.gauge = {
    render: function (widget, body, ctx) {
      var kind = widget.format || 'number';
      var target = widget.target;
      var value = widget.value;
      var name = target.label || LABELS[target.kind];

      // Headline value, styled exactly like a KPI.
      if (value === null) {
        body.appendChild(ctx.el('p', 'dk-kpi__value dk-kpi__value--empty', 'No data'));
      } else {
        var big = ctx.el('p', 'dk-kpi__value', ctx.format(value, kind, { compact: true }));
        big.title = ctx.format(value, kind);
        body.appendChild(big);
      }

      // Status line: how far above or below the threshold, then what the threshold is.
      var tone = value === null ? 'neutral' : toneFor(value, target);
      var status = ctx.el('p', 'dk-kpi__delta');
      var pillText;
      if (value === null) {
        pillText = 'Not measured';
      } else if (target.kind === 'goal') {
        pillText = target.value ? ctx.format(value / target.value, 'percent') + ' of ' + LABELS.goal : (value >= target.value ? 'Goal met' : 'Below goal');
      } else {
        var diff = value - target.value;
        var amount = kind === 'percent'
          ? ctx.format(Math.abs(diff) * 100, 'number') + ' pts'
          : ctx.format(Math.abs(diff), kind, { compact: true });
        pillText = diff === 0 ? 'At ' + LABELS[target.kind] : (diff > 0 ? '▲ ' + amount + ' above' : '▼ ' + amount + ' below');
      }
      status.appendChild(ctx.el('span', 'dk-pill dk-tone-' + tone, pillText));
      status.appendChild(ctx.el('span', 'dk-kpi__delta-label', ctx.format(target.value, kind, { compact: true }) + ' ' + name));
      body.appendChild(status);

      // The bar: scale, failing and warning zones, the value, and a marker at the threshold.
      var known = [target.value].concat(value === null ? [] : [value]);
      var min = widget.range ? widget.range.min : Math.min(0, Math.min.apply(null, known));
      var max = widget.range ? widget.range.max : niceCeil(Math.max.apply(null, known.concat([target.value + (target.warning_within || 0)])) * 1.15);
      var span = max - min || 1;
      function pos(v) { return Math.max(0, Math.min(100, ((v - min) / span) * 100)); }

      var gauge = ctx.el('div', 'dk-gauge');
      gauge.setAttribute('role', 'img');
      gauge.setAttribute('aria-label', (value === null ? 'No data' : ctx.format(value, kind)) + ' against a ' + name + ' of ' + ctx.format(target.value, kind));
      var track = ctx.el('div', 'dk-gauge__track');

      function zone(from, to, className) {
        var left = pos(Math.min(from, to));
        var right = pos(Math.max(from, to));
        if (right <= left) return;
        var z = ctx.el('div', 'dk-gauge__zone ' + className);
        z.style.left = left.toFixed(2) + '%';
        z.style.width = (right - left).toFixed(2) + '%';
        track.appendChild(z);
      }
      var w = target.warning_within || 0;
      if (target.kind === 'floor') {
        zone(min, target.value, 'dk-gauge__zone--critical');
        if (w) zone(target.value, target.value + w, 'dk-gauge__zone--warning');
      } else if (target.kind === 'ceiling') {
        zone(target.value, max, 'dk-gauge__zone--critical');
        if (w) zone(target.value - w, target.value, 'dk-gauge__zone--warning');
      }

      if (value !== null) {
        var fill = ctx.el('div', 'dk-gauge__fill dk-gauge__fill--' + tone);
        // Bars grow from zero, or from the scale's edge when zero is off the scale.
        var start = pos(Math.max(min, Math.min(0, max)));
        var end = pos(value);
        fill.style.left = Math.min(start, end).toFixed(2) + '%';
        fill.style.width = Math.abs(end - start).toFixed(2) + '%';
        track.appendChild(fill);
      }

      var marker = ctx.el('div', 'dk-gauge__marker');
      marker.style.left = pos(target.value).toFixed(2) + '%';
      track.appendChild(marker);
      gauge.appendChild(track);

      var scale = ctx.el('div', 'dk-gauge__scale');
      scale.setAttribute('aria-hidden', 'true');
      scale.appendChild(ctx.el('span', null, ctx.format(min, kind, { compact: true })));
      scale.appendChild(ctx.el('span', null, ctx.format(max, kind, { compact: true })));
      gauge.appendChild(scale);
      body.appendChild(gauge);
    }
  };
})();
