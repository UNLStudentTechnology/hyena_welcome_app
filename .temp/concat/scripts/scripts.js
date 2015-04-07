"use strict";

angular.module('hyenaWelcomeApp', [
  'ionic',
  'ngCordova',
  'hyenaAngular',
  'angularMoment'
 ])
.run(["$ionicPlatform", function($ionicPlatform) {
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
}])

.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
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
}])
.config(["$httpProvider", function ($httpProvider) {
  //$httpProvider.defaults.withCredentials = true;
  $httpProvider.interceptors.push([
    '$injector',
    function ($injector) {
      return $injector.get('AuthInterceptor');
    }
  ]);
}])
.constant('FBURL', 'https://hyena-welcome.firebaseio.com/')
.constant('APIKEY', 'OTA2MmRmMDlmZGFmNWY1MTcwMmVhZDVk')
.constant('APIPATH', 'http://st-studio.unl.edu/hyena_platform/public/api/1.0/')
.constant('PLATFORM_ROOT', 'http://st-studio.unl.edu/hyena_platform/public/')
.constant('AUTH_SCOPE', 'groups');
/* global moment */
'use strict';

angular.module('hyenaWelcomeApp')
.controller('MainCtrl', ["$scope", "$ionicModal", "$timeout", "$cordovaLocalNotification", "$cordovaStatusbar", "ActivityService", "AuthService", "ngEstimote", "UserService", function($scope, $ionicModal, $timeout, $cordovaLocalNotification, $cordovaStatusbar, ActivityService, AuthService, ngEstimote, UserService) {
	$scope.activities = null;
	$scope.user = null;
	$scope.activityModal = null;
	$scope.pendingAction = false;

	//Temporary for demo
	UserService.get('hgascoigne2').then(function(response) {
		$scope.currentUser = response.data;
	});

	$timeout(function() {
    	$scope.pendingAction = true;
		$scope.showActivityModal();
	}, 3000);

	//Wait till user loads
	$scope.$watch('currentUser', function(value, existingValue) {
		if(value !== null && existingValue === null) {

			//ActivityService.add(activity, 'hgascoigne2');
		}
	});

	var user = ActivityService.user('hgascoigne2').$asObject();
	user.$bindTo($scope, 'user');
    $scope.activities = ActivityService.userActivities('hgascoigne2').$asArray();

    var activity = {
    	created_at: moment().format(),
    	beacon_id: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D',
    	action: 0
    };

    // Create the login modal that we will use later
	$ionicModal.fromTemplateUrl('templates/activity-action.html', {
		scope: $scope
	}).then(function(modal) {
		$scope.activityModal = modal;
	});

	$scope.showActivityModal = function() {
		$scope.activityModal.show();
		$cordovaStatusbar.styleColor('black');
	};

	$scope.closeActivityModal = function() {
		$scope.activityModal.hide();
		$cordovaStatusbar.styleColor('white');
	};

    /**
     * Starts listening for beacons in range
     * @param  object region
     */
    $scope.startRangingBeacons = function(region) {
    	region = region || {};
    	ngEstimote.startMonitoringForRegion(region).then(function(response) {
    		console.log(response, response.state);
    		$scope.showActivityModal();
    		$scope.pendingAction = true;

    	}, function(error) {
    		console.log(error);
    	});
    };
    //$scope.startRangingBeacons();

    $scope.coming = function() {
    	$scope.pendingAction = false;
    	$scope.user.currently = "Brace 305";
    	//Set action to 1 (entering)
    	activity.action = 1;
    	//Save to activity log
    	ActivityService.add(activity, 'hgascoigne2');
    	//Close the modal
    	$scope.closeActivityModal();
    };

    $scope.going = function() {
    	$scope.pendingAction = false;
    	$scope.user.currently = "Out";
    	//Set action to 0 (leaving)
    	activity.action = 0;
    	//Save to activity log
    	ActivityService.add(activity, 'hgascoigne2');
    	//Close the modal
    	$scope.closeActivityModal();
    };

    $scope.disregard = function() {
    	$scope.pendingAction = false;
    	//Close the modal
    	$scope.closeActivityModal();
    };
}]);
'use strict';

/**
 * @ngdoc service
 * @name hyenaWelcomeApp.ActivityService
 * @description
 * # ActivityService
 * Service in the hyenaWelcomeApp.
 */
angular.module('hyenaWelcomeApp')
  .service('ActivityService', ["$firebase", "$q", "AppFirebase", function ($firebase, $q, AppFirebase) {
    var activityRef = AppFirebase.getRef();
    
    var ActivityService =  {
		/**
		* Gets a specific activity
		* @param  string activityId
		* @return promise
		*/
		get: function getActivity(activityId) {
			activityId = activityId.trim();
				return $firebase(activityRef.child('/activities/'+activityId));
		},
		/**
		* Get all activities associated with a group
		* @param  int groupId Group ID
		* @param  int limit   Number of items to return
		* @return promise
		*/
		userActivities: function getUserActivities(userId, limit) {
			limit = limit || 20;
			var activities = activityRef.child('/users/'+userId+'/activities');
			return $firebase(activities);
		},
		/**
		 * Adds a new welcome activity to the specified group
		 * @param object 	activity
		 * @param int 		userId
		 */
		add: function addActivity(activity, userId) {
    		return $firebase(activityRef.child('/users/'+userId+'/activities')).$push(activity);
    	},
    	user: function getUserStatus(userId) {
    		return $firebase(activityRef.child('users/'+userId));
    	}
    };

    return ActivityService;
  }]);
'use strict';

/**
 * @ngdoc service
 * @name hyenaWelcomeApp.ngEstimote
 * @description
 * # ngEstimote
 * AngularJS wrapper for the Estimote cordova plugin.
 */
angular.module('hyenaWelcomeApp')
  .service('ngEstimote', ["$q", function ($q) {
    
    var EstimoteService =  {

    	startMonitoringForRegion: function startMonitoringForRegion(region) {
    		var deferred = $q.defer();

    		estimote.beacons.startMonitoringForRegion({},
    			function(response) {
    				deferred.resolve(response);
    			}, function(error) {
    				deferred.reject(error);
    			});

    		return deferred.promise;
    	},

    	stopMonitoringForRegion: function stopMonitoringForRegion(region) {
    		var deferred = $q.defer();

    		estimote.beacons.stopMonitoringForRegion({},
    			function(response) {
    				deferred.resolve(response);
    			}, function(error) {
    				deferred.reject(error);
    			});

    		return deferred.promise;
    	}

    };

    return EstimoteService;
  }]);

"use strict";

 angular.module('config', [])

.constant('ENV', {name:'production',apiEndpoint:'http://api.yoursite.com/'})

;