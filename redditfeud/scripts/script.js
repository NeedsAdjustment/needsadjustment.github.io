var IMAGE_DOMAINS = ["i.redd.it","i.imgur.com"];

function filterDomains(listing) {
  // only images allowed
  var filtered = [];
  for (i=0; i<listing.length; i++)
    for (j=0; j<IMAGE_DOMAINS.length; j++)
      if (listing[i].data.domain===IMAGE_DOMAINS[j]&&(listing[i].data.url.endsWith(".jpg")||listing[i].data.url.endsWith(".jpeg")||listing[i].data.url.endsWith(".png"))) { // idk ok???
        filtered.push(listing[i]);
        continue;
      }
  return filtered;
}
;var items = [];
var guessed = false;
var score = 0;
var TEST = [["a",1],["b",2],["c",3],["d",4],["e",5],["f",6],["g",7],["h",8]];
var LISTING = {};
var DUPLICATE_LISTING = {};
var IMAGE_ID = 0;

// chosen from top posts in last month from these
var SUBREDDITS = ["woahdude","aww","nevertellmetheodds","mildlyinteresting","iamverysmart","2meirl4meirl",
  	"insanepeoplefacebook","therewasanattempt","mildlyinfuriating","coaxedintoasnafu","madlads","crappydesign","mypeopleneedme","thisismylifenow",
    "wheredidthesodago","youdontsurf"];

function init() {
  promise = fetchContent(SUBREDDITS[Math.floor(Math.random()*SUBREDDITS.length)]).then(function(value) {
    LISTING = value.data.children;
    //console.log(LISTING);
  }, function(reason) {
    console.log(reason);
  });

  huh = [];
  huh.push(promise);

  Promise.all(huh).then(function() {
    LISTING = filterDomains(LISTING);
    if (LISTING.length!=0) {
      picked = Math.floor((Math.random() * LISTING.length));
      pickedData = LISTING[picked].data;
      document.getElementById("image").innerHTML = "<img src=\""+pickedData.url+"\" style=\"max-height:400px; max-width:auto;\"/>";
      IMAGE_ID = pickedData.id;
      setContent();
    } else {
      document.getElementById("image").innerHTML = "oops couldn't find anything";
    }
  });
}

function setContent() {
  duplicatePromise = fetchDuplicates(IMAGE_ID).then(function(value) {
    DUPLICATE_LISTING = value[0].data.children.concat(value[1].data.children);
    console.log(DUPLICATE_LISTING);
  }, function(reason) {
    console.log(reason);
  });

  huh = [];
  huh.push(duplicatePromise);

  Promise.all(huh).then(function() {
    items = [];
    for (i=0; i<DUPLICATE_LISTING.length; i++) {
      if (DUPLICATE_LISTING[i].data.score>100)
        items.push(DUPLICATE_LISTING[i].data.subreddit);
      guessed = false;
      document.getElementById("answers").innerHTML = "???";
    }
  });
}

function textSubmit(e) {
  if (event.key === 'Enter') {
    guess();
  }
}

function guess() {
  input = document.getElementById("guess").value;
  for (i=0; i<items.length; i++) {
    if (items[i].toUpperCase()===input.toUpperCase() && !guessed) {
      document.getElementById("answers").innerHTML = "/r/"+items[i];
      guessed = true;
      score++;
      document.getElementById("score").innerHTML = score;
    }
  }
  document.getElementById("guess").value = "";
}
;function fetchContent(name) {
  url = 'https://www.reddit.com/r/';
  url = url.concat(name, '/top.json?sort=top&t=month');

  return fetch(url)
    .then(function (response) {
      if (response.status >= 400) {
        throw new Error('Bad response in fetchContent');
      }
      return response.json();
    });
}

function fetchDuplicates(id) {
  url = 'https://www.reddit.com/duplicates/';
  url = url.concat(id,".json");
  
  return fetch(url)
    .then(function (response) {
      if (response.status >= 400) {
        throw new Error('Bad response in fetchContent');
      }
      return response.json();
    });
}
