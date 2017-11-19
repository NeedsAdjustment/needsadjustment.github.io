var items = [];
var points = [];
var guessed = [];
var score = 0;
var TEST = [["a",1],["b",2],["c",3],["d",4],["e",5],["f",6],["g",7],["h",8]];

function init() {
  setContent();
  what = fetchContent("sheep").then(function(value) {
    STUFF = value.data.children;
    console.log(STUFF);
  }, function(reason) {
    console.log(reason);
  });
}

function setContent() {
  answers = getContent();
  for (i=0; i<answers.length; i++) {
    items[i] = answers[i][0];
    points[i] = answers[i][1];
    guessed[i] = false;
    document.getElementById("item"+(i+1)).innerHTML = "?";
  }
}

function textSubmit(e) {
  if (event.key === 'Enter') {
    guess();
  }
}

function guess() {
  input = document.getElementById("guess").value;
  for (i=0; i<items.length; i++) {
    if (items[i]===input && !guessed[i]) {
      document.getElementById("item"+(i+1)).innerHTML = items[i];
      document.getElementById("points"+(i+1)).innerHTML = points[i];
      guessed[i] = true;
      score+=points[i];
      document.getElementById("score").innerHTML = score;
    }
  }
  document.getElementById("guess").value = "";
}

function getContent() {
  return TEST;
}
;function fetchContent(name) {
  url = 'https://www.reddit.com/r/';
  url = url.concat(name, '/top.json');

  return fetch(url)
    .then(function (response) {
      if (response.status >= 400) {
        throw new Error('Bad response in fetchContent');
      }
      return response.json();
    });
}
