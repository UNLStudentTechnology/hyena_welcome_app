"use strict";

angular.module('hyenaWelcomeApp', [
  'ionic',
  'ngCordova',
  'hyenaAngular',
  'angularMoment'
 ])
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  // setup an abstract state for the tabs directive
  .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html",
    data: {
      requireAuth: false
    },
    controller: 'MainCtrl'
  })
  // Each tab has its own nav history stack:
  .state('tab.main', {
    url: '/main',
    views: {
      'tab-main': {
        templateUrl: 'templates/tab-main.html'
      }
    }
  })
  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/main');
})
.config(function ($httpProvider) {
  //$httpProvider.defaults.withCredentials = true;
  $httpProvider.interceptors.push([
    '$injector',
    function ($injector) {
      return $injector.get('AuthInterceptor');
    }
  ]);
})
.constant('FBURL', 'https://hyena-welcome.firebaseio.com/')
.constant('APIKEY', 'OTA2MmRmMDlmZGFmNWY1MTcwMmVhZDVk')
.constant('APIPATH', 'http://st-studio.unl.edu/hyena_platform/public/api/1.0/')
.constant('PLATFORM_ROOT', 'http://st-studio.unl.edu/hyena_platform/public/')
.constant('AUTH_SCOPE', 'groups');