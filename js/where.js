function WherePage(locationsCsvUrl, locationsTimelineUrl, numberOfPointsToShowOnMap) {
  this.locationsCsvUrl = locationsCsvUrl;
  this.locationsTimelineUrl = locationsTimelineUrl;
  if (!numberOfPointsToShowOnMap) {
    numberOfPointsToShowOnMap = 10000;
  }
  this.numberOfPointsToShowOnMap = numberOfPointsToShowOnMap;

  // static lag/longs for the places we're going, one per entry in locations file.
  // This data was acquired from the Google Maps API geocoder and is only used with the API.
  this.latLngs = {};

  // stuff per entry in locations timeline
  this.locations = [];
  this.dates = [];
  this.statuses = [];
  this.flickrLinks = [];

  this.currentLocationIndex = 0;

  // stuff per location, where location is from where.txt
  this.markers = {};
  this.infoWindows = {};
  this.lastDateAtLocation = {};

  this.latLngsReady = false;
  this.historyReady = false;
  this.allowMapScroll = true;

  this.notifyFileLoaded = function(component) {
    console.debug("Finished loading " + component);
    if (this.latLngsReady && this.historyReady) {
      var self = this;
      console.debug("Loading Google Maps...");
      self.addAddresses(self.locations);
    }
  }

  this.parseLocations = function(locationsText) {
    var lines = locationsText.split(/\r?\n/);
    var self = this;

    lines.forEach(function(line) {
      if (line.length > 0 && line.charAt(0) != '#') {
        var lineComponents = line.split('|');
        if (lineComponents.length != 3) {
          alert("Bad location entry: " + line);
        } else {
          var name = lineComponents[0];
          var lat = lineComponents[1];
          var long = lineComponents[2];
          var latLng = new google.maps.LatLng(lat,long);
          self.latLngs[name] = latLng;
        }
      }
    });

    this.latLngsReady = true;
    this.notifyFileLoaded("locations");
  }

  // parse out the lines of where.txt,
  this.parseTimeline = function(timelineText) {
    var lines = timelineText.split(/\r?\n/);
    var lineNum = 1;
    var self = this;

    lines.forEach(function(line) {
      if (line.length > 0 && line.charAt(0) != '#') {
        var matches = line.match(/(.*)[|](.*)[|](.*)[|](.*)/);
        var day = moment(matches[1], 'YYYY-MM-DD');
        var place = matches[2];
        var status = matches[3];
        var flickrLink = matches[4];

        self.locations.push(place);
        self.dates.push(day);
        self.statuses.push(status);
        self.flickrLinks.push(flickrLink); // these might be empty if no link
        self.lastDateAtLocation[place] = day;
      }
    });

    this.numLocations = this.locations.length;

    if (this.numLocations > 0) {
      this.currentLocationIndex = 0;
      while (this.currentLocationIndex+1 < this.numLocations && this.statuses[this.currentLocationIndex+1] == 'arrived') {
        this.currentLocationIndex++;
      }

      var currentLocation = this.locations[this.currentLocationIndex];
      var currLocationTextBox = document.getElementById('current-location-text');
      if (currLocationTextBox != null) {
        currLocationTextBox.innerHTML = currentLocation;
      }
      var currArrivalTextBox = document.getElementById('current-location-arrival');
      if (currArrivalTextBox != null) {
        currArrivalTextBox.innerHTML = this.dates[this.currentLocationIndex].format('dddd MMMM Do, YYYY');
      }
    }

    this.historyReady = true;
    this.notifyFileLoaded("history");
  }

  this.numLocations;

  // the actual map object
  this.map;

  this.polylineUntilNow;
  this.polylineAfterNow;

  this.setFlickrLinkForIndex = function(addressIndex) {
    if (addressIndex >= 0) {
      var flickrLink = flickrLinks[addressIndex];
      var flickrIframe = document.getElementById("flickr-canvas");
      if (flickrIframe.src != flickrLink && flickrLink.length != 0) {
        flickrIframe.src = flickrLink;
      }
    } else {
      flickrIframe.src = '';
    }
  }
  this.setFlickrLinkFor = function(placeName) {
    var addressIndex = locations.slice(0, this.currentLocationIndex+1).lastIndexOf(placeName);
    this.setFlickrLinkForIndex(addressIndex);
  }

  this.onAllMapMarkersSetUp = function() {
    var self = this;
    function setUpMapPolylines() {
      console.debug("Setting up map polylines...");
      // set up the polylineUntilNow to trace the route up to now
      var pathElements = [];
      self.locations.forEach(function(v) { if (self.latLngs[v]) { pathElements.push(self.latLngs[v]); } else {
        console.log("Not found latLng for " + v);
      } });

      var locationsUntilNow = pathElements.slice(0, self.currentLocationIndex + 1);
      // locationsAfterNow[0] is the current location, so that the polylines join
      var locationsAfterNow = pathElements.slice(self.currentLocationIndex);

      self.polylineUntilNow = new google.maps.Polyline({
        path: locationsUntilNow,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      self.polylineUntilNow.setMap(self.map);

      // Define a symbol using SVG path notation, with an opacity of 1.
      var dashedLineSymbol = {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeWeight: 2,
        scale: 4
      };

      self.polylineAfterNow = new google.maps.Polyline({
        path: locationsAfterNow,
        geodesic: true,
        strokeColor: '#0000FF',
        strokeWeight: 0,
        icons: [{
          icon: dashedLineSymbol,
          offset: '0',
          repeat: '20px'
        }]
      });
      self.polylineAfterNow.setMap(self.map);

      // make sure that the map contains the last four items on the polylineUntilNow
      var bounds = new google.maps.LatLngBounds();
      locationsUntilNow.slice(Math.max(locationsUntilNow.length - numberOfPointsToShowOnMap, 0)).forEach(function(a) {
        bounds.extend(a);
      });
      // add the next location if there aren't many up to now
      if (locationsUntilNow.length < 3 && locationsAfterNow.length > 1) {
        bounds.extend(locationsAfterNow[1]);
      }
      self.map.fitBounds(bounds);
    }

    function setUpFlickr() {
      console.debug("Setting up flickr canvas...");
      var flickrCanvas = document.getElementById("flickr-canvas");
      if (flickrCanvas != null) {
        // find the latest non-empty flickr link
        var latestFlickrLink = "";
        for (var i = self.flickrLinks.length; i-- > 0 && latestFlickrLink.length == 0; ) {
          latestFlickrLink = self.flickrLinks[i];
        }
        document.getElementById("flickr-canvas").src = latestFlickrLink;
      }
    }

    function setUpMapMarkers() {
      console.debug("Setting up map markers...");
      function markerClick(m, ms) {
        // close all others
        for (var place2 in ms) {
          var iw = self.infoWindows[place2];
          if (iw) {
            iw.close(map, ms[place2]);
          }
        }

        var placeForMarker = m.title;

        var iwToOpen = self.infoWindows[placeForMarker];
        if (iwToOpen) {
          iwToOpen.open(map, m);
          setFlickrLinkFor(placeForMarker);
        } else {
          console.log("Found no infoWindow for " + placeForMarker);
        }
      }

      function setUpInfoBox(placeForMarker, markerForInfoBox) {
        function indexesOf(place) {
          var indexes = [];
          for (var i = 0; i < self.locations.length; i++) {
            if (self.locations[i] == place) {
              indexes.push(i);
            }
          }
          return indexes;
        }
        function toList(is) {
          function flickrLinkOrEmpty(i) {
            if (self.flickrLinks[i].length > 0) {
              return " (<a href='javascript:setFlickrLinkForIndex(" + i + ")'>photos</a>)";
            } else {
              return "";
            }
          }
          var listString = "";
          var now = moment();
          is.forEach(function(i) {
            // Arrived ' + lastDateAtLocation[place].format('ddd MMM Do, YYYY')
            var current = false;
            if (self.dates[i].isBefore(now) && (i + 1 == self.dates.length || self.dates[i+1].isAfter(now))) {
              current = true;
            }
            var itemString = "";

            if (current) {
              itemString += "<b>";
            }

            itemString += self.dates[i].format('ddd MMM Do, YYYY');

            if (i + 1 < self.dates.length) {
              itemString += " to " + self.dates[i+1].format('ddd MMM Do, YYYY')
            }

            if (current) {
              itemString += "</b>";
            }

            itemString += flickrLinkOrEmpty(i);

            listString += "<li>" + itemString + "</li>";
          });
          return listString;
        }
        var infoboxContentString =  '<div id="infowindow-content">' +
                                      '<h2 id="firstHeading" class="firstHeading">' + place + '</h2>'+
                                      '<ul>' + toList(indexesOf(place)) + '</ul>'
                                    '</div>';

        var infoWindow = new google.maps.InfoWindow({
            content: infoboxContentString,
            maxWidth: 500
        });
        self.infoWindows[place] = infoWindow;
      }
      // have to do this through a closure to capture one value of marker! WAT!
      function attachMarkerClickListener(m) {
        google.maps.event.addListener(m, 'click', function() {
          markerClick(m, markers);
        });
      }

      // get the latest marker for each location, attach to the infobox and the map
      for (var place in self.markers) {
        var marker = self.markers[place];
        setUpInfoBox(place, marker);
        attachMarkerClickListener(marker);
      }
    }

    function setUpTime() {
      function parseTime(timeObj, targetElement) {
        if (timeObj.status == "OK") {
          var offset = timeObj.dstOffset + timeObj.rawOffset;
          window.setInterval(function() {
            document.getElementById(targetElement).innerHTML = moment.utc().add(offset, 's').format("HH:mm a, dddd")
          }, 1000);
        } else {
          console.error("Failed to load time from Google Time API: " + timeObj.status);
        }
      }

      function requestTime(location, targetElement) {
        if (window.XMLHttpRequest) {
          var timeRequest = new XMLHttpRequest();
          timeRequest.onreadystatechange = function() {
            if (timeRequest.readyState == 4 && timeRequest.status == 200) {
              parseTime(JSON.parse(timeRequest.responseText), targetElement);
            }
          }
          var requestUrl = "https://maps.googleapis.com/maps/api/timezone/json?key=AIzaSyARro1ojL1tMxwDIYlRiBGOFShRBSl0kBo"
                            + "&location=" + location.toUrlValue()
                            + "&timestamp=" + moment.utc().unix();
          timeRequest.open("GET", requestUrl);
          timeRequest.send();
        } else {
          alert("Sorry, your browser can't support tracking our travels. Upgrade!");
        }
      }

      if (document.getElementById("current-time-text") != null) {
        requestTime(self.latLngs[self.locations[self.currentLocationIndex]], "current-time-text");
      }
      if (document.getElementById("current-time-london") != null) {
        requestTime(self.latLngs["London, UK"], "current-time-london");
      }
    }

    setUpFlickr();
    setUpMapMarkers();
    setUpMapPolylines();
    setUpTime();
  }

  this.addAddresses = function(addresses) {
    console.debug("Adding locations to the map...");
    // number of places processed
    var markersSetUpCount = 0;
    var self = this;

    function addMarker(map, latLng, addressIndex) {
      // note these don't come in any particular order
      var address = addresses[addressIndex];

      if (self.markers[address]) {
      } else {
        // TODO
        var pin = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

        // home different colour
        if (address.indexOf('London') >= 0) {
          pin = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
        var marker = new google.maps.Marker({
          map: map,
          icon: pin,
          position: latLng,
          title: address
        });

        self.markers[address] = marker;
      }

      markersSetUpCount++;

      if (markersSetUpCount == self.numLocations) {
        self.onAllMapMarkersSetUp();
      } else if (markersSetUpCount > self.numLocations) {
        console.error("addMarker called too many times");
      }
    }
    function addAddress(geocoder, addressIndex) {
      var address = addresses[addressIndex];
      if (self.latLngs[address]) {
        addMarker(self.map, self.latLngs[address], addressIndex);
      } else {
        geocoder.geocode({
            'address': addresses[addressIndex]
          }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              var latLng = results[0].geometry.location;
              self.latLngs[address] = latLng;
              console.log("latLngs[\"" + address + "\"] = new google.maps.LatLng(" + latLng.toUrlValue() + ");");
              addMarker(self.map, latLng, addressIndex);
            } else {
              console.error("Failed to geocode address " + addresses[addressIndex] + " status: " + status);
            }
          });
      }
    }

    this.geocoder = new google.maps.Geocoder();
    var currentLocation = addresses[this.currentLocationIndex];

    if (this.latLngs[currentLocation]) {
      var canvas = document.getElementById('map-canvas');
      var mapOptions = {
        zoom: 10,
        center: this.latLngs[currentLocation],
        scrollwheel: this.allowMapScroll
      }
      this.map = new google.maps.Map(canvas, mapOptions);

      for (var i = addresses.length - 1; i >= 0; --i) {
        addAddress(this.geocoder, i);
      }
    } else {
      this.geocoder.geocode({
          address: currentLocation
        }, function(results, status) {
          var canvas = document.getElementById('map-canvas');
          if (status == google.maps.GeocoderStatus.OK) {
            var mapOptions = {
              zoom: 18,
              center: results[0].geometry.location
            }
            this.map = new google.maps.Map(canvas, mapOptions);

            var latLng = results[0].geometry.location;
            if (!latLng) {
              console.log("Failed to find latLng for " + currentLocation);
            }
            this.latLngs[this.currentLocation] = latLng;
            console.log("latLngs[\"" + this.currentLocation + "\"] = new google.maps.LatLng(" + latLng.toUrlValue() + ");");
            addMarker(this.map, latLng, this.currentLocationIndex);

            for (var i = addresses.length - 1; i >= 0; --i) {
              addAddress(this.geocoder, i);
            }
          } else {
            console.error("Failed to geocode address " + this.currentLocation);
          }
        }
      );
    }
  }

  function loadFileForFunction(url, functionOnComplete, forceNoCache) {
    forceNoCache = forceNoCache || true;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
      var fileRequest = new XMLHttpRequest();
      fileRequest.onreadystatechange = function() {
        if (fileRequest.readyState == 4 && fileRequest.status == 200) {
          functionOnComplete(fileRequest.responseText);
        }
      }
      var urlToUse;
      if (forceNoCache) {
        urlToUse = url + "?t=" + Math.random();
      } else {
        urlToUse = url;
      }
      fileRequest.open("GET", urlToUse);
      fileRequest.send();
    } else {
      alert("Sorry, your browser can't support tracking our travels. Upgrade!");
    }
  }

  this.start = function() {
    var self = this;
    google.maps.event.addDomListener(window, "load", function() {
      loadFileForFunction(locationsCsvUrl, function(text) {self.parseLocations(text)});
    });
    google.maps.event.addDomListener(window, "load", function() {
      loadFileForFunction(locationsTimelineUrl, function(text) {self.parseTimeline(text)});
    });
  }

  this.disableMapScroll = function() {
    this.allowMapScroll = false;
    if (this.mao) {
      this.map.scrollwheel = false;
    }
  }
}

function loadWherePage(locationsCsvUrl, locationsTimelineUrl, numberOfPointsToShowOnMap) {
  var wherePage = new WherePage(locationsCsvUrl, locationsTimelineUrl, numberOfPointsToShowOnMap);
  wherePage.start();
}
