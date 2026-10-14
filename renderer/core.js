/*
  DashKit renderer core.

  Turns a validated dashboard spec into the page. Widgets register themselves
  on DashKit.widgets and receive a shared context (formatting, tokens, chart
  helper), so every widget formats numbers and draws charts the same way.

  Sandbox rules this file follows (Computer's Canvas):
  - No network calls. All data is already in the spec.
  - No eval or new Function.
  - Data is inserted with textContent only, never innerHTML.
  - No literal colors or fonts. Everything comes from theme/tokens.css.
*/
(function () {
  'use strict';

  var DK = (window.DashKit = window.DashKit || {});
  DK.widgets = DK.widgets || {};

  var currency = 'USD';
  var tokens = null;
  var charts = [];

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function readTokens() {
    var styles = getComputedStyle(document.documentElement);
    function get(name) { return styles.getPropertyValue(name).trim(); }
    var series = [];
    for (var i = 1; i <= 6; i++) series.push(get('--dk-series-' + i));
    return {
      get: get,
      series: series,
      font: get('--dk-font-sans'),
      ink: get('--dk-color-ink'),
      muted: get('--dk-color-ink-muted'),
      subtle: get('--dk-color-ink-subtle'),
      rule: get('--dk-color-rule'),
      ruleSoft: get('--dk-color-rule-soft'),
      surface: get('--dk-color-surface'),
      accent: get('--dk-color-accent'),
      chartHeight: parseInt(get('--dk-chart-height'), 10) || 280
    };
  }

  /* ---------- Formatting: the only place numbers and dates get formatted ---------- */

  function numberFormat(options) { return new Intl.NumberFormat('en-US', options); }

  function parseIsoDate(text) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  }

  /*
    format(value, kind, options)
      kind: text | number | integer | currency | percent | date
      options.compact: abbreviate large numbers ($412.3K) for KPIs and axes
      options.signed:  always show + or - (used for deltas)
    Percent values are fractions: 0.124 renders as 12.4%.
  */
  function format(value, kind, options) {
    options = options || {};
    if (value === null || value === undefined || value === '') return '\u2014';
    if (kind === 'text') return String(value);
    if (kind === 'date') {
      var date = parseIsoDate(String(value));
      return date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : String(value);
    }
    if (typeof value !== 'number' || !isFinite(value)) return String(value);

    var sign = options.signed ? 'exceptZero' : 'auto';
    var abs = Math.abs(value);
    var compact = options.compact && abs >= 10000;

    if (kind === 'percent') {
      return numberFormat({ style: 'percent', maximumFractionDigits: 1, signDisplay: sign }).format(value);
    }
    if (kind === 'currency') {
      if (compact) {
        return numberFormat({ style: 'currency', currency: currency, notation: 'compact', maximumFractionDigits: 1, signDisplay: sign }).format(value);
      }
      var cents = abs < 1000 && !Number.isInteger(value) ? 2 : 0;
      return numberFormat({ style: 'currency', currency: currency, minimumFractionDigits: cents, maximumFractionDigits: cents, signDisplay: sign }).format(value);
    }
    if (compact) {
      return numberFormat({ notation: 'compact', maximumFractionDigits: 1, signDisplay: sign }).format(value);
    }
    if (kind === 'integer') {
      return numberFormat({ maximumFractionDigits: 0, signDisplay: sign }).format(value);
    }
    return numberFormat({ maximumFractionDigits: abs < 10 ? 2 : 1, signDisplay: sign }).format(value);
  }

  function formatTimestamp(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return String(iso);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    });
  }

  /* ---------- Charts ---------- */

  function chart(container, option, height) {
    var box = el('div', 'dk-chart');
    container.appendChild(box);
    if (!window.echarts) {
      box.appendChild(el('p', 'dk-empty', 'This chart needs an internet connection to load. Open the file with internet access, or ask Computer for a PDF version.'));
      return null;
    }
    box.style.height = (height || tokens.chartHeight) + 'px';
    var instance = window.echarts.init(box, null, { renderer: 'svg' });
    option.animation = false;
    instance.setOption(option);
    charts.push(instance);
    return instance;
  }

  function resizeCharts() {
    for (var i = 0; i < charts.length; i++) charts[i].resize();
  }

  /* ---------- Page and widget anatomy ---------- */

  function renderStamp(iso) {
    var stamp = el('div', 'dk-stamp');
    stamp.appendChild(el('p', 'dk-stamp__label', 'Data as of'));
    var line = el('p', 'dk-stamp__time');
    var time = el('time', null, formatTimestamp(iso));
    time.setAttribute('datetime', iso);
    line.appendChild(time);
    stamp.appendChild(line);
    stamp.appendChild(el('p', 'dk-stamp__hint', 'To refresh, ask Computer to rebuild this dashboard.'));
    return stamp;
  }

  function renderWidget(widget, grid) {
    var definition = DK.widgets[widget.type];
    var card = el('section', 'dk-card dk-size-' + (widget.size || 'full'));
    card.setAttribute('data-widget', widget.type);
    card.setAttribute('data-widget-id', widget.id || '');

    var head = el('header', 'dk-card__head');
    var title = el('h2', 'dk-card__title', widget.title);
    title.id = 'dk-title-' + widget.id;
    card.setAttribute('aria-labelledby', title.id);
    head.appendChild(title);
    if (widget.subtitle) head.appendChild(el('p', 'dk-card__subtitle', widget.subtitle));
    card.appendChild(head);

    var body = el('div', 'dk-card__body dk-body--' + widget.type);
    card.appendChild(body);
    grid.appendChild(card);

    var notes = [];
    var context = {
      el: el,
      format: format,
      tokens: tokens,
      chart: chart,
      addNote: function (text) { notes.push(text); }
    };

    try {
      if (!definition) throw new Error('unknown widget type "' + widget.type + '"');
      definition.render(widget, body, context);
    } catch (error) {
      body.textContent = '';
      body.appendChild(el('p', 'dk-error', 'This widget could not be drawn: ' + error.message));
    }

    if (widget.note) notes.push(widget.note);
    if (notes.length) {
      var footer = el('footer', 'dk-card__note');
      notes.forEach(function (text) { footer.appendChild(el('p', null, text)); });
      card.appendChild(footer);
    }
  }

  function renderDashboard(spec, root) {
    currency = spec.currency || 'USD';
    tokens = readTokens();
    document.title = spec.title;

    var page = el('main', 'dk-page');
    var header = el('header', 'dk-header');
    var heading = el('div', 'dk-heading');
    heading.appendChild(el('h1', 'dk-title', spec.title));
    if (spec.subtitle) heading.appendChild(el('p', 'dk-subtitle', spec.subtitle));
    header.appendChild(heading);
    header.appendChild(renderStamp(spec.data_as_of));
    page.appendChild(header);

    var grid = el('div', 'dk-grid');
    page.appendChild(grid);

    var footer = el('footer', 'dk-footer');
    if (spec.sources && spec.sources.length) {
      footer.appendChild(el('p', null, 'Sources: ' + spec.sources.join(', ')));
    }
    footer.appendChild(el('p', null, 'Built with the dashboard toolkit'));
    page.appendChild(footer);

    root.appendChild(page);
    spec.widgets.forEach(function (widget) { renderWidget(widget, grid); });

    window.addEventListener('resize', resizeCharts);
    window.addEventListener('beforeprint', resizeCharts);
    window.addEventListener('afterprint', resizeCharts);
  }

  function whenFontsReady(callback) {
    var done = false;
    function run() { if (!done) { done = true; callback(); } }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run, run);
      setTimeout(run, 1500);
    } else {
      run();
    }
  }

  DK.format = format;

  DK.boot = function () {
    var root = document.getElementById('dk-root');
    var spec;
    try {
      spec = JSON.parse(document.getElementById('dk-spec').textContent);
    } catch (error) {
      root.appendChild(el('p', 'dk-error', 'This dashboard could not be drawn: the spec is not valid JSON.'));
      return;
    }
    whenFontsReady(function () {
      try {
        renderDashboard(spec, root);
      } catch (error) {
        root.appendChild(el('p', 'dk-error', 'This dashboard could not be drawn: ' + error.message));
      }
    });
  };
})();
