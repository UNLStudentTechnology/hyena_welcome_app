'use strict';
angular.module("hyenaTimeclocks")
	.filter('estimote_color', function () {
		return function (input) {
			switch (input) {
				case 1 :
					return "Mint";
				case 2 :
					return "Ice";
				case 3 :
					return "Blueberry";
				default :
					return "N/A";
			}
		};
	})

	.filter('toFixed', function () {
		return function (input, numDecimals) {
			return input.toFixed(numDecimals);
		};
	});