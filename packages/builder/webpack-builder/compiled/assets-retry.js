"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.retry = void 0;
var TAG_TYPE = {
  link: HTMLLinkElement,
  script: HTMLScriptElement,
  img: HTMLImageElement
};
var TYPES = Object.keys(TAG_TYPE);

function findCurrentDomain(url, domainList) {
  var domain = ''; // eslint-disable-next-line @typescript-eslint/prefer-for-of

  for (var i = 0; i < domainList.length; i++) {
    if (url.indexOf(domainList[i]) !== -1) {
      domain = domainList[i];
      break;
    }
  }

  return domain;
}

function findNextDomain(url, domainList) {
  var currentDomain = findCurrentDomain(url, domainList);
  var index = domainList.indexOf(currentDomain);
  return domainList[(index + 1) % domainList.length];
}

function getRequestUrl(element) {
  if (element instanceof HTMLScriptElement || element instanceof HTMLImageElement) {
    return element.src;
  }

  if (element instanceof HTMLLinkElement) {
    return element.href;
  }

  return null;
}

var defaultConfig = {
  max: 3,
  type: TYPES,
  domain: [],
  crossOrigin: false
};

function validateTargetInfo(config, e) {
  var _a;

  var target = e.target;
  var tagName = (_a = target.tagName) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase();
  var allowTags = config.type;
  var url = getRequestUrl(target);

  if (!tagName || allowTags.indexOf(tagName) === -1 || !TAG_TYPE[tagName] || !(target instanceof TAG_TYPE[tagName]) || !url) {
    return false;
  }

  return {
    target: target,
    tagName: tagName,
    url: url
  };
} // eslint-disable-next-line consistent-return


function createElement(origin, attributes) {
  if (origin instanceof HTMLScriptElement) {
    var script = document.createElement('script');
    script.src = attributes.url;

    if (attributes.crossOrigin) {
      script.crossOrigin = 'anonymous';
    }

    if (attributes.times) {
      script.dataset.webpackBuilderRetryTimes = String(attributes.times);
    }

    if (attributes.isAsync) {
      script.dataset.webpackBuilderAsync = '';
    }

    return {
      element: script,
      str: "<script src=\"".concat(attributes.url, "\" type=\"text/javascript\" ").concat(attributes.crossOrigin ? 'crossorigin="anonymous"' : '', " ").concat(attributes.times ? "data-webpack-builder-retry-times=\"".concat(attributes.times, "\"") : '', " ").concat(attributes.isAsync ? 'data-webpack-builder-async' : '', "></script>")
    };
  }

  if (origin instanceof HTMLLinkElement) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = attributes.url;

    if (attributes.times) {
      link.dataset.webpackBuilderRetryTimes = String(attributes.times);
    }

    return {
      element: link,
      str: "<link rel=\"stylesheet\" href=\"".concat(attributes.url, "\" type=\"text/css\" ").concat(attributes.times ? "data-webpack-builder-retry-times=\"".concat(attributes.times, "\"") : '', "></link>")
    };
  }
}

function reloadElementResource(origin, fresh, options) {
  if (origin instanceof HTMLScriptElement) {
    if (options.isAsync) {
      document.body.appendChild(fresh.element);
    } else {
      document.write(fresh.str);
    }
  }

  if (origin instanceof HTMLLinkElement) {
    document.getElementsByTagName('head')[0].appendChild(fresh.element);
  }

  if (origin instanceof HTMLImageElement) {
    origin.src = options.url;
    origin.dataset.webpackBuilderRetryTimes = String(options.times);
  }
}

function retry(config, e) {
  var targetInfo = validateTargetInfo(config, e);

  if (targetInfo === false) {
    return;
  }

  var target = targetInfo.target,
      tagName = targetInfo.tagName,
      url = targetInfo.url; // Filter by config.test and config.domain

  var tester = config.test;

  if (tester) {
    if (typeof tester === 'string') {
      var regexp = new RegExp(tester);

      tester = function tester(str) {
        return regexp.test(str);
      };
    }

    if (typeof tester !== 'function' || !tester(url)) {
      return;
    }
  }

  var domain = findCurrentDomain(url, config.domain);

  if (config.domain && config.domain.length > 0 && config.domain.indexOf(domain) === -1) {
    return;
  } // If the retry times has exceeded the maximum, fail


  var existRetryTimes = Number(target.dataset.webpackBuilderRetryTimes) || 0;

  if (existRetryTimes === config.max) {
    if (typeof config.onFail === 'function') {
      var context = {
        times: existRetryTimes,
        domain: domain,
        url: url,
        tagName: tagName
      };
      config.onFail(context);
    }

    return;
  } // Then, we will start to retry


  var nextDomain = findNextDomain(domain, config.domain) || '';
  var isAsync = Boolean(target.dataset.webpackBuilderAsync) || target.async || target.defer;
  var attributes = {
    url: url.replace(domain, nextDomain),
    times: existRetryTimes + 1,
    crossOrigin: config.crossOrigin && target.crossOrigin,
    isAsync: isAsync
  };
  var element = createElement(target, attributes);

  if (config.onRetry && typeof config.onRetry === 'function') {
    var _context = {
      times: existRetryTimes,
      domain: domain,
      url: url,
      tagName: tagName
    };
    config.onRetry(_context);
  }

  reloadElementResource(target, element, attributes);
}

exports.retry = retry;

function load(config, e) {
  var targetInfo = validateTargetInfo(config, e);

  if (targetInfo === false) {
    return;
  }

  var target = targetInfo.target,
      tagName = targetInfo.tagName,
      url = targetInfo.url;
  var domain = findCurrentDomain(url, config.domain);
  var retryTimes = Number(target.dataset.webpackBuilderRetryTimes) || 0;

  if (retryTimes === 0) {
    return;
  }

  if (typeof config.onSuccess === 'function') {
    var context = {
      times: retryTimes,
      domain: domain,
      url: url,
      tagName: tagName
    };
    config.onSuccess(context);
  }
}

function resourceMonitor(error, success) {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    document.addEventListener('error', function (e) {
      if (e && e.target instanceof Element) {
        error(e);
      }
    }, true);
    document.addEventListener('load', function (e) {
      if (e && e.target instanceof Element) {
        success(e);
      }
    }, true);
  }
} // eslint-disable-next-line @typescript-eslint/no-unused-vars


function init(options) {
  // eslint-disable-next-line prefer-object-spread
  var config = Object.assign({}, defaultConfig, options); // Normalize config

  if (!Array.isArray(config.type) || config.type.length === 0) {
    config.type = defaultConfig.type;
  }

  if (!Array.isArray(config.domain) || config.domain.length === 0) {
    config.domain = defaultConfig.domain;
  } // Bind event in window


  try {
    resourceMonitor(function (e) {
      try {
        retry(config, e);
      } catch (err) {
        console.error('retry error captured', err);
      }
    }, function (e) {
      try {
        load(config, e);
      } catch (err) {
        console.error('load error captured', err);
      }
    });
  } catch (err) {
    console.error('monitor error captured', err);
  }
}