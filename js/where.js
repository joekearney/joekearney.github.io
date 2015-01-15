//var locations = ['London, UK', 'Dubai, United Arab Emirates', 'Hong Kong', 'Singapore', 'Sydney, Australia', 'Canberra, Australia', 'Melbourne, Australia', 'Adelaide, Australia'];
var locations = [];
var dates = [];
var flickrLinks = [];
var markers = {};
var infoWindows = {};

function parseHistory(historyText) {
  var lines = historyText.split(/\r?\n/);
  var lineNum = 1;
  var now = moment();
  lines.forEach(function(line) {
    if (line.length > 0 && line.charAt(0) != '#') {
      var matches = line.match(/(.*)[|](.*)[|](.*)/);
      var day = moment(matches[1], 'YYYY-MM-DD');
      var place = matches[2];
      var flickrLink = matches[3];

      if (day.isBefore(now)) {
        // note these come in order in the file
        locations.push(place);
        dates.push(day);
        flickrLinks.push(flickrLink); // these might be empty if no link
      }
    }
  });

  numLocations = locations.length;

  google.maps.event.addDomListener(window, 'load', addAddresses(locations));
}

var numLocations;

var map;
var points = {};
var pointsFound = 0;
var polyline;

function onComplete() {
  var pathElements = [];
  locations.forEach(function(v) { pathElements.push(points[v]); });
  polyline = new google.maps.Polyline({
    path: pathElements,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });
  polyline.setMap(map);

  var bounds = new google.maps.LatLngBounds();
  locations.slice(Math.max(locations.length - 4, 0)).forEach(function(a) {
    bounds.extend(points[a]);
  });
  map.fitBounds(bounds);

  var latestFlickrLink = "";
  for (var i = flickrLinks.length; i-- > 0 && latestFlickrLink.length == 0; ) {
    latestFlickrLink = flickrLinks[i];
    console.log(latestFlickrLink);
  }
  document.getElementById("flickr-canvas").src = latestFlickrLink;
}

function addAddresses(addresses) {
  function addMarker(map, results, addressIndex) {
    // note these don't come in any particular order

    var marker = new google.maps.Marker({
      map: map,
      position: results[0].geometry.location,
      title: results[0].formatted_address
    });

    var address = addresses[addressIndex];
    markers[addressIndex] = marker;

    points[address] = results[0].geometry.location;
    pointsFound++;

    var infoboxContentString =  '<div id="infowindow-content">' +
                                  '<h2 id="firstHeading" class="firstHeading">' + addresses[addressIndex] + '</h2>'+
                                  '<p>Arrived ' + dates[addressIndex].format('ddd MMM Do, YYYY') + '</p>' +
                                '</div>';

    var infoWindow = new google.maps.InfoWindow({
        content: infoboxContentString,
        maxWidth: 320
    });
    infoWindows[addressIndex] = infoWindow;

    google.maps.event.addListener(marker, 'click', function() {
      // close all others
      for (var i = 0; i < numLocations; i++) {
        infoWindows[i].close(map, markers[i]);
      }

      infoWindow.open(map, marker);

      var flickrLink = flickrLinks[addressIndex];
      var flickrIframe = document.getElementById("flickr-canvas");
      if (flickrIframe.src != flickrLink && flickrLink.length != 0) {
        flickrIframe.src = flickrLink;
      }
    });

    if (pointsFound == numLocations) {
      onComplete();
    }
  }
  function addAddress(geocoder, addressIndex) {
    geocoder.geocode({
        'address': addresses[addressIndex]
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          addMarker(map, results, addressIndex);
        } else {
          console.log("Failed to geocode address " + addresses[addressIndex]);
        }
      });
  }

  geocoder = new google.maps.Geocoder();
  var latestPlaceIndex = addresses.length - 1;

  var currentLocation = addresses[latestPlaceIndex];

  document.getElementById('current-location-text').innerHTML = currentLocation;
  document.getElementById('current-location-arrival').innerHTML = dates[latestPlaceIndex].format('dddd MMMM Do, YYYY');

  geocoder.geocode({
      address: currentLocation
    }, function(results, status) {
      var canvas = document.getElementById('map-canvas');
      if (status == google.maps.GeocoderStatus.OK) {
        var mapOptions = {
          zoom: 18,
          center: results[0].geometry.location
        }
        map = new google.maps.Map(canvas, mapOptions);
        addMarker(map, results, latestPlaceIndex);

        for (var i = addresses.length - 2; i >= 0; --i) {
          addAddress(geocoder, i);
        }
      } else {
        console.log("Failed to geocode address " + addresses[latestPlaceIndex]);
      }
    }
  );
}

if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      parseHistory(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET", "/assets/where.txt?t=" + Math.random(), true); // add random to disable caching
  xmlhttp.send();
} else {
  alert("Sorry, your browser isn't support for tracking our travels. Upgrade!");
}
