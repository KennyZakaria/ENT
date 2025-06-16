import {
  HTTP_INTERCEPTORS,
  HttpHeaders
} from "./chunk-V3KSII7P.js";
import {
  CommonModule
} from "./chunk-LEROOFGT.js";
import {
  isPlatformBrowser
} from "./chunk-BVXEO7XQ.js";
import {
  Directive,
  EnvironmentInjector,
  Injectable,
  InjectionToken,
  Input,
  NgModule,
  NgZone,
  PLATFORM_ID,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  runInInjectionContext,
  setClassMetadata,
  signal,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵinject
} from "./chunk-PKR53ESH.js";
import {
  fromEvent
} from "./chunk-WPM5VTLQ.js";
import "./chunk-PEBH6BBU.js";
import {
  Subject,
  combineLatest,
  debounceTime,
  from,
  map,
  mergeMap,
  of,
  takeUntil
} from "./chunk-4S3KYZTJ.js";
import {
  __async,
  __spreadProps,
  __spreadValues
} from "./chunk-WDMUDEB6.js";

// node_modules/keycloak-js/lib/keycloak.js
function Keycloak(config) {
  if (!(this instanceof Keycloak)) {
    throw new Error("The 'Keycloak' constructor must be invoked with 'new'.");
  }
  if (typeof config !== "string" && !isObject(config)) {
    throw new Error("The 'Keycloak' constructor must be provided with a configuration object, or a URL to a JSON configuration file.");
  }
  if (isObject(config)) {
    const requiredProperties = "oidcProvider" in config ? ["clientId"] : ["url", "realm", "clientId"];
    for (const property of requiredProperties) {
      if (!config[property]) {
        throw new Error(`The configuration object is missing the required '${property}' property.`);
      }
    }
  }
  var kc = this;
  var adapter;
  var refreshQueue = [];
  var callbackStorage;
  var loginIframe = {
    enable: true,
    callbackList: [],
    interval: 5
  };
  kc.didInitialize = false;
  var useNonce = true;
  var logInfo = createLogger(console.info);
  var logWarn = createLogger(console.warn);
  if (!globalThis.isSecureContext) {
    logWarn("[KEYCLOAK] Keycloak JS must be used in a 'secure context' to function properly as it relies on browser APIs that are otherwise not available.\nContinuing to run your application insecurely will lead to unexpected behavior and breakage.\n\nFor more information see: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts");
  }
  kc.init = function(initOptions = {}) {
    if (kc.didInitialize) {
      throw new Error("A 'Keycloak' instance can only be initialized once.");
    }
    kc.didInitialize = true;
    kc.authenticated = false;
    callbackStorage = createCallbackStorage();
    var adapters = ["default", "cordova", "cordova-native"];
    if (adapters.indexOf(initOptions.adapter) > -1) {
      adapter = loadAdapter(initOptions.adapter);
    } else if (typeof initOptions.adapter === "object") {
      adapter = initOptions.adapter;
    } else {
      if (window.Cordova || window.cordova) {
        adapter = loadAdapter("cordova");
      } else {
        adapter = loadAdapter();
      }
    }
    if (typeof initOptions.useNonce !== "undefined") {
      useNonce = initOptions.useNonce;
    }
    if (typeof initOptions.checkLoginIframe !== "undefined") {
      loginIframe.enable = initOptions.checkLoginIframe;
    }
    if (initOptions.checkLoginIframeInterval) {
      loginIframe.interval = initOptions.checkLoginIframeInterval;
    }
    if (initOptions.onLoad === "login-required") {
      kc.loginRequired = true;
    }
    if (initOptions.responseMode) {
      if (initOptions.responseMode === "query" || initOptions.responseMode === "fragment") {
        kc.responseMode = initOptions.responseMode;
      } else {
        throw "Invalid value for responseMode";
      }
    }
    if (initOptions.flow) {
      switch (initOptions.flow) {
        case "standard":
          kc.responseType = "code";
          break;
        case "implicit":
          kc.responseType = "id_token token";
          break;
        case "hybrid":
          kc.responseType = "code id_token token";
          break;
        default:
          throw "Invalid value for flow";
      }
      kc.flow = initOptions.flow;
    }
    if (initOptions.timeSkew != null) {
      kc.timeSkew = initOptions.timeSkew;
    }
    if (initOptions.redirectUri) {
      kc.redirectUri = initOptions.redirectUri;
    }
    if (initOptions.silentCheckSsoRedirectUri) {
      kc.silentCheckSsoRedirectUri = initOptions.silentCheckSsoRedirectUri;
    }
    if (typeof initOptions.silentCheckSsoFallback === "boolean") {
      kc.silentCheckSsoFallback = initOptions.silentCheckSsoFallback;
    } else {
      kc.silentCheckSsoFallback = true;
    }
    if (typeof initOptions.pkceMethod !== "undefined") {
      if (initOptions.pkceMethod !== "S256" && initOptions.pkceMethod !== false) {
        throw new TypeError(`Invalid value for pkceMethod', expected 'S256' or false but got ${initOptions.pkceMethod}.`);
      }
      kc.pkceMethod = initOptions.pkceMethod;
    } else {
      kc.pkceMethod = "S256";
    }
    if (typeof initOptions.enableLogging === "boolean") {
      kc.enableLogging = initOptions.enableLogging;
    } else {
      kc.enableLogging = false;
    }
    if (initOptions.logoutMethod === "POST") {
      kc.logoutMethod = "POST";
    } else {
      kc.logoutMethod = "GET";
    }
    if (typeof initOptions.scope === "string") {
      kc.scope = initOptions.scope;
    }
    if (typeof initOptions.acrValues === "string") {
      kc.acrValues = initOptions.acrValues;
    }
    if (typeof initOptions.messageReceiveTimeout === "number" && initOptions.messageReceiveTimeout > 0) {
      kc.messageReceiveTimeout = initOptions.messageReceiveTimeout;
    } else {
      kc.messageReceiveTimeout = 1e4;
    }
    if (!kc.responseMode) {
      kc.responseMode = "fragment";
    }
    if (!kc.responseType) {
      kc.responseType = "code";
      kc.flow = "standard";
    }
    var promise = createPromise();
    var initPromise = createPromise();
    initPromise.promise.then(function() {
      kc.onReady && kc.onReady(kc.authenticated);
      promise.setSuccess(kc.authenticated);
    }).catch(function(error) {
      promise.setError(error);
    });
    var configPromise = loadConfig();
    function onLoad() {
      var doLogin = function(prompt) {
        if (!prompt) {
          options.prompt = "none";
        }
        if (initOptions.locale) {
          options.locale = initOptions.locale;
        }
        kc.login(options).then(function() {
          initPromise.setSuccess();
        }).catch(function(error) {
          initPromise.setError(error);
        });
      };
      var checkSsoSilently = function() {
        return __async(this, null, function* () {
          var ifrm = document.createElement("iframe");
          var src = yield kc.createLoginUrl({
            prompt: "none",
            redirectUri: kc.silentCheckSsoRedirectUri
          });
          ifrm.setAttribute("src", src);
          ifrm.setAttribute("sandbox", "allow-storage-access-by-user-activation allow-scripts allow-same-origin");
          ifrm.setAttribute("title", "keycloak-silent-check-sso");
          ifrm.style.display = "none";
          document.body.appendChild(ifrm);
          var messageCallback = function(event) {
            if (event.origin !== window.location.origin || ifrm.contentWindow !== event.source) {
              return;
            }
            var oauth = parseCallback(event.data);
            processCallback(oauth, initPromise);
            document.body.removeChild(ifrm);
            window.removeEventListener("message", messageCallback);
          };
          window.addEventListener("message", messageCallback);
        });
      };
      var options = {};
      switch (initOptions.onLoad) {
        case "check-sso":
          if (loginIframe.enable) {
            setupCheckLoginIframe().then(function() {
              checkLoginIframe().then(function(unchanged) {
                if (!unchanged) {
                  kc.silentCheckSsoRedirectUri ? checkSsoSilently() : doLogin(false);
                } else {
                  initPromise.setSuccess();
                }
              }).catch(function(error) {
                initPromise.setError(error);
              });
            });
          } else {
            kc.silentCheckSsoRedirectUri ? checkSsoSilently() : doLogin(false);
          }
          break;
        case "login-required":
          doLogin(true);
          break;
        default:
          throw "Invalid value for onLoad";
      }
    }
    function processInit() {
      var callback = parseCallback(window.location.href);
      if (callback) {
        window.history.replaceState(window.history.state, null, callback.newUrl);
      }
      if (callback && callback.valid) {
        return setupCheckLoginIframe().then(function() {
          processCallback(callback, initPromise);
        }).catch(function(error) {
          initPromise.setError(error);
        });
      }
      if (initOptions.token && initOptions.refreshToken) {
        setToken(initOptions.token, initOptions.refreshToken, initOptions.idToken);
        if (loginIframe.enable) {
          setupCheckLoginIframe().then(function() {
            checkLoginIframe().then(function(unchanged) {
              if (unchanged) {
                kc.onAuthSuccess && kc.onAuthSuccess();
                initPromise.setSuccess();
                scheduleCheckIframe();
              } else {
                initPromise.setSuccess();
              }
            }).catch(function(error) {
              initPromise.setError(error);
            });
          });
        } else {
          kc.updateToken(-1).then(function() {
            kc.onAuthSuccess && kc.onAuthSuccess();
            initPromise.setSuccess();
          }).catch(function(error) {
            kc.onAuthError && kc.onAuthError();
            if (initOptions.onLoad) {
              onLoad();
            } else {
              initPromise.setError(error);
            }
          });
        }
      } else if (initOptions.onLoad) {
        onLoad();
      } else {
        initPromise.setSuccess();
      }
    }
    configPromise.then(function() {
      check3pCookiesSupported().then(processInit).catch(function(error) {
        promise.setError(error);
      });
    });
    configPromise.catch(function(error) {
      promise.setError(error);
    });
    return promise.promise;
  };
  kc.login = function(options) {
    return adapter.login(options);
  };
  function generateRandomData(len) {
    if (typeof crypto === "undefined" || typeof crypto.getRandomValues === "undefined") {
      throw new Error("Web Crypto API is not available.");
    }
    return crypto.getRandomValues(new Uint8Array(len));
  }
  function generateCodeVerifier(len) {
    return generateRandomString(len, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789");
  }
  function generateRandomString(len, alphabet) {
    var randomData = generateRandomData(len);
    var chars = new Array(len);
    for (var i = 0; i < len; i++) {
      chars[i] = alphabet.charCodeAt(randomData[i] % alphabet.length);
    }
    return String.fromCharCode.apply(null, chars);
  }
  function generatePkceChallenge(pkceMethod, codeVerifier) {
    return __async(this, null, function* () {
      if (pkceMethod !== "S256") {
        throw new TypeError(`Invalid value for 'pkceMethod', expected 'S256' but got '${pkceMethod}'.`);
      }
      const hashBytes = new Uint8Array(yield sha256Digest(codeVerifier));
      const encodedHash = bytesToBase64(hashBytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/\=/g, "");
      return encodedHash;
    });
  }
  function buildClaimsParameter(requestedAcr) {
    var claims = {
      id_token: {
        acr: requestedAcr
      }
    };
    return JSON.stringify(claims);
  }
  kc.createLoginUrl = function(options) {
    return __async(this, null, function* () {
      var state = createUUID();
      var nonce = createUUID();
      var redirectUri = adapter.redirectUri(options);
      var callbackState = {
        state,
        nonce,
        redirectUri: encodeURIComponent(redirectUri),
        loginOptions: options
      };
      if (options && options.prompt) {
        callbackState.prompt = options.prompt;
      }
      var baseUrl;
      if (options && options.action == "register") {
        baseUrl = kc.endpoints.register();
      } else {
        baseUrl = kc.endpoints.authorize();
      }
      var scope = options && options.scope || kc.scope;
      if (!scope) {
        scope = "openid";
      } else if (scope.indexOf("openid") === -1) {
        scope = "openid " + scope;
      }
      var url = baseUrl + "?client_id=" + encodeURIComponent(kc.clientId) + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&state=" + encodeURIComponent(state) + "&response_mode=" + encodeURIComponent(kc.responseMode) + "&response_type=" + encodeURIComponent(kc.responseType) + "&scope=" + encodeURIComponent(scope);
      if (useNonce) {
        url = url + "&nonce=" + encodeURIComponent(nonce);
      }
      if (options && options.prompt) {
        url += "&prompt=" + encodeURIComponent(options.prompt);
      }
      if (options && typeof options.maxAge === "number") {
        url += "&max_age=" + encodeURIComponent(options.maxAge);
      }
      if (options && options.loginHint) {
        url += "&login_hint=" + encodeURIComponent(options.loginHint);
      }
      if (options && options.idpHint) {
        url += "&kc_idp_hint=" + encodeURIComponent(options.idpHint);
      }
      if (options && options.action && options.action != "register") {
        url += "&kc_action=" + encodeURIComponent(options.action);
      }
      if (options && options.locale) {
        url += "&ui_locales=" + encodeURIComponent(options.locale);
      }
      if (options && options.acr) {
        var claimsParameter = buildClaimsParameter(options.acr);
        url += "&claims=" + encodeURIComponent(claimsParameter);
      }
      if (options && options.acrValues || kc.acrValues) {
        url += "&acr_values=" + encodeURIComponent(options.acrValues || kc.acrValues);
      }
      if (kc.pkceMethod) {
        try {
          const codeVerifier = generateCodeVerifier(96);
          const pkceChallenge = yield generatePkceChallenge(kc.pkceMethod, codeVerifier);
          callbackState.pkceCodeVerifier = codeVerifier;
          url += "&code_challenge=" + pkceChallenge;
          url += "&code_challenge_method=" + kc.pkceMethod;
        } catch (error) {
          throw new Error("Failed to generate PKCE challenge.", {
            cause: error
          });
        }
      }
      callbackStorage.add(callbackState);
      return url;
    });
  };
  kc.logout = function(options) {
    return adapter.logout(options);
  };
  kc.createLogoutUrl = function(options) {
    const logoutMethod = options?.logoutMethod ?? kc.logoutMethod;
    if (logoutMethod === "POST") {
      return kc.endpoints.logout();
    }
    var url = kc.endpoints.logout() + "?client_id=" + encodeURIComponent(kc.clientId) + "&post_logout_redirect_uri=" + encodeURIComponent(adapter.redirectUri(options, false));
    if (kc.idToken) {
      url += "&id_token_hint=" + encodeURIComponent(kc.idToken);
    }
    return url;
  };
  kc.register = function(options) {
    return adapter.register(options);
  };
  kc.createRegisterUrl = function(options) {
    return __async(this, null, function* () {
      if (!options) {
        options = {};
      }
      options.action = "register";
      return yield kc.createLoginUrl(options);
    });
  };
  kc.createAccountUrl = function(options) {
    var realm = getRealmUrl();
    var url = void 0;
    if (typeof realm !== "undefined") {
      url = realm + "/account?referrer=" + encodeURIComponent(kc.clientId) + "&referrer_uri=" + encodeURIComponent(adapter.redirectUri(options));
    }
    return url;
  };
  kc.accountManagement = function() {
    return adapter.accountManagement();
  };
  kc.hasRealmRole = function(role) {
    var access = kc.realmAccess;
    return !!access && access.roles.indexOf(role) >= 0;
  };
  kc.hasResourceRole = function(role, resource) {
    if (!kc.resourceAccess) {
      return false;
    }
    var access = kc.resourceAccess[resource || kc.clientId];
    return !!access && access.roles.indexOf(role) >= 0;
  };
  kc.loadUserProfile = function() {
    var url = getRealmUrl() + "/account";
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Authorization", "bearer " + kc.token);
    var promise = createPromise();
    req.onreadystatechange = function() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          kc.profile = JSON.parse(req.responseText);
          promise.setSuccess(kc.profile);
        } else {
          promise.setError();
        }
      }
    };
    req.send();
    return promise.promise;
  };
  kc.loadUserInfo = function() {
    var url = kc.endpoints.userinfo();
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Authorization", "bearer " + kc.token);
    var promise = createPromise();
    req.onreadystatechange = function() {
      if (req.readyState == 4) {
        if (req.status == 200) {
          kc.userInfo = JSON.parse(req.responseText);
          promise.setSuccess(kc.userInfo);
        } else {
          promise.setError();
        }
      }
    };
    req.send();
    return promise.promise;
  };
  kc.isTokenExpired = function(minValidity) {
    if (!kc.tokenParsed || !kc.refreshToken && kc.flow != "implicit") {
      throw "Not authenticated";
    }
    if (kc.timeSkew == null) {
      logInfo("[KEYCLOAK] Unable to determine if token is expired as timeskew is not set");
      return true;
    }
    var expiresIn = kc.tokenParsed["exp"] - Math.ceil((/* @__PURE__ */ new Date()).getTime() / 1e3) + kc.timeSkew;
    if (minValidity) {
      if (isNaN(minValidity)) {
        throw "Invalid minValidity";
      }
      expiresIn -= minValidity;
    }
    return expiresIn < 0;
  };
  kc.updateToken = function(minValidity) {
    var promise = createPromise();
    if (!kc.refreshToken) {
      promise.setError();
      return promise.promise;
    }
    minValidity = minValidity || 5;
    var exec = function() {
      var refreshToken = false;
      if (minValidity == -1) {
        refreshToken = true;
        logInfo("[KEYCLOAK] Refreshing token: forced refresh");
      } else if (!kc.tokenParsed || kc.isTokenExpired(minValidity)) {
        refreshToken = true;
        logInfo("[KEYCLOAK] Refreshing token: token expired");
      }
      if (!refreshToken) {
        promise.setSuccess(false);
      } else {
        var params = "grant_type=refresh_token&refresh_token=" + kc.refreshToken;
        var url = kc.endpoints.token();
        refreshQueue.push(promise);
        if (refreshQueue.length == 1) {
          var req = new XMLHttpRequest();
          req.open("POST", url, true);
          req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
          req.withCredentials = true;
          params += "&client_id=" + encodeURIComponent(kc.clientId);
          var timeLocal = (/* @__PURE__ */ new Date()).getTime();
          req.onreadystatechange = function() {
            if (req.readyState == 4) {
              if (req.status == 200) {
                logInfo("[KEYCLOAK] Token refreshed");
                timeLocal = (timeLocal + (/* @__PURE__ */ new Date()).getTime()) / 2;
                var tokenResponse = JSON.parse(req.responseText);
                setToken(tokenResponse["access_token"], tokenResponse["refresh_token"], tokenResponse["id_token"], timeLocal);
                kc.onAuthRefreshSuccess && kc.onAuthRefreshSuccess();
                for (var p = refreshQueue.pop(); p != null; p = refreshQueue.pop()) {
                  p.setSuccess(true);
                }
              } else {
                logWarn("[KEYCLOAK] Failed to refresh token");
                if (req.status == 400) {
                  kc.clearToken();
                }
                kc.onAuthRefreshError && kc.onAuthRefreshError();
                for (var p = refreshQueue.pop(); p != null; p = refreshQueue.pop()) {
                  p.setError("Failed to refresh token: An unexpected HTTP error occurred while attempting to refresh the token.");
                }
              }
            }
          };
          req.send(params);
        }
      }
    };
    if (loginIframe.enable) {
      var iframePromise = checkLoginIframe();
      iframePromise.then(function() {
        exec();
      }).catch(function(error) {
        promise.setError(error);
      });
    } else {
      exec();
    }
    return promise.promise;
  };
  kc.clearToken = function() {
    if (kc.token) {
      setToken(null, null, null);
      kc.onAuthLogout && kc.onAuthLogout();
      if (kc.loginRequired) {
        kc.login();
      }
    }
  };
  function getRealmUrl() {
    if (typeof kc.authServerUrl !== "undefined") {
      if (kc.authServerUrl.charAt(kc.authServerUrl.length - 1) == "/") {
        return kc.authServerUrl + "realms/" + encodeURIComponent(kc.realm);
      } else {
        return kc.authServerUrl + "/realms/" + encodeURIComponent(kc.realm);
      }
    } else {
      return void 0;
    }
  }
  function getOrigin() {
    if (!window.location.origin) {
      return window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "");
    } else {
      return window.location.origin;
    }
  }
  function processCallback(oauth, promise) {
    var code = oauth.code;
    var error = oauth.error;
    var prompt = oauth.prompt;
    var timeLocal = (/* @__PURE__ */ new Date()).getTime();
    if (oauth["kc_action_status"]) {
      kc.onActionUpdate && kc.onActionUpdate(oauth["kc_action_status"], oauth["kc_action"]);
    }
    if (error) {
      if (prompt != "none") {
        if (oauth.error_description && oauth.error_description === "authentication_expired") {
          kc.login(oauth.loginOptions);
        } else {
          var errorData = {
            error,
            error_description: oauth.error_description
          };
          kc.onAuthError && kc.onAuthError(errorData);
          promise && promise.setError(errorData);
        }
      } else {
        promise && promise.setSuccess();
      }
      return;
    } else if (kc.flow != "standard" && (oauth.access_token || oauth.id_token)) {
      authSuccess(oauth.access_token, null, oauth.id_token, true);
    }
    if (kc.flow != "implicit" && code) {
      var params = "code=" + code + "&grant_type=authorization_code";
      var url = kc.endpoints.token();
      var req = new XMLHttpRequest();
      req.open("POST", url, true);
      req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      params += "&client_id=" + encodeURIComponent(kc.clientId);
      params += "&redirect_uri=" + oauth.redirectUri;
      if (oauth.pkceCodeVerifier) {
        params += "&code_verifier=" + oauth.pkceCodeVerifier;
      }
      req.withCredentials = true;
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          if (req.status == 200) {
            var tokenResponse = JSON.parse(req.responseText);
            authSuccess(tokenResponse["access_token"], tokenResponse["refresh_token"], tokenResponse["id_token"], kc.flow === "standard");
            scheduleCheckIframe();
          } else {
            kc.onAuthError && kc.onAuthError();
            promise && promise.setError();
          }
        }
      };
      req.send(params);
    }
    function authSuccess(accessToken, refreshToken, idToken, fulfillPromise) {
      timeLocal = (timeLocal + (/* @__PURE__ */ new Date()).getTime()) / 2;
      setToken(accessToken, refreshToken, idToken, timeLocal);
      if (useNonce && kc.idTokenParsed && kc.idTokenParsed.nonce != oauth.storedNonce) {
        logInfo("[KEYCLOAK] Invalid nonce, clearing token");
        kc.clearToken();
        promise && promise.setError();
      } else {
        if (fulfillPromise) {
          kc.onAuthSuccess && kc.onAuthSuccess();
          promise && promise.setSuccess();
        }
      }
    }
  }
  function loadConfig() {
    var promise = createPromise();
    var configUrl;
    if (typeof config === "string") {
      configUrl = config;
    }
    function setupOidcEndoints(oidcConfiguration) {
      if (!oidcConfiguration) {
        kc.endpoints = {
          authorize: function() {
            return getRealmUrl() + "/protocol/openid-connect/auth";
          },
          token: function() {
            return getRealmUrl() + "/protocol/openid-connect/token";
          },
          logout: function() {
            return getRealmUrl() + "/protocol/openid-connect/logout";
          },
          checkSessionIframe: function() {
            return getRealmUrl() + "/protocol/openid-connect/login-status-iframe.html";
          },
          thirdPartyCookiesIframe: function() {
            return getRealmUrl() + "/protocol/openid-connect/3p-cookies/step1.html";
          },
          register: function() {
            return getRealmUrl() + "/protocol/openid-connect/registrations";
          },
          userinfo: function() {
            return getRealmUrl() + "/protocol/openid-connect/userinfo";
          }
        };
      } else {
        kc.endpoints = {
          authorize: function() {
            return oidcConfiguration.authorization_endpoint;
          },
          token: function() {
            return oidcConfiguration.token_endpoint;
          },
          logout: function() {
            if (!oidcConfiguration.end_session_endpoint) {
              throw "Not supported by the OIDC server";
            }
            return oidcConfiguration.end_session_endpoint;
          },
          checkSessionIframe: function() {
            if (!oidcConfiguration.check_session_iframe) {
              throw "Not supported by the OIDC server";
            }
            return oidcConfiguration.check_session_iframe;
          },
          register: function() {
            throw 'Redirection to "Register user" page not supported in standard OIDC mode';
          },
          userinfo: function() {
            if (!oidcConfiguration.userinfo_endpoint) {
              throw "Not supported by the OIDC server";
            }
            return oidcConfiguration.userinfo_endpoint;
          }
        };
      }
    }
    if (configUrl) {
      var req = new XMLHttpRequest();
      req.open("GET", configUrl, true);
      req.setRequestHeader("Accept", "application/json");
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          if (req.status == 200 || fileLoaded(req)) {
            var config2 = JSON.parse(req.responseText);
            kc.authServerUrl = config2["auth-server-url"];
            kc.realm = config2["realm"];
            kc.clientId = config2["resource"];
            setupOidcEndoints(null);
            promise.setSuccess();
          } else {
            promise.setError();
          }
        }
      };
      req.send();
    } else {
      kc.clientId = config.clientId;
      var oidcProvider = config["oidcProvider"];
      if (!oidcProvider) {
        kc.authServerUrl = config.url;
        kc.realm = config.realm;
        setupOidcEndoints(null);
        promise.setSuccess();
      } else {
        if (typeof oidcProvider === "string") {
          var oidcProviderConfigUrl;
          if (oidcProvider.charAt(oidcProvider.length - 1) == "/") {
            oidcProviderConfigUrl = oidcProvider + ".well-known/openid-configuration";
          } else {
            oidcProviderConfigUrl = oidcProvider + "/.well-known/openid-configuration";
          }
          var req = new XMLHttpRequest();
          req.open("GET", oidcProviderConfigUrl, true);
          req.setRequestHeader("Accept", "application/json");
          req.onreadystatechange = function() {
            if (req.readyState == 4) {
              if (req.status == 200 || fileLoaded(req)) {
                var oidcProviderConfig = JSON.parse(req.responseText);
                setupOidcEndoints(oidcProviderConfig);
                promise.setSuccess();
              } else {
                promise.setError();
              }
            }
          };
          req.send();
        } else {
          setupOidcEndoints(oidcProvider);
          promise.setSuccess();
        }
      }
    }
    return promise.promise;
  }
  function fileLoaded(xhr) {
    return xhr.status == 0 && xhr.responseText && xhr.responseURL.startsWith("file:");
  }
  function setToken(token, refreshToken, idToken, timeLocal) {
    if (kc.tokenTimeoutHandle) {
      clearTimeout(kc.tokenTimeoutHandle);
      kc.tokenTimeoutHandle = null;
    }
    if (refreshToken) {
      kc.refreshToken = refreshToken;
      kc.refreshTokenParsed = decodeToken(refreshToken);
    } else {
      delete kc.refreshToken;
      delete kc.refreshTokenParsed;
    }
    if (idToken) {
      kc.idToken = idToken;
      kc.idTokenParsed = decodeToken(idToken);
    } else {
      delete kc.idToken;
      delete kc.idTokenParsed;
    }
    if (token) {
      kc.token = token;
      kc.tokenParsed = decodeToken(token);
      kc.sessionId = kc.tokenParsed.sid;
      kc.authenticated = true;
      kc.subject = kc.tokenParsed.sub;
      kc.realmAccess = kc.tokenParsed.realm_access;
      kc.resourceAccess = kc.tokenParsed.resource_access;
      if (timeLocal) {
        kc.timeSkew = Math.floor(timeLocal / 1e3) - kc.tokenParsed.iat;
      }
      if (kc.timeSkew != null) {
        logInfo("[KEYCLOAK] Estimated time difference between browser and server is " + kc.timeSkew + " seconds");
        if (kc.onTokenExpired) {
          var expiresIn = (kc.tokenParsed["exp"] - (/* @__PURE__ */ new Date()).getTime() / 1e3 + kc.timeSkew) * 1e3;
          logInfo("[KEYCLOAK] Token expires in " + Math.round(expiresIn / 1e3) + " s");
          if (expiresIn <= 0) {
            kc.onTokenExpired();
          } else {
            kc.tokenTimeoutHandle = setTimeout(kc.onTokenExpired, expiresIn);
          }
        }
      }
    } else {
      delete kc.token;
      delete kc.tokenParsed;
      delete kc.subject;
      delete kc.realmAccess;
      delete kc.resourceAccess;
      kc.authenticated = false;
    }
  }
  function createUUID() {
    if (typeof crypto === "undefined" || typeof crypto.randomUUID === "undefined") {
      throw new Error("Web Crypto API is not available.");
    }
    return crypto.randomUUID();
  }
  function parseCallback(url) {
    var oauth = parseCallbackUrl(url);
    if (!oauth) {
      return;
    }
    var oauthState = callbackStorage.get(oauth.state);
    if (oauthState) {
      oauth.valid = true;
      oauth.redirectUri = oauthState.redirectUri;
      oauth.storedNonce = oauthState.nonce;
      oauth.prompt = oauthState.prompt;
      oauth.pkceCodeVerifier = oauthState.pkceCodeVerifier;
      oauth.loginOptions = oauthState.loginOptions;
    }
    return oauth;
  }
  function parseCallbackUrl(url) {
    var supportedParams;
    switch (kc.flow) {
      case "standard":
        supportedParams = ["code", "state", "session_state", "kc_action_status", "kc_action", "iss"];
        break;
      case "implicit":
        supportedParams = ["access_token", "token_type", "id_token", "state", "session_state", "expires_in", "kc_action_status", "kc_action", "iss"];
        break;
      case "hybrid":
        supportedParams = ["access_token", "token_type", "id_token", "code", "state", "session_state", "expires_in", "kc_action_status", "kc_action", "iss"];
        break;
    }
    supportedParams.push("error");
    supportedParams.push("error_description");
    supportedParams.push("error_uri");
    var queryIndex = url.indexOf("?");
    var fragmentIndex = url.indexOf("#");
    var newUrl;
    var parsed;
    if (kc.responseMode === "query" && queryIndex !== -1) {
      newUrl = url.substring(0, queryIndex);
      parsed = parseCallbackParams(url.substring(queryIndex + 1, fragmentIndex !== -1 ? fragmentIndex : url.length), supportedParams);
      if (parsed.paramsString !== "") {
        newUrl += "?" + parsed.paramsString;
      }
      if (fragmentIndex !== -1) {
        newUrl += url.substring(fragmentIndex);
      }
    } else if (kc.responseMode === "fragment" && fragmentIndex !== -1) {
      newUrl = url.substring(0, fragmentIndex);
      parsed = parseCallbackParams(url.substring(fragmentIndex + 1), supportedParams);
      if (parsed.paramsString !== "") {
        newUrl += "#" + parsed.paramsString;
      }
    }
    if (parsed && parsed.oauthParams) {
      if (kc.flow === "standard" || kc.flow === "hybrid") {
        if ((parsed.oauthParams.code || parsed.oauthParams.error) && parsed.oauthParams.state) {
          parsed.oauthParams.newUrl = newUrl;
          return parsed.oauthParams;
        }
      } else if (kc.flow === "implicit") {
        if ((parsed.oauthParams.access_token || parsed.oauthParams.error) && parsed.oauthParams.state) {
          parsed.oauthParams.newUrl = newUrl;
          return parsed.oauthParams;
        }
      }
    }
  }
  function parseCallbackParams(paramsString, supportedParams) {
    var p = paramsString.split("&");
    var result = {
      paramsString: "",
      oauthParams: {}
    };
    for (var i = 0; i < p.length; i++) {
      var split = p[i].indexOf("=");
      var key = p[i].slice(0, split);
      if (supportedParams.indexOf(key) !== -1) {
        result.oauthParams[key] = p[i].slice(split + 1);
      } else {
        if (result.paramsString !== "") {
          result.paramsString += "&";
        }
        result.paramsString += p[i];
      }
    }
    return result;
  }
  function createPromise() {
    var p = {
      setSuccess: function(result) {
        p.resolve(result);
      },
      setError: function(result) {
        p.reject(result);
      }
    };
    p.promise = new Promise(function(resolve, reject) {
      p.resolve = resolve;
      p.reject = reject;
    });
    return p;
  }
  function applyTimeoutToPromise(promise, timeout, errorMessage) {
    var timeoutHandle = null;
    var timeoutPromise = new Promise(function(resolve, reject) {
      timeoutHandle = setTimeout(function() {
        reject({
          "error": errorMessage || "Promise is not settled within timeout of " + timeout + "ms"
        });
      }, timeout);
    });
    return Promise.race([promise, timeoutPromise]).finally(function() {
      clearTimeout(timeoutHandle);
    });
  }
  function setupCheckLoginIframe() {
    var promise = createPromise();
    if (!loginIframe.enable) {
      promise.setSuccess();
      return promise.promise;
    }
    if (loginIframe.iframe) {
      promise.setSuccess();
      return promise.promise;
    }
    var iframe = document.createElement("iframe");
    loginIframe.iframe = iframe;
    iframe.onload = function() {
      var authUrl = kc.endpoints.authorize();
      if (authUrl.charAt(0) === "/") {
        loginIframe.iframeOrigin = getOrigin();
      } else {
        loginIframe.iframeOrigin = authUrl.substring(0, authUrl.indexOf("/", 8));
      }
      promise.setSuccess();
    };
    var src = kc.endpoints.checkSessionIframe();
    iframe.setAttribute("src", src);
    iframe.setAttribute("sandbox", "allow-storage-access-by-user-activation allow-scripts allow-same-origin");
    iframe.setAttribute("title", "keycloak-session-iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    var messageCallback = function(event) {
      if (event.origin !== loginIframe.iframeOrigin || loginIframe.iframe.contentWindow !== event.source) {
        return;
      }
      if (!(event.data == "unchanged" || event.data == "changed" || event.data == "error")) {
        return;
      }
      if (event.data != "unchanged") {
        kc.clearToken();
      }
      var callbacks = loginIframe.callbackList.splice(0, loginIframe.callbackList.length);
      for (var i = callbacks.length - 1; i >= 0; --i) {
        var promise2 = callbacks[i];
        if (event.data == "error") {
          promise2.setError();
        } else {
          promise2.setSuccess(event.data == "unchanged");
        }
      }
    };
    window.addEventListener("message", messageCallback, false);
    return promise.promise;
  }
  function scheduleCheckIframe() {
    if (loginIframe.enable) {
      if (kc.token) {
        setTimeout(function() {
          checkLoginIframe().then(function(unchanged) {
            if (unchanged) {
              scheduleCheckIframe();
            }
          });
        }, loginIframe.interval * 1e3);
      }
    }
  }
  function checkLoginIframe() {
    var promise = createPromise();
    if (loginIframe.iframe && loginIframe.iframeOrigin) {
      var msg = kc.clientId + " " + (kc.sessionId ? kc.sessionId : "");
      loginIframe.callbackList.push(promise);
      var origin = loginIframe.iframeOrigin;
      if (loginIframe.callbackList.length == 1) {
        loginIframe.iframe.contentWindow.postMessage(msg, origin);
      }
    } else {
      promise.setSuccess();
    }
    return promise.promise;
  }
  function check3pCookiesSupported() {
    var promise = createPromise();
    if ((loginIframe.enable || kc.silentCheckSsoRedirectUri) && typeof kc.endpoints.thirdPartyCookiesIframe === "function") {
      var iframe = document.createElement("iframe");
      iframe.setAttribute("src", kc.endpoints.thirdPartyCookiesIframe());
      iframe.setAttribute("sandbox", "allow-storage-access-by-user-activation allow-scripts allow-same-origin");
      iframe.setAttribute("title", "keycloak-3p-check-iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      var messageCallback = function(event) {
        if (iframe.contentWindow !== event.source) {
          return;
        }
        if (event.data !== "supported" && event.data !== "unsupported") {
          return;
        } else if (event.data === "unsupported") {
          logWarn("[KEYCLOAK] Your browser is blocking access to 3rd-party cookies, this means:\n\n - It is not possible to retrieve tokens without redirecting to the Keycloak server (a.k.a. no support for silent authentication).\n - It is not possible to automatically detect changes to the session status (such as the user logging out in another tab).\n\nFor more information see: https://www.keycloak.org/securing-apps/javascript-adapter#_modern_browsers");
          loginIframe.enable = false;
          if (kc.silentCheckSsoFallback) {
            kc.silentCheckSsoRedirectUri = false;
          }
        }
        document.body.removeChild(iframe);
        window.removeEventListener("message", messageCallback);
        promise.setSuccess();
      };
      window.addEventListener("message", messageCallback, false);
    } else {
      promise.setSuccess();
    }
    return applyTimeoutToPromise(promise.promise, kc.messageReceiveTimeout, "Timeout when waiting for 3rd party check iframe message.");
  }
  function loadAdapter(type) {
    if (!type || type == "default") {
      return {
        login: function(options) {
          return __async(this, null, function* () {
            window.location.assign(yield kc.createLoginUrl(options));
            return createPromise().promise;
          });
        },
        logout: function(options) {
          return __async(this, null, function* () {
            const logoutMethod = options?.logoutMethod ?? kc.logoutMethod;
            if (logoutMethod === "GET") {
              window.location.replace(kc.createLogoutUrl(options));
              return;
            }
            const form = document.createElement("form");
            form.setAttribute("method", "POST");
            form.setAttribute("action", kc.createLogoutUrl(options));
            form.style.display = "none";
            const data = {
              id_token_hint: kc.idToken,
              client_id: kc.clientId,
              post_logout_redirect_uri: adapter.redirectUri(options, false)
            };
            for (const [name, value] of Object.entries(data)) {
              const input = document.createElement("input");
              input.setAttribute("type", "hidden");
              input.setAttribute("name", name);
              input.setAttribute("value", value);
              form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
          });
        },
        register: function(options) {
          return __async(this, null, function* () {
            window.location.assign(yield kc.createRegisterUrl(options));
            return createPromise().promise;
          });
        },
        accountManagement: function() {
          var accountUrl = kc.createAccountUrl();
          if (typeof accountUrl !== "undefined") {
            window.location.href = accountUrl;
          } else {
            throw "Not supported by the OIDC server";
          }
          return createPromise().promise;
        },
        redirectUri: function(options, encodeHash) {
          if (arguments.length == 1) {
            encodeHash = true;
          }
          if (options && options.redirectUri) {
            return options.redirectUri;
          } else if (kc.redirectUri) {
            return kc.redirectUri;
          } else {
            return location.href;
          }
        }
      };
    }
    if (type == "cordova") {
      loginIframe.enable = false;
      var cordovaOpenWindowWrapper = function(loginUrl, target, options) {
        if (window.cordova && window.cordova.InAppBrowser) {
          return window.cordova.InAppBrowser.open(loginUrl, target, options);
        } else {
          return window.open(loginUrl, target, options);
        }
      };
      var shallowCloneCordovaOptions = function(userOptions) {
        if (userOptions && userOptions.cordovaOptions) {
          return Object.keys(userOptions.cordovaOptions).reduce(function(options, optionName) {
            options[optionName] = userOptions.cordovaOptions[optionName];
            return options;
          }, {});
        } else {
          return {};
        }
      };
      var formatCordovaOptions = function(cordovaOptions) {
        return Object.keys(cordovaOptions).reduce(function(options, optionName) {
          options.push(optionName + "=" + cordovaOptions[optionName]);
          return options;
        }, []).join(",");
      };
      var createCordovaOptions = function(userOptions) {
        var cordovaOptions = shallowCloneCordovaOptions(userOptions);
        cordovaOptions.location = "no";
        if (userOptions && userOptions.prompt == "none") {
          cordovaOptions.hidden = "yes";
        }
        return formatCordovaOptions(cordovaOptions);
      };
      var getCordovaRedirectUri = function() {
        return kc.redirectUri || "http://localhost";
      };
      return {
        login: function(options) {
          return __async(this, null, function* () {
            var promise = createPromise();
            var cordovaOptions = createCordovaOptions(options);
            var loginUrl = yield kc.createLoginUrl(options);
            var ref = cordovaOpenWindowWrapper(loginUrl, "_blank", cordovaOptions);
            var completed = false;
            var closed = false;
            var closeBrowser = function() {
              closed = true;
              ref.close();
            };
            ref.addEventListener("loadstart", function(event) {
              if (event.url.indexOf(getCordovaRedirectUri()) == 0) {
                var callback = parseCallback(event.url);
                processCallback(callback, promise);
                closeBrowser();
                completed = true;
              }
            });
            ref.addEventListener("loaderror", function(event) {
              if (!completed) {
                if (event.url.indexOf(getCordovaRedirectUri()) == 0) {
                  var callback = parseCallback(event.url);
                  processCallback(callback, promise);
                  closeBrowser();
                  completed = true;
                } else {
                  promise.setError();
                  closeBrowser();
                }
              }
            });
            ref.addEventListener("exit", function(event) {
              if (!closed) {
                promise.setError({
                  reason: "closed_by_user"
                });
              }
            });
            return promise.promise;
          });
        },
        logout: function(options) {
          var promise = createPromise();
          var logoutUrl = kc.createLogoutUrl(options);
          var ref = cordovaOpenWindowWrapper(logoutUrl, "_blank", "location=no,hidden=yes,clearcache=yes");
          var error;
          ref.addEventListener("loadstart", function(event) {
            if (event.url.indexOf(getCordovaRedirectUri()) == 0) {
              ref.close();
            }
          });
          ref.addEventListener("loaderror", function(event) {
            if (event.url.indexOf(getCordovaRedirectUri()) == 0) {
              ref.close();
            } else {
              error = true;
              ref.close();
            }
          });
          ref.addEventListener("exit", function(event) {
            if (error) {
              promise.setError();
            } else {
              kc.clearToken();
              promise.setSuccess();
            }
          });
          return promise.promise;
        },
        register: function(options) {
          return __async(this, null, function* () {
            var promise = createPromise();
            var registerUrl = yield kc.createRegisterUrl();
            var cordovaOptions = createCordovaOptions(options);
            var ref = cordovaOpenWindowWrapper(registerUrl, "_blank", cordovaOptions);
            ref.addEventListener("loadstart", function(event) {
              if (event.url.indexOf(getCordovaRedirectUri()) == 0) {
                ref.close();
                var oauth = parseCallback(event.url);
                processCallback(oauth, promise);
              }
            });
            return promise.promise;
          });
        },
        accountManagement: function() {
          var accountUrl = kc.createAccountUrl();
          if (typeof accountUrl !== "undefined") {
            var ref = cordovaOpenWindowWrapper(accountUrl, "_blank", "location=no");
            ref.addEventListener("loadstart", function(event) {
              if (event.url.indexOf(getCordovaRedirectUri()) == 0) {
                ref.close();
              }
            });
          } else {
            throw "Not supported by the OIDC server";
          }
        },
        redirectUri: function(options) {
          return getCordovaRedirectUri();
        }
      };
    }
    if (type == "cordova-native") {
      loginIframe.enable = false;
      return {
        login: function(options) {
          return __async(this, null, function* () {
            var promise = createPromise();
            var loginUrl = yield kc.createLoginUrl(options);
            universalLinks.subscribe("keycloak", function(event) {
              universalLinks.unsubscribe("keycloak");
              window.cordova.plugins.browsertab.close();
              var oauth = parseCallback(event.url);
              processCallback(oauth, promise);
            });
            window.cordova.plugins.browsertab.openUrl(loginUrl);
            return promise.promise;
          });
        },
        logout: function(options) {
          var promise = createPromise();
          var logoutUrl = kc.createLogoutUrl(options);
          universalLinks.subscribe("keycloak", function(event) {
            universalLinks.unsubscribe("keycloak");
            window.cordova.plugins.browsertab.close();
            kc.clearToken();
            promise.setSuccess();
          });
          window.cordova.plugins.browsertab.openUrl(logoutUrl);
          return promise.promise;
        },
        register: function(options) {
          return __async(this, null, function* () {
            var promise = createPromise();
            var registerUrl = yield kc.createRegisterUrl(options);
            universalLinks.subscribe("keycloak", function(event) {
              universalLinks.unsubscribe("keycloak");
              window.cordova.plugins.browsertab.close();
              var oauth = parseCallback(event.url);
              processCallback(oauth, promise);
            });
            window.cordova.plugins.browsertab.openUrl(registerUrl);
            return promise.promise;
          });
        },
        accountManagement: function() {
          var accountUrl = kc.createAccountUrl();
          if (typeof accountUrl !== "undefined") {
            window.cordova.plugins.browsertab.openUrl(accountUrl);
          } else {
            throw "Not supported by the OIDC server";
          }
        },
        redirectUri: function(options) {
          if (options && options.redirectUri) {
            return options.redirectUri;
          } else if (kc.redirectUri) {
            return kc.redirectUri;
          } else {
            return "http://localhost";
          }
        }
      };
    }
    throw "invalid adapter type: " + type;
  }
  const STORAGE_KEY_PREFIX = "kc-callback-";
  var LocalStorage = function() {
    if (!(this instanceof LocalStorage)) {
      return new LocalStorage();
    }
    localStorage.setItem("kc-test", "test");
    localStorage.removeItem("kc-test");
    var cs = this;
    function clearInvalidValues() {
      const currentTime = Date.now();
      for (const [key, value] of getStoredEntries()) {
        const expiry = parseExpiry(value);
        if (expiry === null || expiry < currentTime) {
          localStorage.removeItem(key);
        }
      }
    }
    function clearAllValues() {
      for (const [key] of getStoredEntries()) {
        localStorage.removeItem(key);
      }
    }
    function getStoredEntries() {
      return Object.entries(localStorage).filter(([key]) => key.startsWith(STORAGE_KEY_PREFIX));
    }
    function parseExpiry(value) {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (error) {
        return null;
      }
      if (isObject(parsedValue) && "expires" in parsedValue && typeof parsedValue.expires === "number") {
        return parsedValue.expires;
      }
      return null;
    }
    cs.get = function(state) {
      if (!state) {
        return;
      }
      var key = STORAGE_KEY_PREFIX + state;
      var value = localStorage.getItem(key);
      if (value) {
        localStorage.removeItem(key);
        value = JSON.parse(value);
      }
      clearInvalidValues();
      return value;
    };
    cs.add = function(state) {
      clearInvalidValues();
      const key = STORAGE_KEY_PREFIX + state.state;
      const value = JSON.stringify(__spreadProps(__spreadValues({}, state), {
        // Set the expiry time to 1 hour from now.
        expires: Date.now() + 60 * 60 * 1e3
      }));
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        clearAllValues();
        localStorage.setItem(key, value);
      }
    };
  };
  var CookieStorage = function() {
    if (!(this instanceof CookieStorage)) {
      return new CookieStorage();
    }
    var cs = this;
    cs.get = function(state) {
      if (!state) {
        return;
      }
      var value = getCookie(STORAGE_KEY_PREFIX + state);
      setCookie(STORAGE_KEY_PREFIX + state, "", cookieExpiration(-100));
      if (value) {
        return JSON.parse(value);
      }
    };
    cs.add = function(state) {
      setCookie(STORAGE_KEY_PREFIX + state.state, JSON.stringify(state), cookieExpiration(60));
    };
    cs.removeItem = function(key) {
      setCookie(key, "", cookieExpiration(-100));
    };
    var cookieExpiration = function(minutes) {
      var exp = /* @__PURE__ */ new Date();
      exp.setTime(exp.getTime() + minutes * 60 * 1e3);
      return exp;
    };
    var getCookie = function(key) {
      var name = key + "=";
      var ca = document.cookie.split(";");
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    };
    var setCookie = function(key, value, expirationDate) {
      var cookie = key + "=" + value + "; expires=" + expirationDate.toUTCString() + "; ";
      document.cookie = cookie;
    };
  };
  function createCallbackStorage() {
    try {
      return new LocalStorage();
    } catch (err) {
    }
    return new CookieStorage();
  }
  function createLogger(fn) {
    return function() {
      if (kc.enableLogging) {
        fn.apply(console, Array.prototype.slice.call(arguments));
      }
    };
  }
}
var keycloak_default = Keycloak;
function bytesToBase64(bytes) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}
function sha256Digest(message) {
  return __async(this, null, function* () {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    if (typeof crypto === "undefined" || typeof crypto.subtle === "undefined") {
      throw new Error("Web Crypto API is not available.");
    }
    return yield crypto.subtle.digest("SHA-256", data);
  });
}
function decodeToken(token) {
  const [header, payload] = token.split(".");
  if (typeof payload !== "string") {
    throw new Error("Unable to decode token, payload not found.");
  }
  let decoded;
  try {
    decoded = base64UrlDecode(payload);
  } catch (error) {
    throw new Error("Unable to decode token, payload is not a valid Base64URL value.", {
      cause: error
    });
  }
  try {
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error("Unable to decode token, payload is not a valid JSON value.", {
      cause: error
    });
  }
}
function base64UrlDecode(input) {
  let output = input.replaceAll("-", "+").replaceAll("_", "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("Input is not of the correct length.");
  }
  try {
    return b64DecodeUnicode(output);
  } catch (error) {
    return atob(output);
  }
}
function b64DecodeUnicode(input) {
  return decodeURIComponent(atob(input).replace(/(.)/g, (m, p) => {
    let code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = "0" + code;
    }
    return "%" + code;
  }));
}
function isObject(input) {
  return typeof input === "object" && input !== null;
}

// node_modules/keycloak-angular/fesm2022/keycloak-angular.mjs
var KeycloakEventTypeLegacy;
(function(KeycloakEventTypeLegacy2) {
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthError"] = 0] = "OnAuthError";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthLogout"] = 1] = "OnAuthLogout";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthRefreshError"] = 2] = "OnAuthRefreshError";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthRefreshSuccess"] = 3] = "OnAuthRefreshSuccess";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnAuthSuccess"] = 4] = "OnAuthSuccess";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnReady"] = 5] = "OnReady";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnTokenExpired"] = 6] = "OnTokenExpired";
  KeycloakEventTypeLegacy2[KeycloakEventTypeLegacy2["OnActionUpdate"] = 7] = "OnActionUpdate";
})(KeycloakEventTypeLegacy || (KeycloakEventTypeLegacy = {}));
var KeycloakAuthGuard = class {
  constructor(router, keycloakAngular) {
    this.router = router;
    this.keycloakAngular = keycloakAngular;
  }
  /**
   * CanActivate checks if the user is logged in and get the full list of roles (REALM + CLIENT)
   * of the logged user. This values are set to authenticated and roles params.
   *
   * @param route
   * @param state
   */
  canActivate(route, state) {
    return __async(this, null, function* () {
      try {
        this.authenticated = yield this.keycloakAngular.isLoggedIn();
        this.roles = yield this.keycloakAngular.getUserRoles(true);
        return yield this.isAccessAllowed(route, state);
      } catch (error) {
        throw new Error("An error happened during access validation. Details:" + error);
      }
    });
  }
};
var KeycloakService = class _KeycloakService {
  constructor() {
    this._keycloakEvents$ = new Subject();
  }
  /**
   * Binds the keycloak-js events to the keycloakEvents Subject
   * which is a good way to monitor for changes, if needed.
   *
   * The keycloakEvents returns the keycloak-js event type and any
   * argument if the source function provides any.
   */
  bindsKeycloakEvents() {
    this._instance.onAuthError = (errorData) => {
      this._keycloakEvents$.next({
        args: errorData,
        type: KeycloakEventTypeLegacy.OnAuthError
      });
    };
    this._instance.onAuthLogout = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthLogout
      });
    };
    this._instance.onAuthRefreshSuccess = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthRefreshSuccess
      });
    };
    this._instance.onAuthRefreshError = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthRefreshError
      });
    };
    this._instance.onAuthSuccess = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnAuthSuccess
      });
    };
    this._instance.onTokenExpired = () => {
      this._keycloakEvents$.next({
        type: KeycloakEventTypeLegacy.OnTokenExpired
      });
    };
    this._instance.onActionUpdate = (state) => {
      this._keycloakEvents$.next({
        args: state,
        type: KeycloakEventTypeLegacy.OnActionUpdate
      });
    };
    this._instance.onReady = (authenticated) => {
      this._keycloakEvents$.next({
        args: authenticated,
        type: KeycloakEventTypeLegacy.OnReady
      });
    };
  }
  /**
   * Loads all bearerExcludedUrl content in a uniform type: ExcludedUrl,
   * so it becomes easier to handle.
   *
   * @param bearerExcludedUrls array of strings or ExcludedUrl that includes
   * the url and HttpMethod.
   */
  loadExcludedUrls(bearerExcludedUrls) {
    const excludedUrls = [];
    for (const item of bearerExcludedUrls) {
      let excludedUrl;
      if (typeof item === "string") {
        excludedUrl = {
          urlPattern: new RegExp(item, "i"),
          httpMethods: []
        };
      } else {
        excludedUrl = {
          urlPattern: new RegExp(item.url, "i"),
          httpMethods: item.httpMethods
        };
      }
      excludedUrls.push(excludedUrl);
    }
    return excludedUrls;
  }
  /**
   * Handles the class values initialization.
   *
   * @param options
   */
  initServiceValues({
    enableBearerInterceptor = true,
    loadUserProfileAtStartUp = false,
    bearerExcludedUrls = [],
    authorizationHeaderName = "Authorization",
    bearerPrefix = "Bearer",
    initOptions,
    updateMinValidity = 20,
    shouldAddToken = () => true,
    shouldUpdateToken = () => true
  }) {
    this._enableBearerInterceptor = enableBearerInterceptor;
    this._loadUserProfileAtStartUp = loadUserProfileAtStartUp;
    this._authorizationHeaderName = authorizationHeaderName;
    this._bearerPrefix = bearerPrefix.trim().concat(" ");
    this._excludedUrls = this.loadExcludedUrls(bearerExcludedUrls);
    this._silentRefresh = initOptions ? initOptions.flow === "implicit" : false;
    this._updateMinValidity = updateMinValidity;
    this.shouldAddToken = shouldAddToken;
    this.shouldUpdateToken = shouldUpdateToken;
  }
  /**
   * Keycloak initialization. It should be called to initialize the adapter.
   * Options is an object with 2 main parameters: config and initOptions. The first one
   * will be used to create the Keycloak instance. The second one are options to initialize the
   * keycloak instance.
   *
   * @param options
   * Config: may be a string representing the keycloak URI or an object with the
   * following content:
   * - url: Keycloak json URL
   * - realm: realm name
   * - clientId: client id
   *
   * initOptions:
   * Options to initialize the Keycloak adapter, matches the options as provided by Keycloak itself.
   *
   * enableBearerInterceptor:
   * Flag to indicate if the bearer will added to the authorization header.
   *
   * loadUserProfileInStartUp:
   * Indicates that the user profile should be loaded at the keycloak initialization,
   * just after the login.
   *
   * bearerExcludedUrls:
   * String Array to exclude the urls that should not have the Authorization Header automatically
   * added.
   *
   * authorizationHeaderName:
   * This value will be used as the Authorization Http Header name.
   *
   * bearerPrefix:
   * This value will be included in the Authorization Http Header param.
   *
   * tokenUpdateExcludedHeaders:
   * Array of Http Header key/value maps that should not trigger the token to be updated.
   *
   * updateMinValidity:
   * This value determines if the token will be refreshed based on its expiration time.
   *
   * @returns
   * A Promise with a boolean indicating if the initialization was successful.
   */
  init() {
    return __async(this, arguments, function* (options = {}) {
      this.initServiceValues(options);
      const {
        config,
        initOptions
      } = options;
      this._instance = new keycloak_default(config);
      this.bindsKeycloakEvents();
      const authenticated = yield this._instance.init(initOptions);
      if (authenticated && this._loadUserProfileAtStartUp) {
        yield this.loadUserProfile();
      }
      return authenticated;
    });
  }
  /**
   * Redirects to login form on (options is an optional object with redirectUri and/or
   * prompt fields).
   *
   * @param options
   * Object, where:
   *  - redirectUri: Specifies the uri to redirect to after login.
   *  - prompt:By default the login screen is displayed if the user is not logged-in to Keycloak.
   * To only authenticate to the application if the user is already logged-in and not display the
   * login page if the user is not logged-in, set this option to none. To always require
   * re-authentication and ignore SSO, set this option to login .
   *  - maxAge: Used just if user is already authenticated. Specifies maximum time since the
   * authentication of user happened. If user is already authenticated for longer time than
   * maxAge, the SSO is ignored and he will need to re-authenticate again.
   *  - loginHint: Used to pre-fill the username/email field on the login form.
   *  - action: If value is 'register' then user is redirected to registration page, otherwise to
   * login page.
   *  - locale: Specifies the desired locale for the UI.
   * @returns
   * A void Promise if the login is successful and after the user profile loading.
   */
  login() {
    return __async(this, arguments, function* (options = {}) {
      yield this._instance.login(options);
      if (this._loadUserProfileAtStartUp) {
        yield this.loadUserProfile();
      }
    });
  }
  /**
   * Redirects to logout.
   *
   * @param redirectUri
   * Specifies the uri to redirect to after logout.
   * @returns
   * A void Promise if the logout was successful, cleaning also the userProfile.
   */
  logout(redirectUri) {
    return __async(this, null, function* () {
      const options = {
        redirectUri
      };
      yield this._instance.logout(options);
      this._userProfile = void 0;
    });
  }
  /**
   * Redirects to registration form. Shortcut for login with option
   * action = 'register'. Options are same as for the login method but 'action' is set to
   * 'register'.
   *
   * @param options
   * login options
   * @returns
   * A void Promise if the register flow was successful.
   */
  register() {
    return __async(this, arguments, function* (options = {
      action: "register"
    }) {
      yield this._instance.register(options);
    });
  }
  /**
   * Check if the user has access to the specified role. It will look for roles in
   * realm and the given resource, but will not check if the user is logged in for better performance.
   *
   * @param role
   * role name
   * @param resource
   * resource name. If not specified, `clientId` is used
   * @returns
   * A boolean meaning if the user has the specified Role.
   */
  isUserInRole(role, resource) {
    let hasRole;
    hasRole = this._instance.hasResourceRole(role, resource);
    if (!hasRole) {
      hasRole = this._instance.hasRealmRole(role);
    }
    return hasRole;
  }
  /**
   * Return the roles of the logged user. The realmRoles parameter, with default value
   * true, will return the resource roles and realm roles associated with the logged user. If set to false
   * it will only return the resource roles. The resource parameter, if specified, will return only resource roles
   * associated with the given resource.
   *
   * @param realmRoles
   * Set to false to exclude realm roles (only client roles)
   * @param resource
   * resource name If not specified, returns roles from all resources
   * @returns
   * Array of Roles associated with the logged user.
   */
  getUserRoles(realmRoles = true, resource) {
    let roles = [];
    if (this._instance.resourceAccess) {
      Object.keys(this._instance.resourceAccess).forEach((key) => {
        if (resource && resource !== key) {
          return;
        }
        const resourceAccess = this._instance.resourceAccess[key];
        const clientRoles = resourceAccess["roles"] || [];
        roles = roles.concat(clientRoles);
      });
    }
    if (realmRoles && this._instance.realmAccess) {
      const realmRoles2 = this._instance.realmAccess["roles"] || [];
      roles.push(...realmRoles2);
    }
    return roles;
  }
  /**
   * Check if user is logged in.
   *
   * @returns
   * A boolean that indicates if the user is logged in.
   */
  isLoggedIn() {
    if (!this._instance) {
      return false;
    }
    return this._instance.authenticated;
  }
  /**
   * Returns true if the token has less than minValidity seconds left before
   * it expires.
   *
   * @param minValidity
   * Seconds left. (minValidity) is optional. Default value is 0.
   * @returns
   * Boolean indicating if the token is expired.
   */
  isTokenExpired(minValidity = 0) {
    return this._instance.isTokenExpired(minValidity);
  }
  /**
   * If the token expires within _updateMinValidity seconds the token is refreshed. If the
   * session status iframe is enabled, the session status is also checked.
   * Returns a promise telling if the token was refreshed or not. If the session is not active
   * anymore, the promise is rejected.
   *
   * @param minValidity
   * Seconds left. (minValidity is optional, if not specified updateMinValidity - default 20 is used)
   * @returns
   * Promise with a boolean indicating if the token was succesfully updated.
   */
  updateToken() {
    return __async(this, arguments, function* (minValidity = this._updateMinValidity) {
      if (this._silentRefresh) {
        if (this.isTokenExpired()) {
          throw new Error("Failed to refresh the token, or the session is expired");
        }
        return true;
      }
      if (!this._instance) {
        throw new Error("Keycloak Angular library is not initialized.");
      }
      try {
        return yield this._instance.updateToken(minValidity);
      } catch (error) {
        return false;
      }
    });
  }
  /**
   * Loads the user profile.
   * Returns promise to set functions to be invoked if the profile was loaded
   * successfully, or if the profile could not be loaded.
   *
   * @param forceReload
   * If true will force the loadUserProfile even if its already loaded.
   * @returns
   * A promise with the KeycloakProfile data loaded.
   */
  loadUserProfile(forceReload = false) {
    return __async(this, null, function* () {
      if (this._userProfile && !forceReload) {
        return this._userProfile;
      }
      if (!this._instance.authenticated) {
        throw new Error("The user profile was not loaded as the user is not logged in.");
      }
      return this._userProfile = yield this._instance.loadUserProfile();
    });
  }
  /**
   * Returns the authenticated token.
   */
  getToken() {
    return __async(this, null, function* () {
      return this._instance.token;
    });
  }
  /**
   * Returns the logged username.
   *
   * @returns
   * The logged username.
   */
  getUsername() {
    if (!this._userProfile) {
      throw new Error("User not logged in or user profile was not loaded.");
    }
    return this._userProfile.username;
  }
  /**
   * Clear authentication state, including tokens. This can be useful if application
   * has detected the session was expired, for example if updating token fails.
   * Invoking this results in onAuthLogout callback listener being invoked.
   */
  clearToken() {
    this._instance.clearToken();
  }
  /**
   * Adds a valid token in header. The key & value format is:
   * Authorization Bearer <token>.
   * If the headers param is undefined it will create the Angular headers object.
   *
   * @param headers
   * Updated header with Authorization and Keycloak token.
   * @returns
   * An observable with with the HTTP Authorization header and the current token.
   */
  addTokenToHeader(headers = new HttpHeaders()) {
    return from(this.getToken()).pipe(map((token) => token ? headers.set(this._authorizationHeaderName, this._bearerPrefix + token) : headers));
  }
  /**
   * Returns the original Keycloak instance, if you need any customization that
   * this Angular service does not support yet. Use with caution.
   *
   * @returns
   * The KeycloakInstance from keycloak-js.
   */
  getKeycloakInstance() {
    return this._instance;
  }
  /**
   * @deprecated
   * Returns the excluded URLs that should not be considered by
   * the http interceptor which automatically adds the authorization header in the Http Request.
   *
   * @returns
   * The excluded urls that must not be intercepted by the KeycloakBearerInterceptor.
   */
  get excludedUrls() {
    return this._excludedUrls;
  }
  /**
   * Flag to indicate if the bearer will be added to the authorization header.
   *
   * @returns
   * Returns if the bearer interceptor was set to be disabled.
   */
  get enableBearerInterceptor() {
    return this._enableBearerInterceptor;
  }
  /**
   * Keycloak subject to monitor the events triggered by keycloak-js.
   * The following events as available (as described at keycloak docs -
   * https://www.keycloak.org/docs/latest/securing_apps/index.html#callback-events):
   * - OnAuthError
   * - OnAuthLogout
   * - OnAuthRefreshError
   * - OnAuthRefreshSuccess
   * - OnAuthSuccess
   * - OnReady
   * - OnTokenExpire
   * In each occurrence of any of these, this subject will return the event type,
   * described at {@link KeycloakEventTypeLegacy} enum and the function args from the keycloak-js
   * if provided any.
   *
   * @returns
   * A subject with the {@link KeycloakEventLegacy} which describes the event type and attaches the
   * function args.
   */
  get keycloakEvents$() {
    return this._keycloakEvents$;
  }
  static {
    this.ɵfac = function KeycloakService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _KeycloakService)();
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _KeycloakService,
      factory: _KeycloakService.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeycloakService, [{
    type: Injectable
  }], null, null);
})();
var KeycloakBearerInterceptor = class _KeycloakBearerInterceptor {
  constructor(keycloak) {
    this.keycloak = keycloak;
  }
  /**
   * Calls to update the keycloak token if the request should update the token.
   *
   * @param req http request from @angular http module.
   * @returns
   * A promise boolean for the token update or noop result.
   */
  conditionallyUpdateToken(req) {
    return __async(this, null, function* () {
      if (this.keycloak.shouldUpdateToken(req)) {
        return yield this.keycloak.updateToken();
      }
      return true;
    });
  }
  /**
   * @deprecated
   * Checks if the url is excluded from having the Bearer Authorization
   * header added.
   *
   * @param req http request from @angular http module.
   * @param excludedUrlRegex contains the url pattern and the http methods,
   * excluded from adding the bearer at the Http Request.
   */
  isUrlExcluded({
    method,
    url
  }, {
    urlPattern,
    httpMethods
  }) {
    const httpTest = httpMethods.length === 0 || httpMethods.join().indexOf(method.toUpperCase()) > -1;
    const urlTest = urlPattern.test(url);
    return httpTest && urlTest;
  }
  /**
   * Intercept implementation that checks if the request url matches the excludedUrls.
   * If not, adds the Authorization header to the request if the user is logged in.
   *
   * @param req
   * @param next
   */
  intercept(req, next) {
    const {
      enableBearerInterceptor,
      excludedUrls
    } = this.keycloak;
    if (!enableBearerInterceptor) {
      return next.handle(req);
    }
    const shallPass = !this.keycloak.shouldAddToken(req) || excludedUrls.findIndex((item) => this.isUrlExcluded(req, item)) > -1;
    if (shallPass) {
      return next.handle(req);
    }
    return combineLatest([from(this.conditionallyUpdateToken(req)), of(this.keycloak.isLoggedIn())]).pipe(mergeMap(([_, isLoggedIn]) => isLoggedIn ? this.handleRequestWithTokenHeader(req, next) : next.handle(req)));
  }
  /**
   * Adds the token of the current user to the Authorization header
   *
   * @param req
   * @param next
   */
  handleRequestWithTokenHeader(req, next) {
    return this.keycloak.addTokenToHeader(req.headers).pipe(mergeMap((headersWithBearer) => {
      const kcReq = req.clone({
        headers: headersWithBearer
      });
      return next.handle(kcReq);
    }));
  }
  static {
    this.ɵfac = function KeycloakBearerInterceptor_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _KeycloakBearerInterceptor)(ɵɵinject(KeycloakService));
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _KeycloakBearerInterceptor,
      factory: _KeycloakBearerInterceptor.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeycloakBearerInterceptor, [{
    type: Injectable
  }], () => [{
    type: KeycloakService
  }], null);
})();
var CoreModule = class _CoreModule {
  static {
    this.ɵfac = function CoreModule_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _CoreModule)();
    };
  }
  static {
    this.ɵmod = ɵɵdefineNgModule({
      type: _CoreModule,
      imports: [CommonModule]
    });
  }
  static {
    this.ɵinj = ɵɵdefineInjector({
      providers: [KeycloakService, {
        provide: HTTP_INTERCEPTORS,
        useClass: KeycloakBearerInterceptor,
        multi: true
      }],
      imports: [CommonModule]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CoreModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      providers: [KeycloakService, {
        provide: HTTP_INTERCEPTORS,
        useClass: KeycloakBearerInterceptor,
        multi: true
      }]
    }]
  }], null, null);
})();
var KeycloakAngularModule = class _KeycloakAngularModule {
  static {
    this.ɵfac = function KeycloakAngularModule_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _KeycloakAngularModule)();
    };
  }
  static {
    this.ɵmod = ɵɵdefineNgModule({
      type: _KeycloakAngularModule,
      imports: [CoreModule]
    });
  }
  static {
    this.ɵinj = ɵɵdefineInjector({
      imports: [CoreModule]
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(KeycloakAngularModule, [{
    type: NgModule,
    args: [{
      imports: [CoreModule]
    }]
  }], null, null);
})();
var KeycloakEventType;
(function(KeycloakEventType2) {
  KeycloakEventType2["KeycloakAngularNotInitialized"] = "KeycloakAngularNotInitialized";
  KeycloakEventType2["KeycloakAngularInit"] = "KeycloakAngularInit";
  KeycloakEventType2["AuthError"] = "AuthError";
  KeycloakEventType2["AuthLogout"] = "AuthLogout";
  KeycloakEventType2["AuthRefreshError"] = "AuthRefreshError";
  KeycloakEventType2["AuthRefreshSuccess"] = "AuthRefreshSuccess";
  KeycloakEventType2["AuthSuccess"] = "AuthSuccess";
  KeycloakEventType2["Ready"] = "Ready";
  KeycloakEventType2["TokenExpired"] = "TokenExpired";
  KeycloakEventType2["ActionUpdate"] = "ActionUpdate";
})(KeycloakEventType || (KeycloakEventType = {}));
var typeEventArgs = (args) => args;
var createKeycloakSignal = (keycloak) => {
  const keycloakSignal = signal({
    type: KeycloakEventType.KeycloakAngularInit
  });
  if (!keycloak) {
    keycloakSignal.set({
      type: KeycloakEventType.KeycloakAngularNotInitialized
    });
    return keycloakSignal;
  }
  keycloak.onReady = (authenticated) => {
    keycloakSignal.set({
      type: KeycloakEventType.Ready,
      args: authenticated
    });
  };
  keycloak.onAuthError = (errorData) => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthError,
      args: errorData
    });
  };
  keycloak.onAuthLogout = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthLogout
    });
  };
  keycloak.onActionUpdate = (status, action) => {
    keycloakSignal.set({
      type: KeycloakEventType.ActionUpdate,
      args: {
        status,
        action
      }
    });
  };
  keycloak.onAuthRefreshError = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthRefreshError
    });
  };
  keycloak.onAuthRefreshSuccess = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthRefreshSuccess
    });
  };
  keycloak.onAuthSuccess = () => {
    keycloakSignal.set({
      type: KeycloakEventType.AuthSuccess
    });
  };
  keycloak.onTokenExpired = () => {
    keycloakSignal.set({
      type: KeycloakEventType.TokenExpired
    });
  };
  return keycloakSignal;
};
var KEYCLOAK_EVENT_SIGNAL = new InjectionToken("Keycloak Events Signal");
var HasRolesDirective = class _HasRolesDirective {
  constructor(templateRef, viewContainer, keycloak) {
    this.templateRef = templateRef;
    this.viewContainer = viewContainer;
    this.keycloak = keycloak;
    this.roles = [];
    this.checkRealm = false;
    this.viewContainer.clear();
    const keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);
    effect(() => {
      const keycloakEvent = keycloakSignal();
      if (keycloakEvent.type !== KeycloakEventType.Ready) {
        return;
      }
      const authenticated = typeEventArgs(keycloakEvent.args);
      if (authenticated) {
        this.render();
      }
    });
  }
  render() {
    const hasAccess = this.checkUserRoles();
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
  /**
   * Checks if the user has at least one of the specified roles in the resource or realm.
   * @returns True if the user has access, false otherwise.
   */
  checkUserRoles() {
    const hasResourceRole = this.roles.some((role) => this.keycloak.hasResourceRole(role, this.resource));
    const hasRealmRole = this.checkRealm ? this.roles.some((role) => this.keycloak.hasRealmRole(role)) : false;
    return hasResourceRole || hasRealmRole;
  }
  static {
    this.ɵfac = function HasRolesDirective_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _HasRolesDirective)(ɵɵdirectiveInject(TemplateRef), ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(keycloak_default));
    };
  }
  static {
    this.ɵdir = ɵɵdefineDirective({
      type: _HasRolesDirective,
      selectors: [["", "kaHasRoles", ""]],
      inputs: {
        roles: [0, "kaHasRoles", "roles"],
        resource: [0, "kaHasRolesResource", "resource"],
        checkRealm: [0, "kaHasRolesCheckRealm", "checkRealm"]
      }
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HasRolesDirective, [{
    type: Directive,
    args: [{
      selector: "[kaHasRoles]"
    }]
  }], () => [{
    type: TemplateRef
  }, {
    type: ViewContainerRef
  }, {
    type: keycloak_default
  }], {
    roles: [{
      type: Input,
      args: ["kaHasRoles"]
    }],
    resource: [{
      type: Input,
      args: ["kaHasRolesResource"]
    }],
    checkRealm: [{
      type: Input,
      args: ["kaHasRolesCheckRealm"]
    }]
  });
})();
var UserActivityService = class _UserActivityService {
  constructor(ngZone) {
    this.ngZone = ngZone;
    this.lastActivity = signal(Date.now());
    this.destroy$ = new Subject();
    this.lastActivitySignal = computed(() => this.lastActivity());
  }
  /**
   * Starts monitoring user activity events (`mousemove`, `touchstart`, `keydown`, `click`, `scroll`)
   * and updates the last activity timestamp using RxJS with debounce.
   * The events are processed outside Angular zone for performance optimization.
   */
  startMonitoring() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (!isBrowser) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      const events = ["mousemove", "touchstart", "keydown", "click", "scroll"];
      events.forEach((event) => {
        fromEvent(window, event).pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.updateLastActivity());
      });
    });
  }
  /**
   * Updates the last activity timestamp to the current time.
   * This method runs inside Angular's zone to ensure reactivity with Angular signals.
   */
  updateLastActivity() {
    this.ngZone.run(() => {
      this.lastActivity.set(Date.now());
    });
  }
  /**
   * Retrieves the timestamp of the last recorded user activity.
   * @returns {number} The last activity timestamp in milliseconds since epoch.
   */
  get lastActivityTime() {
    return this.lastActivity();
  }
  /**
   * Determines whether the user interacted with the application, meaning it is activily using the application, based on
   * the specified duration.
   * @param timeout - The inactivity timeout in milliseconds.
   * @returns {boolean} `true` if the user is inactive, otherwise `false`.
   */
  isActive(timeout) {
    return Date.now() - this.lastActivityTime < timeout;
  }
  /**
   * Cleans up RxJS subscriptions and resources when the service is destroyed.
   * This method is automatically called by Angular when the service is removed.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  static {
    this.ɵfac = function UserActivityService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _UserActivityService)(ɵɵinject(NgZone));
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _UserActivityService,
      factory: _UserActivityService.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(UserActivityService, [{
    type: Injectable
  }], () => [{
    type: NgZone
  }], null);
})();
var AutoRefreshTokenService = class _AutoRefreshTokenService {
  constructor(keycloak, userActivity) {
    this.keycloak = keycloak;
    this.userActivity = userActivity;
    this.options = this.defaultOptions;
    this.initialized = false;
    const keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);
    effect(() => {
      const keycloakEvent = keycloakSignal();
      if (keycloakEvent.type === KeycloakEventType.TokenExpired) {
        this.processTokenExpiredEvent();
      }
    });
  }
  get defaultOptions() {
    return {
      sessionTimeout: 3e5,
      onInactivityTimeout: "logout"
    };
  }
  executeOnInactivityTimeout() {
    switch (this.options.onInactivityTimeout) {
      case "login":
        this.keycloak.login().catch((error) => console.error("Failed to execute the login call", error));
        break;
      case "logout":
        this.keycloak.logout().catch((error) => console.error("Failed to execute the logout call", error));
        break;
      default:
        break;
    }
  }
  processTokenExpiredEvent() {
    if (!this.initialized || !this.keycloak.authenticated) {
      return;
    }
    if (this.userActivity.isActive(this.options.sessionTimeout)) {
      this.keycloak.updateToken().catch(() => this.executeOnInactivityTimeout());
    } else {
      this.executeOnInactivityTimeout();
    }
  }
  start(options) {
    this.options = __spreadValues(__spreadValues({}, this.defaultOptions), options);
    this.initialized = true;
    this.userActivity.startMonitoring();
  }
  static {
    this.ɵfac = function AutoRefreshTokenService_Factory(__ngFactoryType__) {
      return new (__ngFactoryType__ || _AutoRefreshTokenService)(ɵɵinject(keycloak_default), ɵɵinject(UserActivityService));
    };
  }
  static {
    this.ɵprov = ɵɵdefineInjectable({
      token: _AutoRefreshTokenService,
      factory: _AutoRefreshTokenService.ɵfac
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AutoRefreshTokenService, [{
    type: Injectable
  }], () => [{
    type: keycloak_default
  }, {
    type: UserActivityService
  }], null);
})();
function withAutoRefreshToken(options) {
  return {
    configure: () => {
      const autoRefreshTokenService = inject(AutoRefreshTokenService);
      autoRefreshTokenService.start(options);
    }
  };
}
var mapResourceRoles = (resourceAccess = {}) => {
  return Object.entries(resourceAccess).reduce((roles, [key, value]) => {
    roles[key] = value.roles;
    return roles;
  }, {});
};
var createAuthGuard = (isAccessAllowed) => {
  return (next, state) => {
    const keycloak = inject(keycloak_default);
    const authenticated = keycloak?.authenticated ?? false;
    const grantedRoles = {
      resourceRoles: mapResourceRoles(keycloak?.resourceAccess),
      realmRoles: keycloak?.realmAccess?.roles ?? []
    };
    const authData = {
      authenticated,
      keycloak,
      grantedRoles
    };
    return isAccessAllowed(next, state, authData);
  };
};
var BEARER_PREFIX = "Bearer";
var AUTHORIZATION_HEADER_NAME = "Authorization";
var createInterceptorCondition = (value) => __spreadProps(__spreadValues({}, value), {
  bearerPrefix: value.bearerPrefix ?? BEARER_PREFIX,
  authorizationHeaderName: value.authorizationHeaderName ?? AUTHORIZATION_HEADER_NAME,
  shouldUpdateToken: value.shouldUpdateToken ?? (() => true)
});
var conditionallyUpdateToken = (_0, _1, _2) => __async(null, [_0, _1, _2], function* (req, keycloak, {
  shouldUpdateToken = (_) => true
}) {
  if (shouldUpdateToken(req)) {
    return yield keycloak.updateToken().catch(() => false);
  }
  return true;
});
var addAuthorizationHeader = (req, next, keycloak, condition) => {
  const {
    bearerPrefix = BEARER_PREFIX,
    authorizationHeaderName = AUTHORIZATION_HEADER_NAME
  } = condition;
  const clonedRequest = req.clone({
    setHeaders: {
      [authorizationHeaderName]: `${bearerPrefix} ${keycloak.token}`
    }
  });
  return next(clonedRequest);
};
var CUSTOM_BEARER_TOKEN_INTERCEPTOR_CONFIG = new InjectionToken("Include the bearer token as implemented by the provided function");
var customBearerTokenInterceptor = (req, next) => {
  const conditions = inject(CUSTOM_BEARER_TOKEN_INTERCEPTOR_CONFIG) ?? [];
  const keycloak = inject(keycloak_default);
  const matchingCondition = conditions.find((condition) => __async(null, null, function* () {
    return yield condition.shouldAddToken(req, next, keycloak);
  }));
  if (!matchingCondition) {
    return next(req);
  }
  return from(conditionallyUpdateToken(req, keycloak, matchingCondition)).pipe(mergeMap(() => keycloak.authenticated ? addAuthorizationHeader(req, next, keycloak, matchingCondition) : next(req)));
};
var INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG = new InjectionToken("Include the bearer token when explicitly defined int the URL pattern condition");
var findMatchingCondition = ({
  method,
  url
}, {
  urlPattern,
  httpMethods = []
}) => {
  const httpMethodTest = httpMethods.length === 0 || httpMethods.join().indexOf(method.toUpperCase()) > -1;
  const urlTest = urlPattern.test(url);
  return httpMethodTest && urlTest;
};
var includeBearerTokenInterceptor = (req, next) => {
  const conditions = inject(INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG) ?? [];
  const matchingCondition = conditions.find((condition) => findMatchingCondition(req, condition));
  if (!matchingCondition) {
    return next(req);
  }
  const keycloak = inject(keycloak_default);
  return from(conditionallyUpdateToken(req, keycloak, matchingCondition)).pipe(mergeMap(() => keycloak.authenticated ? addAuthorizationHeader(req, next, keycloak, matchingCondition) : next(req)));
};
var provideKeycloakInAppInitializer = (keycloak, options) => {
  const {
    initOptions,
    features = []
  } = options;
  if (!initOptions) {
    return [];
  }
  return provideAppInitializer(() => __async(null, null, function* () {
    const injector = inject(EnvironmentInjector);
    runInInjectionContext(injector, () => features.forEach((feature) => feature.configure()));
    yield keycloak.init(initOptions).catch((error) => console.error("Keycloak initialization failed", error));
  }));
};
function provideKeycloak(options) {
  const keycloak = new keycloak_default(options.config);
  const providers = options.providers ?? [];
  const keycloakSignal = createKeycloakSignal(keycloak);
  return makeEnvironmentProviders([{
    provide: KEYCLOAK_EVENT_SIGNAL,
    useValue: keycloakSignal
  }, {
    provide: keycloak_default,
    useValue: keycloak
  }, ...providers, provideKeycloakInAppInitializer(keycloak, options)]);
}
export {
  AutoRefreshTokenService,
  CUSTOM_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  CoreModule,
  HasRolesDirective,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  KEYCLOAK_EVENT_SIGNAL,
  KeycloakAngularModule,
  KeycloakAuthGuard,
  KeycloakBearerInterceptor,
  KeycloakEventType,
  KeycloakEventTypeLegacy,
  KeycloakService,
  UserActivityService,
  addAuthorizationHeader,
  conditionallyUpdateToken,
  createAuthGuard,
  createInterceptorCondition,
  createKeycloakSignal,
  customBearerTokenInterceptor,
  includeBearerTokenInterceptor,
  provideKeycloak,
  typeEventArgs,
  withAutoRefreshToken
};
/*! Bundled license information:

keycloak-angular/fesm2022/keycloak-angular.mjs:
  (**
   * @license
   * Copyright Mauricio Gemelli Vigolo and contributors.
   *
   * Use of this source code is governed by a MIT-style license that can be
   * found in the LICENSE file at https://github.com/mauriciovigolo/keycloak-angular/blob/main/LICENSE.md
   *)
  (**
   * @license
   * Copyright Mauricio Gemelli Vigolo All Rights Reserved.
   *
   * Use of this source code is governed by a MIT-style license that can be
   * found in the LICENSE file at https://github.com/mauriciovigolo/keycloak-angular/blob/main/LICENSE.md
   *)
*/
//# sourceMappingURL=keycloak-angular.js.map
