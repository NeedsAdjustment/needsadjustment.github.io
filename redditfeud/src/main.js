var items = [];
var points = [];
var guessed = [];
var score = 0;
var TEST = [["a",1],["b",2],["c",3],["d",4],["e",5],["f",6],["g",7],["h",8]];
var LISTING = {};
var DUPLICATE_LISTING = {};
var IMAGE_ID = 0;

// chosen from top posts in last month from these
var SUBREDDITS = ["woahdude","aww","nevertellmetheodds","blackpeopletwitter","bikinibottomtwitter","mildlyinteresting","niceguys",
  	"cringepics","facepalm","therewasanattempt","mildlyinfuriating","coaxedintoasnafu","madlads","crappydesign"];

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
    picked = Math.floor((Math.random() * LISTING.length));
    pickedData = LISTING[picked].data;
    document.getElementById("image").innerHTML = "<img src=\""+pickedData.url+"\" style=\"max-height:400px; max-width:auto;\"/>";
    IMAGE_ID = pickedData.id;
    setContent();
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
    answers = [];
    for (i=0; i<DUPLICATE_LISTING.length; i++) {
      items[i]=DUPLICATE_LISTING[i].data.subreddit;
      points[i]=DUPLICATE_LISTING[i].data.score;
      guessed[i] = false;
      document.getElementById("item"+(i+1)).innerHTML = "?";
    }
    for (i=DUPLICATE_LISTING.length; i<8; i++) {
      document.getElementById("item"+(i+1)).innerHTML = "_";
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
    if (items[i].toUpperCase()===input.toUpperCase() && !guessed[i]) {
      document.getElementById("item"+(i+1)).innerHTML = items[i];
      document.getElementById("points"+(i+1)).innerHTML = points[i];
      guessed[i] = true;
      score+=points[i];
      document.getElementById("score").innerHTML = score;
    }
  }
  document.getElementById("guess").value = "";
}
