'use strict';
// Versions and hosts in one place. Pin exact versions; never use @latest.
const ECHARTS_VERSION = '5.5.1';

module.exports = {
  TOOLKIT_VERSION: '0.1.0',
  ECHARTS_VERSION,
  ECHARTS_URL: `https://cdn.jsdelivr.net/npm/echarts@${ECHARTS_VERSION}/dist/echarts.min.js`,
  // The only external hosts Computer's Canvas sandbox allows.
  ALLOWED_HOSTS: ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'],
  // Grid columns per widget size (12-column grid).
  SIZE_COLUMNS: { S: 3, M: 6, L: 9, full: 12 }
};
