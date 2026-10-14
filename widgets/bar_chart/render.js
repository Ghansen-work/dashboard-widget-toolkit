/* Bar chart widget: ECharts bars styled entirely from theme tokens. */
(function () {
  'use strict';

  DashKit.widgets.bar_chart = {
    render: function (widget, body, ctx) {
      var t = ctx.tokens;
      var kind = widget.format || 'number';
      var horizontal = widget.orientation === 'horizontal';
      var multi = widget.series.length > 1;
      var grouped = multi && !widget.stacked;

      var axisText = { color: t.muted, fontFamily: t.font, fontSize: 12 };
      // Category labels get up to a third of the chart width before truncating.
      var labelWidth = Math.max(80, Math.min(180, Math.round((body.clientWidth || 600) * 0.33)));
      var categoryAxis = {
        type: 'category',
        data: widget.categories,
        inverse: horizontal,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: t.rule } },
        axisLabel: Object.assign({}, axisText, horizontal
          ? { width: labelWidth, overflow: 'truncate' }
          : { interval: 0, hideOverlap: true })
      };
      var valueAxis = {
        type: 'value',
        splitNumber: (body.clientWidth || 600) < 500 ? 3 : 5,
        splitLine: { lineStyle: { color: t.ruleSoft } },
        axisLabel: Object.assign({}, axisText, {
          hideOverlap: true,
          formatter: function (v) { return ctx.format(v, kind, { compact: true }); }
        })
      };

      var option = {
        color: t.series,
        textStyle: { fontFamily: t.font, color: t.ink },
        grid: { left: 4, right: horizontal ? 28 : 12, top: multi ? 36 : 12, bottom: 4, containLabel: true },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow', shadowStyle: { color: t.ruleSoft, opacity: 0.6 } },
          backgroundColor: t.surface,
          borderColor: t.rule,
          textStyle: { color: t.ink, fontFamily: t.font, fontSize: 12 },
          valueFormatter: function (v) { return ctx.format(v, kind); }
        },
        xAxis: horizontal ? valueAxis : categoryAxis,
        yAxis: horizontal ? categoryAxis : valueAxis,
        series: widget.series.map(function (s) {
          return {
            name: s.name,
            type: 'bar',
            data: s.values,
            stack: widget.stacked ? 'total' : undefined,
            barMaxWidth: 40,
            barGap: '15%'
          };
        })
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

      var height = t.chartHeight;
      if (horizontal) {
        var perCategory = grouped ? 14 * widget.series.length + 10 : 30;
        height = Math.max(t.chartHeight, widget.categories.length * perCategory + (multi ? 70 : 40));
      }

      ctx.chart(body, option, height);
    }
  };
})();
