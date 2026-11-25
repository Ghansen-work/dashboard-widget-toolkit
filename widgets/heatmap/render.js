/* Heatmap widget: a table whose cells are shaded by value. Plain DOM, colors from tokens via CSS. */
(function () {
  'use strict';

  DashKit.widgets.heatmap = {
    render: function (widget, body, ctx) {
      var kind = widget.format || 'number';
      var showValues = widget.show_values !== false;
      var cells = [].concat.apply([], widget.values).filter(function (v) { return v !== null; });
      var min = cells.length ? Math.min.apply(null, cells) : 0;
      var max = cells.length ? Math.max.apply(null, cells) : 0;
      var hasGaps = widget.values.some(function (row) { return row.indexOf(null) !== -1; });

      // 0 to 1 heat; the lowest value still gets a light tint so it doesn't read as empty.
      function heat(v) { return max === min ? 0.5 : 0.08 + 0.92 * ((v - min) / (max - min)); }

      var wrap = ctx.el('div', 'dk-table-wrap');
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', widget.title);
      var table = ctx.el('table', 'dk-table dk-heatmap');

      var thead = ctx.el('thead');
      var headRow = ctx.el('tr');
      var corner = ctx.el('th', null, widget.row_header || '');
      corner.setAttribute('scope', 'col');
      headRow.appendChild(corner);
      widget.column_labels.forEach(function (label) {
        var th = ctx.el('th', 'dk-heatmap__col', label);
        th.setAttribute('scope', 'col');
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      var tbody = ctx.el('tbody');
      widget.row_labels.forEach(function (label, r) {
        var tr = ctx.el('tr');
        var th = ctx.el('th', 'dk-heatmap__row', label);
        th.setAttribute('scope', 'row');
        tr.appendChild(th);
        (widget.values[r] || []).forEach(function (v, c) {
          var td;
          if (v === null) {
            td = ctx.el('td', 'dk-heatmap__cell dk-heatmap__cell--empty', '—');
            td.setAttribute('aria-label', 'No data');
          } else {
            var h = heat(v);
            td = ctx.el('td', 'dk-heatmap__cell' + (h > 0.55 ? ' dk-heatmap__cell--strong' : ''), showValues ? ctx.format(v, kind) : '');
            td.style.setProperty('--dk-heat', h.toFixed(3));
            td.title = widget.row_labels[r] + ', ' + widget.column_labels[c] + ': ' + ctx.format(v, kind);
            if (!showValues) td.setAttribute('aria-label', ctx.format(v, kind));
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      body.appendChild(wrap);

      // Legend: the scale's range, and what an empty cell means.
      var legend = ctx.el('div', 'dk-heatmap__legend');
      legend.setAttribute('aria-hidden', 'true');
      if (cells.length) {
        legend.appendChild(ctx.el('span', null, ctx.format(min, kind, { compact: true })));
        legend.appendChild(ctx.el('span', 'dk-heatmap__ramp'));
        legend.appendChild(ctx.el('span', null, ctx.format(max, kind, { compact: true })));
      }
      if (hasGaps) {
        var gap = ctx.el('span', 'dk-heatmap__gap-key');
        gap.appendChild(ctx.el('span', 'dk-heatmap__gap-swatch'));
        gap.appendChild(ctx.el('span', null, 'No data'));
        legend.appendChild(gap);
      }
      body.appendChild(legend);
    }
  };
})();
