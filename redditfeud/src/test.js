function fetchContent(name) {
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
