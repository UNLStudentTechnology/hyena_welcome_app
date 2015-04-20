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
		 * Adds a new welcome activity to the specified group and user
		 * @param object 	activity
		 * @param int 		userId
		 */
		add: function addActivity(activity, userId, location) {
    		return $firebase(activityRef.child('/users/'+userId+'/activities')).$push(activity).then(function(response) {
				//Add a reference to the group
				//If action = 1 (is at location), set as active location, else set false
				if(activity.action === 1) {
					$firebase(activityRef.child('/groups/'+location.group_id+'/users')).$set(userId, location.title);
					$firebase(activityRef.child('/users/'+userId)).$set('currently', location.title);
				}
				else {
					$firebase(activityRef.child('/groups/'+location.group_id+'/users')).$set(userId, false);
					$firebase(activityRef.child('/users/'+userId)).$set('currently', false);
				}

				return response;
	        });
    	},
    	user: function getUserStatus(userId) {
    		return $firebase(activityRef.child('users/'+userId));
    	}
    };

    return ActivityService;
  });