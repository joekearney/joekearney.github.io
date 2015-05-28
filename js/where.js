
// static lag/longs for the places we're going.
// This data was acquired from the Google Maps API geocoder and is only used with the API.
var latLngs = {};
latLngs["Singapore"] = new google.maps.LatLng(1.352083,103.819836);
latLngs["London, UK"] = new google.maps.LatLng(51.507351,-0.127758);
latLngs["Phnom Penh, Cambodia"] = new google.maps.LatLng(11.544873,104.892167);
latLngs["Siem Reap, Cambodia"] = new google.maps.LatLng(13.367097,103.844813);
latLngs["Kuala Lumpur, Malaysia"] = new google.maps.LatLng(3.139003,101.686855);
latLngs["Melbourne, Australia"] = new google.maps.LatLng(-37.814107,144.96328);
latLngs["Sydney, Australia"] = new google.maps.LatLng(-33.867487,151.20699);
latLngs["Hong Kong"] = new google.maps.LatLng(22.396428,114.109497);
latLngs["Sydney, Australia"] = new google.maps.LatLng(-33.867487,151.20699);
latLngs["Christchurch, New Zealand"] = new google.maps.LatLng(-43.532054,172.636225);
latLngs["Cairns, Australia"] = new google.maps.LatLng(-16.920334,145.77086);
latLngs["Brisbane, Australia"] = new google.maps.LatLng(-27.471011,153.023449);
latLngs["Adelaide, Australia"] = new google.maps.LatLng(-34.928621,138.599959);
latLngs["Auckland, New Zealand"] = new google.maps.LatLng(-36.84846,174.763332);
latLngs["Hanoi, Vietnam"] = new google.maps.LatLng(21.027764,105.83416);
latLngs["Mount Gambier, Australia"] = new google.maps.LatLng(-37.827922,140.775253);
latLngs["Apollo Bay, Australia"] = new google.maps.LatLng(-38.757167,143.669613);
latLngs["Uluru, Australia"] = new google.maps.LatLng(-25.352594,131.034361);
latLngs["King's Canyon, Australia"] = new google.maps.LatLng(-24.259315,131.488466);
latLngs["Alice Springs, Australia"] = new google.maps.LatLng(-23.70021,133.880611);
latLngs["Katoomba, Australia"] = new google.maps.LatLng(-33.714955,150.311407);
latLngs["Bundeena, Australia"] = new google.maps.LatLng(-34.08392,151.151583);
latLngs["Atakoa, New Zealand"] = new google.maps.LatLng(-43.803666,172.968262);
latLngs["Mount Cook, New Zealand"] = new google.maps.LatLng(-43.735880, 170.098661);
latLngs["Dunedin, New Zealand"] = new google.maps.LatLng(-45.87876,170.502798);
latLngs["Oamaru, New Zealand"] = new google.maps.LatLng(-45.097512,170.970415);
latLngs["Akaroa, New Zealand"] = new google.maps.LatLng(-43.803666,172.968262);
latLngs["Waihi Gorge, New Zealand"] = new google.maps.LatLng(-43.999637,171.134737);
latLngs["Queenstown, New Zealand"] = new google.maps.LatLng(-45.031162,168.662644);
latLngs["Middlemarch, New Zealand"] = new google.maps.LatLng(-45.507065,170.119349);
latLngs["Milford Sound, New Zealand"] = new google.maps.LatLng(-44.671625,167.925621);
latLngs["Te Anau, New Zealand"] = new google.maps.LatLng(-45.414451,167.718053);
latLngs["Bay of Islands, New Zealand"] = new google.maps.LatLng(-35.18437,174.164616);
latLngs["Rotorua, New Zealand"] = new google.maps.LatLng(-38.136848,176.249746);
latLngs["Gore, New Zealand"] = new google.maps.LatLng(-46.098799,168.945819);
latLngs["Taupo, New Zealand"] = new google.maps.LatLng(-38.685692,176.07021);
latLngs["Haast, New Zealand"] = new google.maps.LatLng(-43.8803,169.0400);
latLngs["Franz Josef, New Zealand"] = new google.maps.LatLng(-43.4000,170.1833);
latLngs["Nelson, New Zealand"] = new google.maps.LatLng(-41.2708,173.2839);
latLngs["Picton, New Zealand"] = new google.maps.LatLng(-41.2833,174.0000);
latLngs["Wellington, New Zealand"] = new google.maps.LatLng(-41.2889,174.7772);
latLngs["Tongariro National Park, New Zealand"] = new google.maps.LatLng(-39.203089,175.546519);

// stuff per line of where.txt
var locations = [];
var dates = [];
var statuses = [];
var flickrLinks = [];

var currentLocationIndex = 0;

// stuff per location, where location is from where.txt
var markers = {};
var infoWindows = {};
var lastDateAtLocation = {};

// parse out the lines of where.txt, 
function parseHistory(historyText) {
  var lines = historyText.split(/\r?\n/);
  var lineNum = 1;

  lines.forEach(function(line) {
    if (line.length > 0 && line.charAt(0) != '#') {
      var matches = line.match(/(.*)[|](.*)[|](.*)[|](.*)/);
      var day = moment(matches[1], 'YYYY-MM-DD');
      var place = matches[2];
      var status = matches[3];
      var flickrLink = matches[4];

      locations.push(place);
      dates.push(day);
      statuses.push(status);
      flickrLinks.push(flickrLink); // these might be empty if no link
      lastDateAtLocation[place] = day;
    }
  });

  numLocations = locations.length;

  if (numLocations > 0) {
    currentLocationIndex = 0;
    while (currentLocationIndex+1 < numLocations && statuses[currentLocationIndex+1] == 'arrived') {
      currentLocationIndex = currentLocationIndex + 1;
    }

    var currentLocation = locations[currentLocationIndex];
    document.getElementById('current-location-text').innerHTML = currentLocation;
    document.getElementById('current-location-arrival').innerHTML = dates[currentLocationIndex].format('dddd MMMM Do, YYYY');
  }

  google.maps.event.addDomListener(window, 'load', addAddresses(locations));
}

var numLocations;

// the actual map object
var map;

var polylineUntilNow;
var polylineAfterNow;

function setFlickrLinkForIndex(addressIndex) {
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
function setFlickrLinkFor(placeName) {
  var addressIndex = locations.slice(0, currentLocationIndex+1).lastIndexOf(placeName);
  setFlickrLinkForIndex(addressIndex);
}

function onComplete() {
  function setUpPolylines() {
    // set up the polylineUntilNow to trace the route up to now
    var pathElements = [];
    locations.forEach(function(v) { if (latLngs[v]) { pathElements.push(latLngs[v]); } else {
      console.log("Not found latLng for " + v);
    } });

    var locationsUntilNow = pathElements.slice(0, currentLocationIndex + 1);
    // locationsAfterNow[0] is the current location, so that the polylines join
    var locationsAfterNow = pathElements.slice(currentLocationIndex);

    polylineUntilNow = new google.maps.Polyline({
      path: locationsUntilNow,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    polylineUntilNow.setMap(map);

    // Define a symbol using SVG path notation, with an opacity of 1.
    var dashedLineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      strokeWeight: 2,
      scale: 4
    };

    polylineAfterNow = new google.maps.Polyline({
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
    polylineAfterNow.setMap(map);

    // make sure that the map contains the last four items on the polylineUntilNow
    var bounds = new google.maps.LatLngBounds();
    locationsUntilNow.slice(Math.max(locationsUntilNow.length - 4, 0)).forEach(function(a) {
      bounds.extend(a);
    });
    // add the next location if there aren't many up to now
    if (locationsUntilNow.length < 3 && locationsAfterNow.length > 1) {
      bounds.extend(locationsAfterNow[1]);
    }
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
      function indexesOf(place) {
        var indexes = [];
        for (var i = 0; i < locations.length; i++) {
          if (locations[i] == place) {
            indexes.push(i);
          }
        }
        return indexes;
      }
      function toList(is) {
        function flickrLinkOrEmpty(i) {
          if (flickrLinks[i].length > 0) {
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
          if (dates[i].isBefore(now) && (i + 1 == dates.length || dates[i+1].isAfter(now))) {
            current = true;
          }
          var itemString = "";

          if (current) {
            itemString += "<b>";
          }

          itemString += dates[i].format('ddd MMM Do, YYYY');

          if (i + 1 < dates.length) {
            itemString += " to " + dates[i+1].format('ddd MMM Do, YYYY')
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
      infoWindows[place] = infoWindow;
    }
    // have to do this through a closure to capture one value of marker! WAT!
    function attachMarkerClickListener(m) {
      google.maps.event.addListener(m, 'click', function() {
        markerClick(m, markers);
      });
    }

    // get the latest marker for each location, attach to the infobox and the map
    for (var place in markers) {
      var marker = markers[place];
      setUpInfoBox(place, marker);
      attachMarkerClickListener(marker);
    }
  }

  function setUpTime() {
    function parseTime(timeObj, targetElement) {
      if (timeObj.status == "OK") {
        var offset = timeObj.dstOffset + timeObj.rawOffset;
        window.setInterval(function(){
          document.getElementById(targetElement).innerHTML = moment.utc().add(offset, 's').format("HH:mm a, dddd")
        }, 1000);
      } else {
        console.error("Failed to load time from Google Time API: " + timeObj.status);
      }
    }

    function requestTime(location, targetElement) {
      if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        var timeRequest = new XMLHttpRequest();
        timeRequest.onreadystatechange = function() {
          if (timeRequest.readyState == 4 && timeRequest.status == 200) {
            parseTime(JSON.parse(timeRequest.responseText), targetElement);
          }
        }
        var requestUrl = "https://maps.googleapis.com/maps/api/timezone/json?key=AIzaSyARro1ojL1tMxwDIYlRiBGOFShRBSl0kBo"
                          + "&location=" + location.toUrlValue()
                          + "&timestamp=" + moment.utc().unix();
        timeRequest.open("GET", requestUrl, true); // add random to disable caching
        timeRequest.send();
      } else {
        alert("Sorry, your browser can't support tracking our travels. Upgrade!");
      }
    }

    requestTime(latLngs[locations[currentLocationIndex]], "current-time-text");
    requestTime(latLngs["London, UK"], "current-time-london");
  }

  setUpFlickr();
  setUpMarkers();
  setUpPolylines();
  setUpTime();
}

function addAddresses(addresses) {
  // number of places processed
  var pointsFound = 0;

  function addMarker(map, latLng, addressIndex) {
    // note these don't come in any particular order
    var address = addresses[addressIndex];

    if (markers[address]) {
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

      markers[address] = marker;
    }

    pointsFound++;

    if (pointsFound == numLocations) {
      onComplete();
    } else if (pointsFound > numLocations) {
      console.error("addMarker called too many times");
    }
  }
  function addAddress(geocoder, addressIndex) {
    var address = addresses[addressIndex];
    if (latLngs[address]) {
      addMarker(map, latLngs[address], addressIndex);
    } else {
      geocoder.geocode({
          'address': addresses[addressIndex]
        }, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var latLng = results[0].geometry.location;
            latLngs[address] = latLng;
            console.log("latLngs[\"" + address + "\"] = new google.maps.LatLng(" + latLng.toUrlValue() + ");");
            addMarker(map, latLng, addressIndex);
          } else {
            console.error("Failed to geocode address " + addresses[addressIndex] + " status: " + status);
          }
        });
    }
  }

  geocoder = new google.maps.Geocoder();
  var currentLocation = addresses[currentLocationIndex];
  console.log("Current location: " + currentLocation);

  if (latLngs[currentLocation]) {
    console.log("Creating map with center " + latLngs[currentLocation]);
    var canvas = document.getElementById('map-canvas');
    var mapOptions = {
      zoom: 10,
      center: latLngs[currentLocation]
    }
    map = new google.maps.Map(canvas, mapOptions);

    for (var i = addresses.length - 1; i >= 0; --i) {
      addAddress(geocoder, i);
    }
  } else {
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

          var latLng = results[0].geometry.location;
          latLngs[address] = latLng;
          console.log("latLngs[\"" + address + "\"] = new google.maps.LatLng(" + latLng.toUrlValue() + ");");
          addMarker(map, latLng, currentLocationIndex);

          for (var i = addresses.length - 1; i >= 0; --i) {
            addAddress(geocoder, i);
          }
        } else {
          console.error("Failed to geocode address " + currentLocation);
        }
      }
    );
  }
}

function initialiseWhere() {
  if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
    var whereTxtRequest = new XMLHttpRequest();
    whereTxtRequest.onreadystatechange = function() {
      if (whereTxtRequest.readyState == 4 && whereTxtRequest.status == 200) {
        parseHistory(whereTxtRequest.responseText);
      }
    }
    whereTxtRequest.open("GET", "/assets/where.txt?t=" + Math.random(), true); // add random to disable caching
    whereTxtRequest.send();
  } else {
    alert("Sorry, your browser can't support tracking our travels. Upgrade!");
  }
}

google.maps.event.addDomListener(window, "load", initialiseWhere);