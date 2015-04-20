/* global moment */
'use strict';

angular.module('hyenaWelcomeApp')
.controller('MainCtrl', function ($scope, $rootScope, $ionicModal, $timeout, $cordovaLocalNotification, $cordovaStatusbar, ActivityService, AuthService, ngEstimote, UserService, LocationService) {
	//Declare Variables
    $scope.activities = null;
	$scope.user = null;
	$scope.activityModal = null;
	$scope.pendingAction = false;
    $scope.viewData = {};
    $scope.viewData.selectedLocation = "";

	//Temporary for demo
	UserService.get('hgascoigne2', 'groups').then(function(response) {
		$scope.currentUser = response.data;
	});

	// $timeout(function() {
 //    	$scope.pendingAction = true;
	// 	$scope.showActivityModal();
	// }, 3000);

    $scope.groupLocations = {};

	//Wait till user loads
	$scope.$watch('currentUser', function(value, existingValue) {
		if(value !== null && existingValue === null) {
        	var user = ActivityService.user($scope.currentUser.uni_auth).$asObject();
        	user.$bindTo($scope, 'user');
            $scope.activities = ActivityService.userActivities($scope.currentUser.uni_auth).$asArray();
            $scope.startRangingBeacons();

            //Get a list of locations for the groups that the user belongs to
            for (var i = 0; i < $scope.currentUser.groups.length; i++) {
                $scope.groupLocations[$scope.currentUser.groups[i].id] = LocationService.groupLocations($scope.currentUser.groups[i].id).$asArray();
            }
        }
    });

    // Create the login modal that we will use later
	$ionicModal.fromTemplateUrl('templates/activity-action.html', {
		scope: $scope
	}).then(function(modal) {
		$scope.activityModal = modal;
	});

    //If a change is detected, fire a notification and show the activity modal
    $scope.locationChangeDetected = function(region, fireNotification) {
        fireNotification = fireNotification || true;

        var locationByUUID = LocationService.getByUUID(region.uuid).$asArray();
        locationByUUID.$loaded().then(function(location) {
            $scope.viewData.selectedLocation = location[0].$id;
        });

        if(fireNotification) {
            //Show notification
            $cordovaLocalNotification.add({
              id: "id" + Date.now(),
              title: "You're on the move!",
              data: region
              // parameter documentation:
              // https://github.com/katzer/cordova-plugin-local-notifications#further-informations-1
            }).then(function () {
              console.log('Notification fired!');
            });
        }

        $scope.pendingAction = true;
        $scope.showActivityModal();
    };

    $rootScope.$on("$cordovaLocalNotification:clicked", function(e,notification) {
        $scope.locationChangeDetected(notification.data, false); //show dialog, don't fire notification
    });

    //Show the activity selection modal
	$scope.showActivityModal = function() {
		$scope.activityModal.show();
		$cordovaStatusbar.styleColor('black');
	};

    //Hides the activity selection modal
	$scope.closeActivityModal = function() {
		$scope.activityModal.hide();
		$cordovaStatusbar.styleColor('white');
	};

    /**
     * Starts listening for beacons in range
     * @param  object region
     */
    $scope.startRangingBeacons = function(region) {
    	region = region || { uuid: '0212AC53-D5EE-4367-BF84-40A220B5703A' };

        estimote.beacons.startMonitoringForRegion(region, function(response) {
            console.log(response, response.state);
            $scope.activeUUID = response;

            if(response.state === "inside")
                $scope.locationChangeDetected(response);
        }, function(error) {
            console.log(error);
        });
    };

    $scope.coming = function() {
        console.log("Local", $scope.viewData.selectedLocation);
    	$scope.pendingAction = false;
        //Grab the metadata for the currently selected location
        LocationService.get($scope.viewData.selectedLocation).$asObject().$loaded().then(function(location) {
            //Define activity
            var activity = {
                created_at: moment().format(),
                location_id: $scope.viewData.selectedLocation,
                action: 1 //going
            };
            //Save to activity log
            ActivityService.add(activity, $scope.currentUser.uni_auth, location);
            //Close the modal
            $scope.closeActivityModal();
            //Show Notification

        });
    };

    $scope.going = function() {
    	$scope.pendingAction = false;
    	$scope.user.currently = "Out";
        //Grab the metadata for the currently selected location
        LocationService.get($scope.viewData.selectedLocation).$asObject().$loaded().then(function(location) {
            //Define activity
            var activity = {
                created_at: moment().format(),
                location_id: $scope.viewData.selectedLocation,
                action: 0 //leaving
            };
        	//Save to activity log
        	ActivityService.add(activity, $scope.currentUser.uni_auth, location);
        	//Close the modal
        	$scope.closeActivityModal();
        });
    };

    $scope.disregard = function() {
    	$scope.pendingAction = false;
    	//Close the modal
    	$scope.closeActivityModal();
    };
});