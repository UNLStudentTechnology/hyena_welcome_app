'use strict';

/**
 * @ngdoc service
 * @name hyenaWelcomeApp.ngEstimote
 * @description
 * # ngEstimote
 * AngularJS wrapper for the Estimote cordova plugin.
 */
angular.module('hyenaWelcomeApp')
  .service('ngEstimote', function ($q) {
    
    var EstimoteService =  {

    	startMonitoringForRegion: function startMonitoringForRegion(region) {
    		var deferred = $q.defer();
            region = region || {};

    		estimote.beacons.startMonitoringForRegion(region,
    			function(response) {
    				deferred.resolve(response);
    			}, function(error) {
    				deferred.reject(error);
    			});

    		return deferred.promise;
    	},

    	stopMonitoringForRegion: function stopMonitoringForRegion(region) {
    		var deferred = $q.defer();
            region = region || {};

    		estimote.beacons.stopMonitoringForRegion(region,
    			function(response) {
    				deferred.resolve(response);
    			}, function(error) {
    				deferred.reject(error);
    			});

    		return deferred.promise;
    	}

    };

    return EstimoteService;
  });
