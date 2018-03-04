var map;

function initMap() {
    var us = {lat: 39.828, lng: -98.580};

    // initialize map
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: us
    });
}


(function () {
  'use strict';
  class Event {
    constructor(name, artistName, venue, latitude, longitude, city, state, date, time, url) {
      this.name = name;
      this.artistName = artistName;
      this.venue = venue;
      this.latitude = latitude;
      this.longitude = longitude;
      this.city = city;
      this.state = state;
      this.date = date;
      this.time = time;
      this.url = url;
    }
  }

  var ViewModel = function () {
    this.isLoggedIn = ko.observable(false);
    this.isSearch = ko.observable(false);
    this.login = function () {
      var self = this;
      this.loginErrorMessage(null);
      OAuthManager.obtainToken({
        scopes: [
          /*
            the permission for reading public playlists is granted
            automatically when obtaining an access token through
            the user login form
            */
          'user-read-private',
          'user-top-read'
        ]
      }).then(function (token) {
        onTokenReceived(token);
      }).catch(function (error) {
        self.loginError(error);
      });
    };

    this.logout = function () {
      localStorage.removeItem(accessTokenKey);
      this.isLoggedIn(false);
    };

    this.goback = function() {
      this.isSearch(false);
    }

    this.loginError = function (errorCode) {
      switch (errorCode) {
        case 'access_denied':
          this.loginErrorMessage('You need to grant access in order to use this website.');
          break;
        default:
          this.loginErrorMessage('There was an error trying to obtain authorization. Please, try it again later.');
      }
    };

    this.loginErrorMessage = ko.observable(null);

    this.user = ko.observable(null);

    this.artists = ko.observableArray([]);
    this.artistsSearch = ko.observableArray([]);

    this.GetArtistEvents = function () {
      var evArr = [];
      $.when($.getJSON('https://app.ticketmaster.com/discovery/v2/events.json?apikey=udQKQdhwkupacGyPtGOU8VHjAlXbM5xQ&countryCode=US&keyword=' + this.name)).done(function (json) {
        if (!json._embedded) {
          console.log("no concerts");
          clearMarkers();
        } else {
          var arr = json._embedded.events;
          for (var i in arr) {
            let event = new Event;
            event.name = arr[i].name;
            event.artistName = this.name;
            event.venue = arr[i]._embedded.venues[0].name;
            event.latitude = arr[i]._embedded.venues[0].location.latitude;
            event.longitude = arr[i]._embedded.venues[0].location.longitude;
            event.city = arr[i]._embedded.venues[0].city;
            event.state = arr[i]._embedded.venues[0].state.name;
            event.date = arr[i].dates.start.localDate;
            event.time = arr[i].dates.start.localTime;
            event.url = arr[i].url;
            evArr[i] = event;
          }
          console.log(evArr);
          if (evArr.length == 0){
            console.log(evArr.length);
          } else {
            console.log(evArr.length);
            kimTest(evArr);
          }
        }
      });
      return evArr;
    }
    var ccIndex = 1;
    var ccArr = ['lightgreen', 'lightsalmon', 'gold', 'thistle', 'moccasin'];
    this.changeColorScheme = function () {
      $("body").css("background-color", ccArr[ccIndex]);
      ccIndex++;
      if (ccIndex == ccArr.length) ccIndex = 0;
    }

    this.searchSpotify = function () {
      var searchValue = document.getElementById("query").value;
      spotifyApi.searchArtists(searchValue, { limit: 10 }).then(function (artists) {
        viewModel.artistsSearch(artists.artists.items);
        viewModel.isSearch(true);
        console.log(artists.artists.items);
      });
    }

    var allMarkers = [];
    // ----------------- GOOGLE MAPS CODE ------------------
    function kimTest(arr){
      clearMarkers();

      allMarkers = [];

      //var allMarkers = [];
      var curWindows = [];
      var activeWindow;
      var windowOpen = false;

      for (var j=0; j<arr.length; j++){
        var pos = {
          lat: parseInt(arr[j].latitude),
          lng: parseInt(arr[j].longitude)
        };

        console.log(pos);

        allMarkers[j] = new google.maps.Marker({
          position: pos,
          map: map
        });
    
        var contentString = '<div>'+
        '<div>'+
        '</div>'+
        '<h4>'+ arr[j].name +'</h4>'+
        '<div>'+
        '<p>' + arr[j].name + ' at <b>' + arr[j].venue + '</b>' +
        ' in <b>' + arr[j].state + '</b>' +
        ' on <b>' + arr[j].date + ' @ ' + parseTime(arr[j].time) + '</b>.'+
        '<br><a href="' + arr[j].url + '">Buy Tickets</a>'
        '</p>'+
        '</div>'+
        '</div>';

        curWindows[j] = new google.maps.InfoWindow({
          content: contentString,
          maxWidth: '250'
        });

        google.maps.event.addListener(allMarkers[j], 'click', (function(marker, j) {
          return function() {
            if (!windowOpen){
              curWindows[j].open(map, allMarkers[j]);
              activeWindow = curWindows[j];
              windowOpen = true;
            } else {
              activeWindow.close();
              curWindows[j].open(map, allMarkers[j]);
              activeWindow = curWindows[j];
            }
          }
        })(allMarkers[j], j));

        allMarkers[j].setMap(map);
        allMarkers.push(allMarkers[j]);
      }
    }

    function clearMarkers(){
      for (var j=0; j<allMarkers.length; j++){
        allMarkers[j].setMap(null);
      }
    }

    function clearWindows(infoWindows){
      for (var j=0; j<allMarkers.length; j++){
        allMarkers[j].setMap(null);
      }
    }

    function parseTime(time){
      var hr = parseInt(time.substring(0, 2));
      console.log("hr:" + hr);
      var min = time.substring(3, 5);
      console.log("min:" + min);

      var timeOfDay = "AM";

      if (hr > 12){
        timeOfDay = "PM";
        hr -= 12;
      }
      if (hr == 12){
        timeOfDay = "PM";
      }
      
      return hr + ":" + min + " " + timeOfDay;
    }


  };

  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);



  var spotifyApi = new SpotifyWebApi(),
    accessTokenKey = 'sp-access-token';

  function onTokenReceived(token) {
    viewModel.isLoggedIn(true);
    localStorage.setItem(accessTokenKey, token);


    // do something with the token
    spotifyApi.setAccessToken(token);
    spotifyApi.getMe().then(function (data) {
      viewModel.user(data);

      spotifyApi.getMyTopArtists({ limit: 10 }).then(function (artists) {
        viewModel.artists(artists.items);
        /* Promise.all(artists.items.map(a => spotifyApi.getArtistTopTracks(a.id, "US").then(function (a) {
          console.log(a);
          viewModel.a(a.tracks);
        }))) */
      });
    });
  }

  /**
   * Uses the stored access token
   */
  function initAccessToken() {
    var storedAccessToken = localStorage.getItem(accessTokenKey);
    if (storedAccessToken) {
      onTokenReceived(storedAccessToken);
    }
  }

  initAccessToken();

})();