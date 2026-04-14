(function () {
  var isLocalFrontend =
    window.location.hostname === 'localhost' &&
    window.location.port === '4200';

  window.__HRMS_CONFIG__ = window.__HRMS_CONFIG__ || {
    apiUrl: isLocalFrontend ? 'http://localhost:3333/api' : '/api',
  };
})();
