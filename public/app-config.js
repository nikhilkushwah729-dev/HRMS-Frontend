(function () {
  var isLocalFrontend =
    window.location.hostname === 'localhost' &&
    window.location.port === '4200';
  var liveApiUrl = 'https://hrms-backend-6-ragd.onrender.com/api';

  window.__HRMS_CONFIG__ = window.__HRMS_CONFIG__ || {
    apiUrl: isLocalFrontend ? 'http://localhost:3333/api' : liveApiUrl,
  };
})();
