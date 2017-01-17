window.Algorithmia = window.Algorithmia || {};
Algorithmia.api_key = "simeyUbLXQ/R8Qga/3ZCRGcr2oR1"

function updateUrl() {

  var dropDown = document.getElementById("urlDD");
  var usrSel = dropDown.options[dropDown.selectedIndex].value;

  document.getElementById("inputStrings").value = usrSel;
}

function analyze() {

  var output = document.getElementById("output");
  var statusLabel = document.getElementById("status-label")

  statusLabel.innerHTML = "";
  startTask();

  // Get the URL of the feed
  var inputUrl = document.getElementById("inputStrings").value;

  // Clear table to prep for new data
  output.innerHTML = "";
  statusLabel.innerHTML = "";

  // Query RSS scraper algorithm
    Algorithmia.query("/tags/ScrapeRSS", Algorithmia.api_key, inputUrl, function(error, items) {
      finishTask();
      // Print debug output
      if(error) {
        statusLabel.innerHTML = '<span class="text-danger">Failed to load RSS feed (' + error + ')</span>';
        return;
      }

      // Trim items
      items.length = 6;
      
      // Iterate over each item returned from ScrapeRSS
      for(var i in items) {
        startTask();

        // Create closure to capture item
        (function() {
          var index = i;
          var item = items[i];
          var itemUrl = item.url

          // Create table and elements into which we will stick the results of our algorithms
          var row = document.createElement("section");
          output.appendChild(row);
          var itemHTML = '<div class="row whitespace-none rss-result">';
          itemHTML += '<div class="col-md-12 col-lg-9">';
          itemHTML += '<p class="item-title">ARTICLE TITLE</p>';
          itemHTML += '<h4 class="result"><a href="' + itemUrl + '">' + item.title + '</a></h4>';
          itemHTML += '<p class="item-title">GENERATED SUMMARY</p>';
          itemHTML += '<p class="summary"></p>';
          itemHTML += '<p class="item-title">GENERATED TAGS</p>';
          itemHTML += '<div class="tags"></div>';
          itemHTML += '<p class="item-title">SENTIMENT ANALYSIS</p>';
          itemHTML += '<div class="sentiment"></div>';
          itemHTML += '</div>';
          row.innerHTML += itemHTML;

          var summaryElement = row.getElementsByClassName("summary")[0];
          var tagsElement = row.getElementsByClassName("tags")[0];
          var sentimentElement = row.getElementsByClassName("sentiment")[0];

          // Use a utility algorithm to fetch page text
          Algorithmia.query("/util/Html2Text", Algorithmia.api_key, itemUrl, function(error, itemText) {
            finishTask();

            if(error) {
              statusLabel.innerHTML = '<span class="text-danger">Error fetching ' + itemUrl + '</span>';
              return;
            }

            // Run NLP algos on the links
            summarize(itemText, summaryElement);
            autotag(itemText, tagsElement);
            sentiment(itemText, sentimentElement);
          });
        })();
      }
    });
  }

  function summarize(itemText, summaryElement) {
    startTask();

    // Query summarizer analysis
    Algorithmia.query("/nlp/Summarizer", Algorithmia.api_key, itemText, function(error, summaryText) {
      finishTask();

      if(error) {
        statusLabel.innerHTML = '<span class="text-danger">' + error + '</span>';
        return;
      }

      summaryElement.textContent = summaryText;
    });
  }

  function autotag(itemText, tagsElement) {
    startTask();

    var topics = [];
    var topicLabels = [];

    if(typeof(itemText) == "string") {
      itemText = itemText.split("\n");
    } else {
      itemText = [];
    }

    // Query autotag analysis
    Algorithmia.query("/nlp/AutoTag", Algorithmia.api_key, itemText, function(error, topics) {
      finishTask();

      if(error) {
        statusLabel.innerHTML = '<span class="text-danger">' + error + '</span>';
        return;
      }

      for (var key in topics) {
         topicLabels.push('<span class="label label-info">' + topics[key] + '</span> ');
      }

      tagsElement.innerHTML = topicLabels.join('');
    });
  }


function sentiment(itemText, sentimentElement) {
  startTask();

  var smileys = [
    '<i class="fa fa-frown-o"></i>',
    '<i class="fa fa-frown-o"></i>',
    '<i class="fa fa-meh-o"></i>',
    '<i class="fa fa-smile-o"></i>',
    '<i class="fa fa-smile-o"></i>'
  ];

  // Query sentiment analysis
  Algorithmia.query("/nlp/SentimentAnalysis", Algorithmia.api_key, itemText, function(error, sentimentScore) {
    finishTask();

    if(error) {
      statusLabel.innerHTML = '<span class="text-danger">' + error + '</span>';
      return;
    }

    sentimentElement.innerHTML = '<p>10% Positive, 1% Negative, 89% Neutral</p>';
  });
}

var numTasks = 0;
function startTask() {
  numTasks++;
  document.getElementById("algo-spinner").classList.remove("hidden");
}
function finishTask() {
  numTasks--;
  if(numTasks <= 0) {
    document.getElementById("algo-spinner").classList.add("hidden");
  }
}