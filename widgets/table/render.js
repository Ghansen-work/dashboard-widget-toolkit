/* Table widget: typed columns, right-aligned numbers, status pills. */
(function () {
  'use strict';
  var NUMERIC = { number: true, integer: true, currency: true, percent: true };

  DashKit.widgets.table = {
    render: function (widget, body, ctx) {
      if (!widget.rows.length) {
        body.appendChild(ctx.el('p', 'dk-empty', widget.empty_message || 'No rows to show.'));
        return;
      }

      var wrap = ctx.el('div', 'dk-table-wrap');
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', widget.title);
      wrap.tabIndex = 0;

      var table = ctx.el('table', 'dk-table');
      var head = ctx.el('thead');
      var headRow = ctx.el('tr');
      widget.columns.forEach(function (col) {
        var th = ctx.el('th', NUMERIC[col.format] ? 'dk-align-right' : null, col.label);
        th.setAttribute('scope', 'col');
        headRow.appendChild(th);
      });
      head.appendChild(headRow);
      table.appendChild(head);

      var tbody = ctx.el('tbody');
      widget.rows.forEach(function (row) {
        var tr = ctx.el('tr');
        widget.columns.forEach(function (col) {
          var kind = col.format || 'text';
          var value = row[col.key];
          var td = ctx.el('td', NUMERIC[kind] ? 'dk-align-right dk-nowrap' : kind === 'text' ? 'dk-cell-text' : 'dk-nowrap');
          if (kind === 'status' && value) {
            td.appendChild(ctx.el('span', 'dk-pill dk-tone-' + value.level, value.text));
          } else {
            td.textContent = ctx.format(value, kind);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      body.appendChild(wrap);

      if (typeof widget.total_count === 'number' && widget.total_count > widget.rows.length) {
        ctx.addNote('Showing ' + ctx.format(widget.rows.length, 'integer') + ' of ' + ctx.format(widget.total_count, 'integer') + ' rows');
      }
    }
  };
})();
