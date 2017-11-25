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
