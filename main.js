// Define global variables here
var localHostURL = "http://192.168.50.136:7200/repositories/repo-VU" // the URL of the GraphDB endpoint
var pictureAndSongArray = []
var offset;
var markerArray = []

// Initialize the map
var artistMap = L.map('artistMapID').setView([0, 0], 1);

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(artistMap);

function loadIcon(trueOrFalse){
  loadImage = "<img src=\"Spinner-1s-200px.svg\" alt=\"loading svg\"  width=250/>"
  if(trueOrFalse){
    document.getElementById("loadImage").innerHTML = loadImage;
  }
  else{
    document.getElementById("loadImage").innerHTML = "";
  }
}

function queryRetrievePoints(countryArtist){
    if(countryArtist == "Netherlands"){
      countryArtist = "Kingdom of the Netherlands"; // Error handling of Netherlands
    }
    queryPoint = "SELECT DISTINCT ?countryLabel ?geometryCountry ?continentLabel ?geometryContinent\r\n" +
			"WHERE\r\n" +
			"{\r\n" +
			"    SERVICE <https://query.wikidata.org/sparql> {\r\n" +
			"  ?country <http://www.wikidata.org/prop/direct/P31> <http://www.wikidata.org/entity/Q3624078> ;\r\n" +
			"           <http://www.wikidata.org/prop/direct/P625> ?geometryCountry ;\r\n" +
			"           <http://www.wikidata.org/prop/direct/P30> ?continent ;\r\n" +
			"						<http://www.w3.org/2000/01/rdf-schema#label> \"" + countryArtist + "\"@en .\r\n" +
			"  ?continent <http://www.wikidata.org/prop/direct/P625> ?geometryContinent\r\n" +
			"  FILTER NOT EXISTS {?country <http://www.wikidata.org/prop/direct/P31> <http://www.wikidata.org/entity/Q3024240>}\r\n" +
			"  FILTER NOT EXISTS {?country <http://www.wikidata.org/prop/direct/P31> <http://www.wikidata.org/entity/Q28171280>}\r\n" +
			"\r\n" +
			"  SERVICE <http://wikiba.se/ontology#label> { <http://www.bigdata.com/rdf#serviceParam> <http://wikiba.se/ontology#language> \"en\" }\r\n" +
			"    }\r\n" +
			"}\r\n" +
			"ORDER BY ?countryLabel"
	return queryPoint;
};



function addPointers(countryArtist, track, artist){
    query = queryRetrievePoints(countryArtist);
    var mySparqlEndpoint = localHostURL;
    var mySparqlQuery = encodeURIComponent(query);
    var xhttp1 = new XMLHttpRequest();
    xhttp1.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        var data = this.responseText.split(",");
        var point = data[4]
        point = point.split("(")
        point = (point[1].split(")")[0]).split(" ")
        var latitude = parseFloat(point[1])
        var longitude = parseFloat(point[0])

        var marker = L.marker([latitude, longitude]);
        marker.bindPopup("<b>" + track + "</b><br>" + artist).openPopup();
        markerArray.push(marker);
	      artistMap.addLayer(marker);

        if (markerArray.length == 10){
          loadIcon(false); // Hier als we het laadicoontje pas weg willen  na het neerzetten van de pointers
        }
      } else if (this.status == 401) {
        alert("Oops somehting went wrong with the map!");
        return
      } else if (this.status == 400) {
        alert("Oops somehting went wrong with the map!");
        return
      }
    };
    xhttp1.open("GET", mySparqlEndpoint + "?query=" + mySparqlQuery, true);
    xhttp1.send();
  }


// Different SPARQL queries
function querySimpleAllArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax){
  simpleAll = "SELECT * WHERE{\n" +
  "	?artist rdf:type ?type .\n" +
  "   ?artist rdfs:label \"" + artistName + "\"@en .\n" +
  "    {\n" +
  "    FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "    }\n" +
  "	SERVICE <https://query.wikidata.org/sparql> {\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P569> ?dateOfBirth .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P27> ?country .\n" +
  "        ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P21> ?gender .\n" +
  "        ?gender <http://www.w3.org/2000/01/rdf-schema#label> ?genderLabel .\n" +
  "            FILTER (?dateOfBirth >= " + ageArtistMin + " && ?dateOfBirth <= " + ageArtistMax + ") .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER (?genderLabel = " + genderArtist + ") .\n" +
  "            FILTER langMatches(lang(?genderLabel), \"en\")\r\n" +
  "            FILTER langMatches(lang(?countryLabel), \"en\")\r\n" +
  "        }\n" +
  "    }\n" +
  "    UNION\n" +
  "    {\n" +
  "        FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "    }\n" +
  "        SERVICE <https://query.wikidata.org/sparql> {\n" +
  "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
  "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
  "        }\n" +
  "}\n" +
  "    \n" +
  "}\n" +
  "LIMIT 1";
  return simpleAll;
}

function querySimpleOnlySoloArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax){
  simpleSolo = "SELECT * WHERE{\n" +
  "	?artist rdf:type <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "   ?artist rdfs:label \"" + artistName + "\"@en .\n" +
  "    {\n" +
  "    FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "    }\n" +
  "	SERVICE <https://query.wikidata.org/sparql> {\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P569> ?dateOfBirth .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P27> ?country .\n" +
  "        ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P21> ?gender .\n" +
  "        ?gender <http://www.w3.org/2000/01/rdf-schema#label> ?genderLabel .\n" +
  "            FILTER (?dateOfBirth >= " + ageArtistMin + " && ?dateOfBirth <= " + ageArtistMax + ") .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER (?genderLabel = " + genderArtist + ") .\n" +
  "            FILTER langMatches(lang(?genderLabel), \"en\")\r\n" +
  "            FILTER langMatches(lang(?countryLabel), \"en\")\r\n" +
  "        }\n" +
  "    }\n" +
  "    UNION\n" +
  "    {\n" +
  "        FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "    }\n" +
  "        SERVICE <https://query.wikidata.org/sparql> {\n" +
  "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
  "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
  "        }\n" +
  "}\n" +
  "    \n" +
  "}\n" +
  "LIMIT 1";
  return simpleSolo;
}

function querySimpleGroupArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax){
  simpleGroup = "SELECT * WHERE{\n" +
  "	?artist rdf:type <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "   ?artist rdfs:label \"" + artistName + "\"@en .\n" +
  "    {\n" +
  "    FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "    }\n" +
  "	SERVICE <https://query.wikidata.org/sparql> {\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P569> ?dateOfBirth .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P27> ?country .\n" +
  "        ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P21> ?gender .\n" +
  "        ?gender <http://www.w3.org/2000/01/rdf-schema#label> ?genderLabel .\n" +
  "            FILTER (?dateOfBirth >= " + ageArtistMin + " && ?dateOfBirth <= " + ageArtistMax + ") .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER (?genderLabel = " + genderArtist + ") .\n" +
  "            FILTER langMatches(lang(?genderLabel), \"en\")\r\n" +
  "            FILTER langMatches(lang(?countryLabel), \"en\")\r\n" +
  "        }\n" +
  "    }\n" +
  "    UNION\n" +
  "    {\n" +
  "        FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "    }\n" +
  "        SERVICE <https://query.wikidata.org/sparql> {\n" +
  "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
  "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
  "        }\n" +
  "}\n" +
  "    \n" +
  "}\n" +
  "LIMIT 1";
  return simpleGroup;
}

function queryExtensiveAll(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax){
  extensiveAll = "SELECT * WHERE{\n" +
  "	?artist rdf:type ?type .\n" +
  "   ?artist rdfs:label ?label .\n" +
  "   FILTER (STR(?label) = \"" + artistName + "\") .\n" +
  "    {\n" +
  "    FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "    }\n" +
  "	SERVICE <https://query.wikidata.org/sparql> {\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P569> ?dateOfBirth .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P27> ?country .\n" +
  "        ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P21> ?gender .\n" +
  "        ?gender <http://www.w3.org/2000/01/rdf-schema#label> ?genderLabel .\n" +
  "            FILTER (?dateOfBirth >= " + ageArtistMin + " && ?dateOfBirth <= " + ageArtistMax + ") .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER (?genderLabel = " + genderArtist + ") .\n" +
  "            FILTER langMatches(lang(?genderLabel), \"en\")\r\n" +
  "            FILTER langMatches(lang(?countryLabel), \"en\")\r\n" +
  "        }\n" +
  "    }\n" +
  "    UNION\n" +
  "    {\n" +
  "        FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "    }\n" +
  "        SERVICE <https://query.wikidata.org/sparql> {\n" +
  "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
  "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
  "        }\n" +
  "}\n" +
  "    \n" +
  "}\n" +
  "LIMIT 1";
  return extensiveAll;
}

function queryExtensiveOnlySoloArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax){
  extensiveSolo = "SELECT * WHERE{\n" +
  "	?artist rdf:type <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "   ?artist rdfs:label ?label .\n" +
  "   FILTER (STR(?label) = \"" + artistName + "\") .\n" +
  "    {\n" +
  "    FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "    }\n" +
  "	SERVICE <https://query.wikidata.org/sparql> {\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P569> ?dateOfBirth .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P27> ?country .\n" +
  "        ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P21> ?gender .\n" +
  "        ?gender <http://www.w3.org/2000/01/rdf-schema#label> ?genderLabel .\n" +
  "            FILTER (?dateOfBirth >= " + ageArtistMin + " && ?dateOfBirth <= " + ageArtistMax + ") .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER (?genderLabel = " + genderArtist + ") .\n" +
  "            FILTER langMatches(lang(?genderLabel), \"en\")\r\n" +
  "            FILTER langMatches(lang(?countryLabel), \"en\")\r\n" +
  "        }\n" +
  "    }\n" +
  "    UNION\n" +
  "    {\n" +
  "        FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "    }\n" +
  "        SERVICE <https://query.wikidata.org/sparql> {\n" +
  "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
  "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
  "        }\n" +
  "}\n" +
  "    \n" +
  "}\n" +
  "LIMIT 1";
  return extensiveSolo;
}

function queryExtensiveGroupArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax){
  extensiveGroup = "SELECT * WHERE{\n" +
  "	?artist rdf:type <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "	?artist rdf:type <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "   ?artist rdfs:label ?label .\n" +
  "    {\n" +
  "    FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
  "    }\n" +
  "	SERVICE <https://query.wikidata.org/sparql> {\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P569> ?dateOfBirth .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P27> ?country .\n" +
  "        ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "        ?artist <http://www.wikidata.org/prop/direct/P21> ?gender .\n" +
  "        ?gender <http://www.w3.org/2000/01/rdf-schema#label> ?genderLabel .\n" +
  "            FILTER (?dateOfBirth >= " + ageArtistMin + " && ?dateOfBirth <= " + ageArtistMax + ") .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER (?genderLabel = " + genderArtist + ") .\n" +
  "            FILTER langMatches(lang(?genderLabel), \"en\")\r\n" +
  "            FILTER langMatches(lang(?countryLabel), \"en\")\r\n" +
  "        }\n" +
  "    }\n" +
  "    UNION\n" +
  "    {\n" +
  "        FILTER EXISTS{\n" +
  "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/ontology/mo/MusicGroup> .\n" +
  "    }\n" +
  "        SERVICE <https://query.wikidata.org/sparql> {\n" +
  "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
  "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
  "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
  "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
  "        }\n" +
  "}\n" +
  "    \n" +
  "}\n" +
  "LIMIT 1";
  return extensiveGroup;
}

function fixInputCountry(string) {
  // return "\"" + string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() + "\"@en";
    return "\"" + string + "\"@en";
}

function fixInputGender(string) {
  return "\"" + string.toLowerCase() + "\"@en";
}

function fixInputAge(string) {
  return "\"" + string + "-01-01T00:00:00Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime>";
}

function checkSongAlreadyInResult(track){
  var i = 0;
  for (i = 0; i < pictureAndSongArray.length; i++) {
    if (pictureAndSongArray[i][2] == (track)){
        return true;
    }
  }
  return false;
}

function createLayout(picture, preview, trackName, artist) {
  var result = []
  result.push("<img src=\"" + picture + "\" alt=\"" + trackName + "\" style=\"width:64px;height:64px;\">")
  if (preview != null) {
    result.push("<audio controls><br><source src=\"" + preview + "\" type=\"audio/ogg\"><br></audio>")
  }
  else{
    result.push("<audio controls><br><source src=\"https://p.scdn.co/mp3-preview/a69cabb16c6c3333db903d1f538e808493689e40?cid=774b29d4f13844c495f206cafdad9c86\" type=\"audio/ogg\"><br></audio>") // Meme
  }
  result.push(trackName)
  result.push(artist)
  result.push("<br>")
  return result
}

function performAlert(){
  alert("The number of times this alert will pop up * 3-4 minutes waiting time for each pop-up is equal to the time needed to wait for this query." +
  "We saved you a lot of time by just performing the normal query! Hint: press ESC or something... you can thank us later :) " +
  "Note that you can see the query originally performmed in the \"main.js\" file.");
}

// perform search query to GraphDB
function performSearchQuery(artistName, layout, track, resultNO, numberOfTracks) {

  // First define the requirements of the query
  var countryArtist = document.getElementById("countryID");
  var genderArtist = document.getElementById("genderID");
  var ageArtistMin = document.getElementById("ageMIN");
  var ageArtistMax = document.getElementById("ageMAX");
  var extensiveOrNot = document.getElementById("simpleQuery");
  var checkSoloArtist = document.getElementById("soloArtist");
  var checkGroupArtist = document.getElementById("groupArtist");
  var checkAllArtists = document.getElementById("allArtists");
  var query = "";

  // check if country is entered or not
  if (countryArtist && countryArtist.value) {
    countryArtist = fixInputCountry(countryArtist.value);
  } else {
    countryArtist = "?countryLabel";
  }

  // check if gender is entered or not
  if (genderArtist && genderArtist.value) {
    genderArtist = fixInputGender(genderArtist.value);
  } else {
    genderArtist = "?genderLabel";
  }

  // check if ageMin is entered or not
  if (ageArtistMin && ageArtistMin.value) {
    var minAge = parseInt(ageArtistMin.value);
    var minYear = (2020 - minAge).toString();
    ageArtistMin = fixInputAge(minYear);
  } else {
    ageArtistMin = "?dateOfBirth";
  }

  // check if ageMax is entered or not
  if (ageArtistMax && ageArtistMax.value) {
    var maxAge = parseInt(ageArtistMax.value);
    var maxYear = (2020 - maxAge).toString();
    ageArtistMax = fixInputAge(maxYear);
  } else {
    ageArtistMax = "?dateOfBirth";
  }

  // check type artist and retrieve that query
  if(checkAllArtists.checked == true){
    if (extensiveOrNot.checked == false){
      performAlert();
    }
      query = querySimpleAllArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax);
  }
  else if (checkSoloArtist.checked == true){
    if (extensiveOrNot.checked == false){
      performAlert();
    }
      query = querySimpleOnlySoloArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax);
  }
  else if (checkGroupArtist.checked == true){
    if (extensiveOrNot.checked == false){
      performAlert();
    }
      query = querySimpleGroupArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax);
  }

  // perform SPARQL query
  var mySparqlEndpoint = localHostURL;
  var mySparqlQuery = encodeURIComponent(query);
  var xhttp1 = new XMLHttpRequest();
  xhttp1.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = this.responseText.split(",");
        if (pictureAndSongArray.length == 10){
          // loadIcon(false);   // Hier als we het laadicoontje al weg willen na het zoeken van de songs en niet pas na het plaatsen van de pointers
          return
        }
        if(resultNO == numberOfTracks - 1){
          if(offset == 1980){
            alert("No more songs available (after the songs that might appear after this alert)");
            return // 1980 could be the max offset, >1980 is not possible (Spotify will not let you)
          }
          offset = offset + 40;
          retrieveInfoRequest(0, offset);
        }
      if (data.length == 11 || data.length == 13) { // 7 Because the original SELECT * returns 7 elements, so if there are any answers, the query will be > 7
            songAlreadyInResult = checkSongAlreadyInResult(track);
            if(songAlreadyInResult){
            }
            else{
              if(data.length == 11){
                addPointers(data[8], track, artistName);
              }
              if(data.length == 13){
                addPointers(data[10], track, artistName);
              }
                pictureAndSongArray.push(layout)
                document.getElementById("demo").innerHTML = pictureAndSongArray;
            }
      }
    } else if (this.status == 401) {
      alert("Please enter the correct authorization token or refresh your authorization token!");
    } else if (this.status == 400) {
      alert("Please enter a correct authorization token!");
    }
  };
  xhttp1.open("GET", mySparqlEndpoint + "?query=" + mySparqlQuery, true);
  xhttp1.send();
}

// Spotify request
function retrieveInfoRequest(numberOfResults, offset) {
  var authorizationToken = document.getElementById("authorization").value;
  var genre = document.getElementById("genre");
  var publicationYear = document.getElementById("publicationYear");
  var numberOfResults = numberOfResults;
  var offset = offset;

  // check if genre is entered or not
  if (genre && genre.value) {
    genre = encodeURI(genre.value);
    genre = "%20genre:%22" + genre + "%22";
  } else {
    genre = "";
  }

  // check if publicationYear is entered or not
  if (publicationYear && publicationYear.value) {
    publicationYear = encodeURI(publicationYear.value);
    publicationYear = "year:" + publicationYear;
  } else {
    var date = new Date();
    var currYear = date.getFullYear();
    publicationYear = encodeURI(currYear);
    publicationYear = "year:" + publicationYear;
  }

  // perform GET request to Spotify
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = this.responseText
      var jsonResponse = JSON.parse(data);
      var tracks = jsonResponse["tracks"]["items"];
      var informationArray = []
      if (tracks.length == 0) {
        alert("No tracks found!");
      }
      var i;
      for (i = 0; i < tracks.length; i++) {
        var track = jsonResponse["tracks"]["items"][i]
        trackName = track["name"]
        popularity = track["popularity"]
        preview = track["preview_url"]
        picture = track["album"]["images"][2]["url"]
        artist = track["artists"][0]["name"]
        layout = createLayout(picture, preview, trackName, artist);
        performSearchQuery(artist, layout, trackName, i, tracks.length);
      }
    } else if (this.status == 401) {
      alert("Please enter the correct authorization token or refresh your authorization token!");
      return
    } else if (this.status == 400) {
      alert("Please enter a correct authorization token!");
      return
    }
  };
  xhttp.open("GET", "https://api.spotify.com/v1/search?query=" + publicationYear + genre + "&offset=" + offset + "&type=track&limit=50", true);
  xhttp.setRequestHeader('Authorization', 'Bearer ' + authorizationToken);
  xhttp.send();
}

function retrieveInfo(){
  loadIcon(true);
  if (markerArray.length != 0){
    for(var i = 0; i < markerArray.length; i++){
    artistMap.removeLayer(markerArray[i]);
  }
  }
  var numberOfResults = 0;
  offset = 0;
  pictureAndSongArray = [];
  if(numberOfResults < 10){
    retrieveInfoRequest(numberOfResults, offset);
  }
}


// Line offset
