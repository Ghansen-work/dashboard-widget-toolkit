/* Funnel widget: one row per stage with a bar, the value, and drop-off or share. Plain DOM, no chart library. */
(function () {
  'use strict';

  DashKit.widgets.funnel = {
    render: function (widget, body, ctx) {
      var kind = widget.format || 'integer';
      var conversion = (widget.mode || 'conversion') === 'conversion';
      var stages = widget.stages;
      var known = stages.filter(function (s) { return s.value !== null; });
      var max = known.length ? Math.max.apply(null, known.map(function (s) { return s.value; })) : 0;
      var total = known.reduce(function (sum, s) { return sum + s.value; }, 0);
      var first = stages[0].value;

      // In conversion mode, the biggest stage-to-stage loss gets emphasis.
      var biggestDrop = -1;
      var biggestLoss = 0;
      if (conversion) {
        for (var i = 1; i < stages.length; i++) {
          var a = stages[i - 1].value;
          var b = stages[i].value;
          if (a && b !== null && a - b > biggestLoss) { biggestLoss = a - b; biggestDrop = i; }
        }
      }

      var list = ctx.el('ol', 'dk-funnel');
      stages.forEach(function (stage, index) {
        var item = ctx.el('li', 'dk-funnel__stage');

        var head = ctx.el('div', 'dk-funnel__head');
        head.appendChild(ctx.el('span', 'dk-funnel__label', stage.label));
        head.appendChild(ctx.el('span', 'dk-funnel__value', ctx.format(stage.value, kind)));
        item.appendChild(head);

        var track = ctx.el('div', 'dk-funnel__track');
        track.setAttribute('aria-hidden', 'true');
        if (stage.value !== null && max > 0) {
          var bar = ctx.el('div', 'dk-funnel__bar');
          bar.style.width = Math.max(stage.value > 0 ? 0.5 : 0, (stage.value / max) * 100).toFixed(2) + '%';
          track.appendChild(bar);
        }
        item.appendChild(track);

        var meta = [];
        if (conversion) {
          if (index > 0) {
            var prev = stages[index - 1].value;
            meta.push(prev && stage.value !== null ? ctx.format(stage.value / prev, 'percent') + ' of previous' : '— of previous');
            meta.push(first && stage.value !== null ? ctx.format(stage.value / first, 'percent') + ' of ' + stages[0].label : '— of ' + stages[0].label);
          }
        } else if (stage.value !== null && total > 0) {
          meta.push(ctx.format(stage.value / total, 'percent') + ' of total');
        }
        if (stage.detail) meta.push(stage.detail);
        if (meta.length) {
          var line = ctx.el('p', 'dk-funnel__meta' + (index === biggestDrop ? ' dk-funnel__meta--emphasis' : ''), meta.join(' · '));
          item.appendChild(line);
        }
        list.appendChild(item);
      });
      body.appendChild(list);

      if (biggestDrop > 0) {
        ctx.addNote('Largest drop-off: ' + stages[biggestDrop - 1].label + ' to ' + stages[biggestDrop].label + '.');
      }
      if (!conversion && total > 0) {
        ctx.addNote('Total across stages: ' + ctx.format(total, kind) + '.');
      }
    }
  };
})();
