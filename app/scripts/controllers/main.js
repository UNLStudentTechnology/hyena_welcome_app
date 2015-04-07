/* global moment */
'use strict';

angular.module('hyenaWelcomeApp')
.controller('MainCtrl', function($scope, $ionicModal, $timeout, $cordovaLocalNotification, $cordovaStatusbar, ActivityService, AuthService, ngEstimote, UserService) {
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
});