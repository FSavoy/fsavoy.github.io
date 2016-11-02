var app = angular.module('sfFilming', []);

app.controller('moviesCtrl', function($scope, $http) {
	$scope.sucessful = false;
	$scope.infoText = "Loading...";	
	$scope.selected = null;
	$scope.searchQuery = "";
	
	$scope.movies = []; // Stores all the movies instances
	$scope.locations = []; // Stores all the locations
	$scope.locationsMoviesIdx = []; // Stores the movies indexes corresponding to the locations
	$scope.markers = [];
	
	$scope.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 11,
		center: {lat: 37.80, lng: -122.33},
	});
	
	// The marker image when not selected
	$scope.markerImg = {
   	url: 'http://maps.google.com/mapfiles/ms/micons/grey.png',
      scaledSize: new google.maps.Size(20, 20)
   };
   
   // The marker image when selected
   $scope.markerImgSelected = {
   	url: 'http://maps.google.com/mapfiles/ms/micons/blue.png',
      scaledSize: new google.maps.Size(32, 32),
      labelOrigin: new google.maps.Point(16,10)
   };

	
	$http.get("https://data.sfgov.org/resource/wwmu-gmzc.json")
	.then(function(response) {
		var retrieved = response.data;
		retrieved.sort(function(a, b) {
			return [a.title, a.release_year].join().localeCompare([b.title, b.release_year].join());
		});
		
		//Merging same movies with several locations and associated fun facts
		var itMovies = 0;
		for (var i = 0; i< retrieved.length; i++) {
			var elem = retrieved[i];
			if(elem.locations != null){
				var locIdx = $scope.locations.indexOf(elem.locations);
				if (locIdx == -1) {
					$scope.locations.push(elem.locations);
					$scope.locationsMoviesIdx.push([itMovies]);
					locIdx = $scope.locations.length - 1;
				} else {
					$scope.locationsMoviesIdx[locIdx].push(itMovies);
				}
			}
			
			if(i == 0 || elem.title != $scope.movies[itMovies -1].title || elem.release_year != $scope.movies[itMovies -1].release_year){
				elem.index = itMovies;
				if(elem.locations != null){
					elem.locations = [elem.locations];
					elem.locationsIdx = [locIdx];
					elem.fun_facts = [elem.fun_facts];
				} else {
					elem.locations = [];
					elem.locationsIdx = [];
					elem.fun_facts = [];
				}
				$scope.movies.push(elem);
				itMovies = itMovies + 1;
			} else if(elem.locations != null) {
				$scope.movies[itMovies -1].locations.push(elem.locations);
				$scope.movies[itMovies -1].locationsIdx.push(locIdx);
				$scope.movies[itMovies -1].fun_facts.push(elem.fun_facts);
			}
		}
		
		for (var i = 0; i < $scope.locations.length; i++){
			var marker = new google.maps.Marker({
    			position: {lat: 37.80 + 0.3*Math.random()-0.15, lng: -122.33 + 0.7*Math.random()-0.35},
    			id: i,
    			map: $scope.map,
    			icon: $scope.markerImg,
    			title: $scope.locations[i]
  			});
  			
  			// Clicking on the marker searches for the movies at that location
  			google.maps.event.addListener(marker, 'click', (function(marker, i) {
        		return function() {
        			$scope.$apply(function() {
        				// Clicking a second time reinitializes the search
        				if($scope.searchQuery == $scope.markers[i].getTitle()){
        					$scope.searchQuery = "";
        				} else {
        					$scope.searchQuery = $scope.markers[i].getTitle();
        				}
					});
        		}
      	})(marker, i));

			$scope.markers.push(marker);
		}
		
		$scope.sucessful = true;
		$scope.infoText = "Sucess";
		$scope.selected = 0;
		
		
	}, function(response) {
		$scope.infoText = "Error loading data: " + response.statusText;
	});
	
	// Changing colors and numbers of markers when a movie is selected
	$scope.$watch('selected',function(newVal,oldVal){

		if (oldVal != null){
			var selectedMovieLocs = $scope.movies[oldVal].locationsIdx;
			for (var m = 0; m < selectedMovieLocs.length; m++){
				var locIdx = selectedMovieLocs[m];
				$scope.markers[locIdx].setLabel(null);
				$scope.markers[locIdx].setIcon($scope.markerImg);
			}
		}
		
		if (newVal != null){
			var selectedMovieLocs = $scope.movies[newVal].locationsIdx;
			for (var m = 0; m < selectedMovieLocs.length; m++){
				var locIdx = selectedMovieLocs[m];
				if(m+1 < 10){
					var markerLabel = {
   					fontSize: '14',
   					text: (m+1).toString()
   				}
				} else {
					var markerLabel = {
   					fontSize: '12',
   					text: (m+1).toString()
   				}
				}
				$scope.markers[locIdx].setLabel(markerLabel);
				$scope.markers[locIdx].setIcon($scope.markerImgSelected);
			}
		}
	});
    
	$scope.click = function(index){
		if($scope.selected == index){
			$scope.selected = null;
		} else {
			$scope.selected = index;
		}
	};
    
	$scope.filterFct = function(m){
		if ($scope.searchQuery.length < 2){
			return true;
		}
    	 	
		var concatElems = [m.title, m.locations.join(), m.release_year, m.production_company, m.distributor, m.director, m.writer, m.actor_1, m.actor_2, m.actor_3].join().toLowerCase();
		if (concatElems.indexOf($scope.searchQuery.toLowerCase()) == -1){
			return false;
		} else {
			return true;
		}
	};
});
