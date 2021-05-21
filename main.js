// Define global variables here
var localHostURL = "http://192.168.50.136:7200/repositories/Demo" // the URL of the GraphDB endpoint
var pictureAndSongArray = []
var infoTableArray = []
var pictureArray = []
var previewArray = []
var songArray = []
var artistArray = []
var offset;
var markerArray = []
var markerArrayCountries = []
var genreGlobal = ""

var wrapper = document.getElementById('wrapper');
wrapper.addEventListener('click', (event) => {
  const isButton = event.target.nodeName === 'BUTTON';
  if (!isButton) {
    genreGlobal = event.target.id;
  }

})

// Initialize the map
var artistMap = L.map('artistMapID').setView([0, 0], 1);

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tiles = L.tileLayer(tileUrl, {
  attribution
});
tiles.addTo(artistMap);

function loadIcon(trueOrFalse) {
  loadImage = "<img src=\"Spinner-1s-200px.svg\" alt=\"loading svg\"  width=250/>"
  if (trueOrFalse) {
    document.getElementById("loadImage").innerHTML = loadImage;
  } else {
    document.getElementById("loadImage").innerHTML = "";
  }
}

var sliderPubYear = document.getElementById("publicationYear");
var yearOfPub = document.getElementById("yearOfPublication");
yearOfPub.innerHTML = sliderPubYear.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderPubYear.oninput = function() {
  yearOfPub.innerHTML = this.value;
}


var sliderMaxAge = document.getElementById("ageMAX");
var yearMax = document.getElementById("yearMaxAge");
yearMax.innerHTML = sliderMaxAge.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderMaxAge.oninput = function() {
  yearMax.innerHTML = this.value;
}

var sliderMinAge = document.getElementById("ageMIN");
var yearMin = document.getElementById("yearMinAge");
yearMin.innerHTML = sliderMinAge.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderMinAge.oninput = function() {
  yearMin.innerHTML = this.value;
}

function queryRetrievePoints(countryArtist) {
  if (countryArtist == "Netherlands") {
    countryArtist = "Kingdom of the Netherlands"; // Error handling of Netherlands
  }
  queryPoint = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\r\n" +
    "PREFIX vu: <http://www.example.com/vu/>\r\n" +
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\r\n" +
    "\r\n" +
    "SELECT DISTINCT ?country ?geometryCountry ?continentLabel ?geometryContinent ?musicFestivalLabel\r\n" +
    "WHERE\r\n" +
    "{\r\n" +
    "  ?country rdf:type vu:Country ;\r\n" +
    "        vu:hasPoint ?geometryCountry ;\r\n" +
    "           vu:isOfContinent ?continent ;\r\n" +
    "	          rdfs:label \"" + countryArtist + "\"@en .\r\n" +
    "  OPTIONAL {  OPTIONAL {?musicFestival rdf:type vu:MusicFestival ;\r\n" +
    "                                       rdfs:label ?musicFestivalLabel .}\r\n" +
    "            ?country vu:hasMusicFestival ?musicFestival .}\r\n" +
    "  ?continent rdfs:label ?continentLabel ;\r\n" +
    "             vu:hasPoint ?geometryContinent .\r\n" +
    "}\r\n" +
    "ORDER BY ?country"
  return queryPoint;
};


function checkDuplicateMarker(country) {
  numberOfDup = 0;
  for (i = 0; i < markerArrayCountries.length; i++) {
    if (country == markerArrayCountries[i]) {
      numberOfDup += 1;
    }
  }
  return numberOfDup;
}


function genderPopUp(artist, gender) {
  result = ""
  if (gender != undefined) {
    result = artist + " is a " + gender["value"];
  } else {
    result = artist + " has no gender, because it is a group";
  }
  return result
}

function dateOfBirthPopUp(artist, dateOfBirth) {
  result = ""
  if (dateOfBirth != undefined) {
    result = artist + " is born at " + (dateOfBirth["value"].split("T"))[0];
  } else {
    result = artist + " has no date of Birth, because it is a group";
  }
  return result
}

function recordLabePopUp(artist, recordLabel) {
  result = ""
  if (recordLabel != undefined) {
    result = artist + " is signed to at least the following record label: " + recordLabel["value"] + " (according to wikiData)";
  } else {
    result = artist + " is not signed to a record label (according to wikiData)";
  }
  return result
}


function awardLabePopUp(artist, numberOfAwards) {
  result = ""
  if (numberOfAwards != undefined) {
    result = artist + " has won " + numberOfAwards["value"] + " award(s) (according to wikiData)";
  } else {
    result = artist + " did not won any awards (according to wikiData)";
  }
  return result
}

function musicFestivalPopUp(artist, musicFestival) {
  result = ""
  if (musicFestival != undefined) {
    result = "( " + musicFestival + " ) are music festivals where " + artist + " could perform in.";
  } else {
    result = "There are no music festivals where " + artist + " could perform in (according to wikiData).";
  }
  return result
}


function addPointers(countryArtist, track, artist, gender, dateOfBirth, numberOfAwards, recordLabel) {
  if (countryArtist == "Netherlands") {
    countryArtist = "Kingdom of the Netherlands"; // Error handling of Netherlands
  }
  query = queryRetrievePoints(countryArtist);
  var mySparqlEndpoint = localHostURL;
  var mySparqlQuery = encodeURIComponent(query);
  var xhttp1 = new XMLHttpRequest();
  xhttp1.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var data = this.responseText.split(",");
      var point = data[5]
      point = point.split("(")
      point = (point[1].split(")")[0]).split(" ")
      var latitude = parseFloat(point[1])
      var longitude = parseFloat(point[0])
      duplicateCountry = checkDuplicateMarker(countryArtist)
      if (duplicateCountry > 0) {
        latitude = latitude + 0.03 * duplicateCountry;
        longitude = longitude + 0.03 * duplicateCountry;
      }
      markerArrayCountries.push(countryArtist);
      var marker = L.marker([latitude, longitude]);
      var musicFestivalList;

      if(countryArtist == "United States of America"){
              countryArtist = encodeURIComponent(countryArtist);
        musicFestivalList = [data[9].replace("http://www.example.com/vu/" + countryArtist, ''), data[13].replace("http://www.example.com/vu/" + countryArtist, ''), data[17].replace("http://www.example.com/vu/" + countryArtist, '')];
      }
      else{
              countryArtist = encodeURIComponent(countryArtist);
      musicFestivalList = [data[8].replace("http://www.example.com/vu/" + countryArtist, ''), data[12].replace("http://www.example.com/vu/" + countryArtist, ''), data[16].replace("http://www.example.com/vu/" + countryArtist, '')];

      }

      var musicFestival;

      gender = genderPopUp(artist, gender);
      dateOfBirth = dateOfBirthPopUp(artist, dateOfBirth);
      recordLabel = recordLabePopUp(artist, recordLabel);
      numberOfAwards = awardLabePopUp(artist, numberOfAwards);
      musicFestival = musicFestivalPopUp(artist, musicFestivalList);
      artist = "<i>" + artist + "</i>"
      marker.bindPopup("<b>" + track + "</b><br>" + artist + "</b><br>" + gender + "</b><br>" + dateOfBirth + "</b><br>" + recordLabel + "</b><br>" + numberOfAwards + "</b><br>" + musicFestival).openPopup();
      markerArray.push(marker);
      artistMap.addLayer(marker);

      if (markerArray.length == 10) {
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
function querySimpleAllArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax) {
  simpleAll = "SELECT DISTINCT (count(distinct ?award) as ?count) ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel WHERE{\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicArtist> .\n" +
    "	?artist rdf:type ?type .\n" +
    "   ?artist rdfs:label \"" + artistName + "\"@en .\n" +
    "    {\n" +
    "    FILTER EXISTS{\n" +
    "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://xmlns.com/foaf/0.1/Person> .\n" +
    "    }\n" +
    "	SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
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
    "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://xmlns.com/foaf/0.1/Group> .\n" +
    "    }\n" +
    "        SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
    "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
    "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
    "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
    "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
    "        }\n" +
    "}\n" +
    "    \n" +
    "}\n" +
    "GROUP BY ?awardLabel ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel\n" +
    "LIMIT 1";
  return simpleAll;
}

function querySimpleOnlySoloArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax) {
  simpleSolo = "SELECT DISTINCT (count(distinct ?award) as ?count) ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel WHERE{\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicArtist> .\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
    "   ?artist rdfs:label \"" + artistName + "\"@en .\n" +
    "    {\n" +
    "	SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
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
    "}\n" +
    "GROUP BY ?awardLabel ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel\n" +
    "LIMIT 1";
  return simpleSolo;
}

function querySimpleGroupArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax) {
  simpleGroup = "SELECT DISTINCT (count(distinct ?award) as ?count) ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel WHERE{\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicArtist> .\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicGroup> .\n" +
    "   ?artist rdfs:label \"" + artistName + "\"@en .\n" +
    "    {\n" +
    " SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
    "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
    "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
    "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
    "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
    "        }\n" +
    "    }\n" +
    "}\n" +
    "GROUP BY ?awardLabel ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel\n" +
    "LIMIT 1";
  return simpleGroup;
}

function queryExtensiveAll(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax) {
  extensiveAll = "SELECT DISTINCT (count(distinct ?award) as ?count) ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel{\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicArtist> .\n" +
    "	?artist rdf:type ?type .\n" +
    "   ?artist rdfs:label ?label .\n" +
    "   FILTER (STR(?label) = \"" + artistName + "\") .\n" +
    "    {\n" +
    "    FILTER EXISTS{\n" +
    "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://xmlns.com/foaf/0.1/Person> .\n" +
    "    }\n" +
    "	SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
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
    "        ?artist <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://xmlns.com/foaf/0.1/Group> .\n" +
    "    }\n" +
    "        SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
    "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
    "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
    "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
    "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
    "        }\n" +
    "}\n" +
    "    \n" +
    "}\n" +
    "GROUP BY ?awardLabel ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel\n" +
    "LIMIT 1";
  return extensiveAll;
}

function queryExtensiveOnlySoloArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax) {
  extensiveSolo = "SELECT * WHERE{\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicArtist> .\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/SoloMusicArtist> .\n" +
    "   ?artist rdfs:label ?label .\n" +
    "   FILTER (STR(?label) = \"" + artistName + "\") .\n" +
    "    {\n" +
    "	SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
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
    "}\n" +
    "GROUP BY ?awardLabel ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel\n" +
    "LIMIT 1";
  return extensiveSolo;
}

function queryExtensiveGroupArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax) {
  extensiveGroup = "SELECT * WHERE{\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicArtist> .\n" +
    "	?artist rdf:type <http://purl.org/ontology/mo/MusicGroup> .\n" +
    "   ?artist rdfs:label ?label .\n" +
    "   FILTER (STR(?label) = \"" + artistName + "\") .\n" +
    "    {\n" +
    " SERVICE <https://query.wikidata.org/sparql> {\n" +
    "        OPTIONAL{?artist <http://www.wikidata.org/prop/direct/P166> ?award .\n" +
    "        ?artist <http://www.wikidata.org/prop/direct/P264> ?recordLabel .\n" +
    "        ?recordLabel <http://www.w3.org/2000/01/rdf-schema#label> ?labelOfRecord .\n" +
    "        FILTER langMatches(lang(?labelOfRecord) , \"en\") .\n" +
    "        }\n" +
    "            {?artist <http://www.wikidata.org/prop/direct/P17> ?country .} UNION {?artist <http://www.wikidata.org/prop/direct/P495> ?country .}\n" +
    "            ?country <http://www.w3.org/2000/01/rdf-schema#label> ?countryLabel .\n" +
    "            FILTER (?countryLabel = " + countryArtist + ") .\n" +
    "            FILTER langMatches(lang(?countryLabel) , \"en\")\r\n" +
    "        }\n" +
    "    }\n" +
    "}\n" +
    "GROUP BY ?awardLabel ?labelOfRecord ?countryLabel ?dateOfBirth ?genderLabel\n" +
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

function fixInputAgeMax(string) {
  return "\"" + string + "-12-12T00:00:00Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime>";
}

function fixInputAgeMin(string) {
  return "\"" + string + "-12-12T00:00:00Z\"^^<http://www.w3.org/2001/XMLSchema#dateTime>";
}

function checkSongAlreadyInResult(track) {
  var i = 0;
  for (i = 0; i < pictureAndSongArray.length; i++) {
    if (pictureAndSongArray[i][2] == (track)) {
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
  } else {
    result.push("<audio controls><br><source src=\"https://p.scdn.co/mp3-preview/a69cabb16c6c3333db903d1f538e808493689e40?cid=774b29d4f13844c495f206cafdad9c86\" type=\"audio/ogg\"><br></audio>") // Meme
  }
  result.push(trackName)
  result.push(artist)
  result.push("<br>")
  return result
}

function performAlert() {
  alert("The number of times this alert will pop up * 3-4 minutes waiting time for each pop-up is equal to the time needed to wait for this query." +
    "We saved you a lot of time by just performing the normal query! Hint: press ESC or something... you can thank us later :) " +
    "Note that you can see the query originally performmed in the \"main.js\" file.");
}

// perform search query to GraphDB
function performSearchQuery(artistName, layout, track, resultNO, numberOfTracks) {

  // First define the requirements of the query
  var countryArtist = document.getElementById("countryID");
  var genderArtistMale = document.getElementById("genderIDMale");
  var genderArtistFemale = document.getElementById("genderIDFemale");
  var ageArtistMin = document.getElementById("yearMinAge").innerHTML;
  var ageArtistMax = document.getElementById("yearMaxAge").innerHTML;
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
  if (genderArtistMale.checked == false && genderArtistFemale.checked == false) {
    genderArtist = "?genderLabel";
  } else if (genderArtistMale.checked == true) {
    genderArtist = fixInputGender("male");
  } else {
    genderArtist = fixInputGender("female");
  }

  // check if ageMin is entered or not
  if (ageArtistMin && ageArtistMin.value) {
    var minAge = parseInt(ageArtistMin.value);
    var minYear = (2020 - minAge).toString();
    ageArtistMin = fixInputAgeMin(minYear);
  } else {
    ageArtistMin = "?dateOfBirth";
  }

  // check if ageMax is entered or not
  if (ageArtistMax && ageArtistMax.value) {
    var maxAge = parseInt(ageArtistMax.value);
    var maxYear = (2020 - maxAge).toString();
    ageArtistMax = fixInputAgeMax(maxYear);
  } else {
    ageArtistMax = "?dateOfBirth";
  }

  // check type artist and retrieve that query
  if (checkAllArtists.checked == true) {
    if (extensiveOrNot.checked == false) {
      performAlert();
    }
    query = querySimpleAllArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax);
  } else if (checkSoloArtist.checked == true) {
    if (extensiveOrNot.checked == false) {
      performAlert();
    }
    query = querySimpleOnlySoloArtist(artistName, countryArtist, genderArtist, ageArtistMin, ageArtistMax);
  } else if (checkGroupArtist.checked == true) {
    if (extensiveOrNot.checked == false) {
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
      if (pictureAndSongArray.length == 10) {
        // loadIcon(false);   // Hier als we het laadicoontje al weg willen na het zoeken van de songs en niet pas na het plaatsen van de pointers
        return
      }
      if (resultNO == numberOfTracks - 1) {
        if (offset == 1980) {
          alert("No more songs available (after the songs that might appear after this alert)");
          return // 1980 could be the max offset, >1980 is not possible (Spotify will not let you)
        }
        offset = offset + 40;
        retrieveInfoRequest(0, offset);
      }
      var data = this.responseText
      var jsonResponse = JSON.parse(data);
      var information = jsonResponse["results"]["bindings"]
      if (information.length == 1) {
        songAlreadyInResult = checkSongAlreadyInResult(track);
        if (songAlreadyInResult) {} else {
          gender = information[0]["genderLabel"];
          dateOfBirth = information[0]["dateOfBirth"]
          numberOfAwards = information[0]["count"]
          recordLabel = information[0]["labelOfRecord"]
          addPointers(information[0]["countryLabel"]["value"], track, artistName, gender, dateOfBirth, numberOfAwards, recordLabel);
          pictureAndSongArray.push(layout)
          infoTableArray.push("<tr><th>")
          infoTableArray.push(layout[0]);
          infoTableArray.push("</th><th>");
          infoTableArray.push(layout[1]);
          infoTableArray.push("</th><th>");
          infoTableArray.push(layout[2]);
          infoTableArray.push("</th><th>");
          infoTableArray.push(layout[3]);
          infoTableArray.push("</th><th><tr>")
          document.getElementById("table").innerHTML = infoTableArray;
        }
      }
    } else if (this.status == 401) {
      alert("The query has failed");
      return
    } else if (this.status == 400) {
      alert("The query has failed");
      return
    }
  };
  xhttp1.open("GET", mySparqlEndpoint + "?query=" + mySparqlQuery + "&Accept=application/sparql-results%2Bjson", true);
  xhttp1.send();
}

// Spotify request
function retrieveInfoRequest(numberOfResults, offset) {
  var authorizationToken = document.getElementById("authorization").value;
  var genre = genreGlobal.toString();
  var publicationYear = document.getElementById("publicationYear");
  var numberOfResults = numberOfResults;
  var offset = offset;

  // check if genre is entered or not
  if (genre != "") {
    genre = encodeURI(genre);
    genre = "%20genre:%22" + genre + "%22";
  } else {
    genre = "";
  }

  console.log(genre)
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
        return
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

function retrieveInfo() {
  loadIcon(true);
  if (markerArray.length != 0) {
    for (var i = 0; i < markerArray.length; i++) {
      artistMap.removeLayer(markerArray[i]);
    }
  }
  markerArrayCountries = []
  markerArray = []
  infoTableArray = []
  document.getElementById("table").innerHTML = infoTableArray
  var numberOfResults = 0;
  offset = 0;
  pictureAndSongArray = [];
  if (numberOfResults < 10) {
    retrieveInfoRequest(numberOfResults, offset);
  }
}
