'use strict';

/**
 * @ngdoc service
 * @name hyenaWelcomeApp.ActivityService
 * @description
 * # ActivityService
 * Service in the hyenaWelcomeApp.
 */
angular.module('hyenaWelcomeApp')
  .service('ActivityService', function ($firebase, $q, AppFirebase) {
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
  });