// stuff per line of where.txt
var locations = [];
var dates = [];
var flickrLinks = [];

// stuff per location, where location is from where.txt
var markers = {};
var infoWindows = {};
var lastDateAtLocation = {};

// parse out the lines of where.txt, 
function parseHistory(historyText) {
  var lines = historyText.split(/\r?\n/);
  var lineNum = 1;
  var now = moment();
  lines.forEach(function(line) {
    if (line.length > 0 && line.charAt(0) != '#') {
      console.log("Parsing " + line);
      var matches = line.match(/(.*)[|](.*)[|](.*)/);
      var day = moment(matches[1], 'YYYY-MM-DD');
      var place = matches[2];
      var flickrLink = matches[3];

      if (day.isBefore(now)) {
        // note these come in order in the file
        locations.push(place);
        dates.push(day);
        flickrLinks.push(flickrLink); // these might be empty if no link
        lastDateAtLocation[place] = day;
      }
    }
  });

  numLocations = locations.length;

  if (numLocations > 0) {
    var currentLocation = locations[locations.length - 1];
    document.getElementById('current-location-text').innerHTML = currentLocation;
    document.getElementById('current-location-arrival').innerHTML = dates[numLocations - 1].format('dddd MMMM Do, YYYY');
  }

  google.maps.event.addDomListener(window, 'load', addAddresses(locations));
}

var numLocations;

// the actual map object
var map;
// hash from location name to point
var points = {};
var polyline;

function setFlickrLinkFor(placeName) {
  var addressIndex = locations.lastIndexOf(placeName);
  console.log("Found addressIndex " + addressIndex + " for place " + placeName);
  if (addressIndex >= 0) {
    var flickrLink = flickrLinks[addressIndex];
    var flickrIframe = document.getElementById("flickr-canvas");
    if (flickrIframe.src != flickrLink && flickrLink.length != 0) {
      flickrIframe.src = flickrLink;
    } else {
      console.log("Found no flickr link for placeName " + placeName + " at index " + addressIndex);
    }
  } else {
    flickrIframe.src = '';
  }
}

function onComplete() {
  function setUpPolyline() {
    // set up the polyline to trace the route
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

    // make sure that the map contains the last four items on the polyline
    var bounds = new google.maps.LatLngBounds();
    locations.slice(Math.max(locations.length - 4, 0)).forEach(function(a) {
      bounds.extend(points[a]);
    });
    map.fitBounds(bounds);
  }

  function setUpFlickr() {
    // find the latest non-empty flickr link
    var latestFlickrLink = "";
    for (var i = flickrLinks.length; i-- > 0 && latestFlickrLink.length == 0; ) {
      latestFlickrLink = flickrLinks[i];
    }
    document.getElementById("flickr-canvas").src = latestFlickrLink;
  }


  function setUpMarkers() {
    function markerClick(m, ms) {
      // close all others
      for (var place2 in ms) {
        var iw = infoWindows[place2];
        if (iw) {
          iw.close(map, ms[place2]);
        }
      }

      var placeForMarker = m.title;

      var iwToOpen = infoWindows[placeForMarker];
      if (iwToOpen) {
        iwToOpen.open(map, m);
        setFlickrLinkFor(placeForMarker);
      } else {
        console.log("Found no infoWindow for " + placeForMarker);
      }
    }

    function setUpInfoBox(placeForMarker, markerForInfoBox) {
      var infoboxContentString =  '<div id="infowindow-content">' +
                                    '<h2 id="firstHeading" class="firstHeading">' + place + '</h2>'+
                                    '<p>Arrived ' + lastDateAtLocation[place].format('ddd MMM Do, YYYY') + '</p>' +
                                  '</div>';

      var infoWindow = new google.maps.InfoWindow({
          content: infoboxContentString,
          maxWidth: 300
      });
      infoWindows[place] = infoWindow;
    }
    function attachMarkerClickListener(m) {
      google.maps.event.addListener(m, 'click', function() {
        console.log("CLICK!!! on marker " + m + " with title " + m.title);
        markerClick(m, markers);
      });
    }

    // get the latest marker for each location, attach to the infobox and the map
    console.log("There are " + Object.keys(markers).length + " markers in the hash: " + markers);
    for (var place in markers) {
      var marker = markers[place];
      console.log("Creating infobox on marker with title " + marker.title + " at " + place);

      setUpInfoBox(place, marker);

      attachMarkerClickListener(marker);
    }
  }

  setUpPolyline();
  setUpFlickr();
  setUpMarkers();
}

function addAddresses(addresses) {
  // size of points hash
  var pointsFound = 0;

  function addMarker(map, results, addressIndex) {
    // note these don't come in any particular order

    var address = addresses[addressIndex];


    if (markers[address]) {
      console.log("Already have a marker for " + address);
    } else {
      console.log("Creating marker for " + address);
      var pin = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
      if (address.indexOf('London') >= 0) {
        pin = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      }
      var marker = new google.maps.Marker({
        map: map,
        icon: pin,
        position: results[0].geometry.location,
        title: address
      });

      console.log("Adding marker to the hash for address " + address);
      markers[address] = marker;
    }

    points[address] = results[0].geometry.location;
    pointsFound++;

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

function initialiseWhere() {
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
}

google.maps.event.addDomListener(window, "load", initialiseWhere);