App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    $.getJSON('../candidates.json', function(data) {
      var candRow = $('.row-card');

      var candTemplate = $('.template');
      for (i = 0; i < data.length; i ++) {
        candTemplate.attr("display","flex");
        candTemplate.find('.card-title').text(data[i].name);
        candTemplate.find('img').attr('src', data[i].picture);
        candTemplate.find('.btn-vote').attr('data-id', data[i].id);
        candRow.append(candTemplate.html());
      }
    });
    $('.template').hide();
    $('#chartContainer').hide();


    return App.initWeb3();
  },

  initWeb3: async function() {
     // Modern dapp browsers...
      if (window.ethereum) {
        App.web3Provider = window.ethereum;
        try {
          // Request account access
          await window.ethereum.enable();
        } catch (error) {
          // User denied account access...
          console.error("User denied account access")
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
      }
      // If no injected web3 instance is detected, fall back to Ganache
      else {
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      }
      web3 = new Web3(App.web3Provider);
      return App.initContract();
  },

  initContract: function() {
       $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);
      App.isVoted();
      App.listenForEvents();
    });
    return App.bindEvents();
  },

  bindEvents: async function() {
    App.timer();
    window.ethereum.on('accountsChanged', function (accounts) {
    // Time to reload your interface with accounts[0]!
     $('#chartContainer').hide();
     App.isVoted();
    });
    $('.btn-vote').click(App.castVote);
    $('.btn-result').click(App.showResult);
  },

  castVote: function() {
    candidateId = $(this).attr("data-id");
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId,{from: web3.eth.accounts[0] });
    }).then(function(){App.isVoted();});



  },

  showResult:async function() {
    var dataChart =[];
    var results = await App.contracts.Election.deployed().then(function(instance) { return instance.results({from: web3.eth.accounts[0] })});
    //get result into array for display
    for (var i = 0; i < results.length; i++) {
      var cand = await App.contracts.Election.deployed().then(function(instance) { return instance.candidates(i);});
      dataChart.push({y: results[i].toNumber(),label: cand[1]});
    }

    App.chartDisplay(dataChart);
},
  chartDisplay: function(dataChart){
    var chart = new CanvasJS.Chart("chartContainer", {
    theme: "light2", // "light1", "light2", "dark1", "dark2"
    animationEnabled: true,
    title:{
      text: "Election Results"
    },

    axisY: {
    title: "Votes"
    },
    data: [
    {
      // Change type to "doughnut", "line", "splineArea", etc.
      type: "column",
      showInLegend: false,
      dataPoints: dataChart
    }
    ]
  });
  chart.render();
  $('#chartContainer').show();
},
isVoted(){
  App.contracts.Election.deployed().then(function(instance) { return instance.voters(web3.eth.accounts[0]);}).then(function(acc){
      if(acc)
        $(".btn-vote").hide();
      else
        $(".btn-vote").show();
      });
  },

listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        if($("#chartContainer").is(":visible")){
          App.showResult();
        }
      });
    });
  },

timer: function(){
  setInterval(async function() {
    var countDownDate = await App.contracts.Election.deployed().then(function(instance) { return instance.getTime({from: web3.eth.accounts[0] })});


    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate.toNumber()*1000 - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    document.getElementById("demo").innerHTML =days + "d " + hours + "h "
    + minutes + "m " + seconds + "s ";


  },1000);
}


};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
