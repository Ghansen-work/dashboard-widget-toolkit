/* Line chart widget: ECharts lines over time, with gaps for null periods. */
(function () {
  'use strict';

  // Rounds up to a tidy axis bound (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 times a power of ten).
  function niceCeil(x) {
    if (x <= 0) return 0;
    var power = Math.pow(10, Math.floor(Math.log(x) / Math.LN10));
    var steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (x <= steps[i] * power * 1.0000001) return steps[i] * power;
    return 10 * power;
  }

  // A point with no neighbours would be invisible as a line, so it always gets a dot.
  function isolatedPoints(values) {
    return values.map(function (v, i) {
      if (v === null) return false;
      var before = i === 0 || values[i - 1] === null;
      var after = i === values.length - 1 || values[i + 1] === null;
      return before && after;
    });
  }

  DashKit.widgets.line_chart = {
    render: function (widget, body, ctx) {
      var t = ctx.tokens;
      var kind = widget.format || 'number';
      var multi = widget.series.length > 1;
      var refs = widget.reference_lines || [];
      var dense = widget.periods.length > 24;
      var hasGaps = widget.series.some(function (s) { return s.values.indexOf(null) !== -1; });

      var axisText = { color: t.muted, fontFamily: t.font, fontSize: 12 };
      var valueAxis = {
        type: 'value',
        splitNumber: (body.clientWidth || 600) < 500 ? 3 : 5,
        splitLine: { lineStyle: { color: t.ruleSoft } },
        axisLabel: Object.assign({}, axisText, {
          hideOverlap: true,
          formatter: function (v) { return ctx.format(v, kind, { compact: true }); }
        })
      };

      // Reference lines don't stretch the axis on their own, so make room for them.
      if (refs.length) {
        var data = [];
        widget.series.forEach(function (s) { s.values.forEach(function (v) { if (v !== null) data.push(v); }); });
        var dataMax = data.length ? Math.max.apply(null, data) : 0;
        var dataMin = data.length ? Math.min.apply(null, data) : 0;
        var refMax = Math.max.apply(null, refs.map(function (r) { return r.value; }));
        var refMin = Math.min.apply(null, refs.map(function (r) { return r.value; }));
        if (refMax > dataMax && refMax > 0) valueAxis.max = niceCeil(refMax * 1.1);
        if (refMin < Math.min(dataMin, 0)) valueAxis.min = -niceCeil(-refMin * 1.1);
      }

      var series = widget.series.map(function (s, index) {
        var isolated = isolatedPoints(s.values);
        var line = {
          name: s.name,
          type: 'line',
          data: s.values,
          connectNulls: false,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: function (value, params) { return dense && !isolated[params.dataIndex] ? 0 : 5; },
          lineStyle: { width: 2 },
          emphasis: { focus: 'series' }
        };
        if (widget.area) line.areaStyle = { opacity: 0.12 };
        if (index === 0 && refs.length) {
          line.markLine = {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: { type: 'dashed', color: t.muted, width: 1 },
            label: {
              position: 'insideEndTop',
              color: t.muted,
              fontFamily: t.font,
              fontSize: 12,
              formatter: function (p) { return p.name + ': ' + ctx.format(p.value, kind); }
            },
            data: refs.map(function (r) { return { name: r.label, yAxis: r.value }; })
          };
        }
        return line;
      });

      var option = {
        color: t.series,
        textStyle: { fontFamily: t.font, color: t.ink },
        // The first and last period labels sit centered on the plot edges, so leave room for half a label.
        grid: { left: 4, right: 28, top: multi ? 36 : 16, bottom: 4, containLabel: true },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { color: t.rule } },
          backgroundColor: t.surface,
          borderColor: t.rule,
          textStyle: { color: t.ink, fontFamily: t.font, fontSize: 12 },
          valueFormatter: function (v) { return ctx.format(v, kind); }
        },
        xAxis: {
          type: 'category',
          data: widget.periods,
          boundaryGap: false,
          axisTick: { show: false },
          axisLine: { lineStyle: { color: t.rule } },
          axisLabel: Object.assign({}, axisText, { hideOverlap: true })
        },
        yAxis: valueAxis,
        series: series
      };

      if (multi) {
        option.legend = {
          top: 0,
          left: 0,
          icon: 'roundRect',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: t.muted, fontFamily: t.font, fontSize: 12 }
        };
      }

      ctx.chart(body, option, t.chartHeight);
      if (hasGaps) ctx.addNote('Gaps in a line mark periods with no data.');
    }
  };
})();
