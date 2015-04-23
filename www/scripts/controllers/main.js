/* global moment */
'use strict';

angular.module('hyenaWelcomeApp')
.controller('MainCtrl', function ($scope, $rootScope, $localStorage, $ionicModal, $timeout, $cordovaLocalNotification, $cordovaStatusbar, ActivityService, AuthService, ngEstimote, UserService, LocationService) {
	//Declare Variables
    $scope.activities = null;
	$scope.user = null;
	$scope.activityModal = null;
	$scope.pendingAction = false;
    $scope.viewData = {
        selectedLocation:   "",
        activeGroupId:      parseInt($localStorage.activeGroupId) || 0,
        dataLoaded:         false,
        isMonitoring:       !!$localStorage.isMonitoring,
        activeGroup:        {},
        groupLocations:     {}
    };

	//Temporary for demo
	UserService.get('hgascoigne2', 'groups').then(function(response) {
		$scope.currentUser = response.data;
	});
     
	//Wait till user loads, then do some stuff
	$scope.$watch('currentUser', function(value, existingValue) {
		if(value !== null && existingValue === null) {
            if($scope.viewData.activeGroupId === 0)
                $scope.viewData.activeGroupId = $localStorage.activeGroupId = $scope.currentUser.groups[0].id;

            var user = ActivityService.user($scope.currentUser.uni_auth).$asObject();
            user.$bindTo($scope, 'user');
            $scope.activities = ActivityService.userActivities($scope.currentUser.uni_auth, $scope.viewData.activeGroupId).$asArray();

            //Pull down the active group's metadata from Firebase, load its proximity UUID and begin looking for beacons
            $scope.viewData.activeGroup = LocationService.getGroup($scope.viewData.activeGroupId).$asObject();
            $scope.viewData.activeGroup.$loaded().then(function(group) {
                //Start Monitoring for beacons
                if(angular.isUndefined($localStorage.isMonitoring) || !!$localStorage.isMonitoring)
                    $scope.startMonitoringRegion({ uuid: group.proximity_uuid });
            });


            //Get a list of locations for the groups that the user belongs to
            for (var i = 0; i < $scope.currentUser.groups.length; i++) {
                $scope.viewData.groupLocations[$scope.currentUser.groups[i].id] = LocationService.groupLocations($scope.currentUser.groups[i].id).$asObject();
            }

            $scope.viewData.dataLoaded = true;
        }
    });

    // Create the login modal that we will use later
	$ionicModal.fromTemplateUrl('templates/activity-action.html', {
		scope: $scope
	}).then(function(modal) {
		$scope.activityModal = modal;
	});

    $scope.updateGroupData = function() {
        $scope.viewData.dataLoaded = false;
        //Stop monitoring current group
        if($scope.viewData.isMonitoring)
            $scope.stopMonitoringRegion({ uuid: $scope.viewData.activeGroup.proximity_uuid });

        //Change to new group
        $localStorage.activeGroupId = $scope.viewData.activeGroupId;
        $scope.activities = ActivityService.userActivities($scope.currentUser.uni_auth, $scope.viewData.activeGroupId).$asArray();
        $scope.activities.$loaded().then(function(activities) {
            $scope.viewData.dataLoaded = true;
        });
        $scope.viewData.activeGroup = LocationService.getGroup($localStorage.activeGroupId).$asObject();
    };

    //If a change in region state is detected, fire a notification and show the activity modal
    $scope.locationChangeDetected = function(region, fireNotification) {
        fireNotification = fireNotification || true;

        if(region.state === "inside")
            $scope.startRangingBeacons({uuid:region.uuid}, region);
        else if (region.state === "outside")
            $scope.going();

        // $scope.pendingAction = true;
        // $scope.showActivityModal();
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
     * @param  object region defined per group
     */
    $scope.startMonitoringRegion = function(region) {
    	region = region || {};

        estimote.beacons.startMonitoringForRegion(region, function(response) {
            //Debug
            console.log(response);
            $scope.activeUUID = response;
            //Fire location change
            $scope.locationChangeDetected(response);
        }, function(error) {
            console.log(error);
        });
        $scope.viewData.isMonitoring = $localStorage.isMonitoring = true;
    };

    /**
     * Stop listening for beacons in range
     * @param  object region defined per group
     */
    $scope.stopMonitoringRegion = function(region) {
        region = region || {};

        estimote.beacons.stopMonitoringForRegion(region, function(response) {
            console.log('Stopped monitoring region');
        }, function(error) {
            console.log(error);
        });
        $scope.viewData.isMonitoring = $localStorage.isMonitoring = false;
    };

    $scope.startRangingBeacons = function(region, regionMetadata) {
        region = region || {};

        estimote.beacons.startRangingBeaconsInRegion(region, function(response) {
            if(response.beacons.length > 0) {
                // Sort beacons by distance.
                response.beacons.sort(function(beacon1, beacon2) {
                    return beacon1.distance > beacon2.distance;
                });

                // Log distance for the closest beacon.
                var activeBeacon = response.beacons[0];

                console.log(activeBeacon);

                var locationByMajor = LocationService.getByMajor(activeBeacon.major).$asArray();
                locationByMajor.$loaded().then(function(location) {

                    $scope.viewData.selectedLocation = location[0].$id;

                    //Go add an activity to the log
                    if(regionMetadata.state === "inside")
                        $scope.coming();
                });
            }

            $scope.stopRangingBeacons(region);
        }, function(error) {
            console.log(error);
        });
    };

    $scope.stopRangingBeacons = function(region) {
        region = region || {};

        estimote.beacons.stopRangingBeaconsInRegion(region, function(response) {
            console.log('Stopped ranging in region');
        }, function(error) {
            console.log(error);
        });
    };

    /**
     * Fired when a user is entering a location
     * @return null
     */
    $scope.coming = function() {
    	$scope.pendingAction = false;
        //Grab the metadata for the currently selected location
        LocationService.get($scope.viewData.selectedLocation).$asObject().$loaded().then(function(location) {
            if(location.title === $scope.user.currently)
                return;

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
            $cordovaLocalNotification.add({
              id: "id" + Date.now(),
              title: "You've just entered "+location.title
              // parameter documentation:
              // https://github.com/katzer/cordova-plugin-local-notifications#further-informations-1
            }).then(function () {
              console.log('Notification fired!');
            });
        });
    };

    /**
     * Fired when a user is leaving a location
     * @return null
     */
    $scope.going = function() {
    	$scope.pendingAction = false;
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
            //Show Notification
            $cordovaLocalNotification.add({
              id: "id" + Date.now(),
              title: "You've just left "+location.title
              // parameter documentation:
              // https://github.com/katzer/cordova-plugin-local-notifications#further-informations-1
            }).then(function () {
              console.log('Notification fired!');
            });
        });
    };

    /**
     * Close the modal and silence any notifications
     * @return null
     */
    $scope.disregard = function() {
    	$scope.pendingAction = false;
    	//Close the modal
    	$scope.closeActivityModal();
    };
});