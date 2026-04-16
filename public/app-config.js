(function () {
  var hostname = window.location.hostname;
  var isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';
  var liveApiUrl = isLocalHost
    ? 'http://localhost:3333/api'
    : 'https://hrms-backend-r5ed.onrender.com/api';

  window.__HRMS_CONFIG__ = window.__HRMS_CONFIG__ || {
    apiUrl: liveApiUrl,
  };
})();
