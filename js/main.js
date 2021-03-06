// $(document).ready(function(){
//   chooseSettings();
// })

soundManager.setup({
  url: '../swf/',
  flashVersion: 9, // optional: shiny features (default = 8)
  // optional: ignore Flash where possible, use 100% HTML5 mode
  // preferFlash: false,
  onready: function() {
    chooseSettings();
  }
})

function chooseSettings(){
  $(".game-space").css("z-index", 5);
  $(".setting").on("click", function(e){
    switch (this.value){
      case "easy": 
        initGame([[3000,4000], 35, $(window).width()/3, 4]);
        break;
      case "normal":
        initGame([[2000,3500], 25, $(window).width()/3, 5]);
        break;
      case "hard":
        initGame([[1000,3000], 20, $(window).width()/3, 6]);
        break;
    }
  })
}

function initGame(settings){
  var timeRange = settings[0]; //determines how long it takes for the flying objects to traverse the screen
  var accuracy = settings[1]; //the error margin that counts as a successful strike
  var maxDistance = settings[2]; //determines how fast the objects fly
  var numOfObjects = settings[3]; //the max number of objects that can appear at one time
  var scoreBoard = [0,3];

  var slashLines = {
    red: {
      line: null,
      letter: {name:"D", code:100},
      upperEnd: {top:225,left:350},
      lowerEnd: {top:525,left:1000}
    },
    green: {
      line: null,
      letter: {name:"J", code:106},
      upperEnd: {top:225,left:800},
      lowerEnd: {top:525,left:500}
    },  
    blue: {
      line: null,
      letter: {name:"F", code:102},
      upperEnd: {top:225,left:550},
      lowerEnd: {top:525,left:700}
    },  
    black: {
      line: null,
      letter: {name:"K", code:107},
      upperEnd: {top:225,left:950},
      lowerEnd: {top:525,left:900}
    }
  };

  $(".game-space").empty();
  $(".game-space").css("z-index", 1);
  $("<canvas id='canvas' height='300' width='1440'></canvas>").appendTo(".game-space");
  $("<img src='images/clear4.png' class='flash-pic' id='clear4'>").appendTo(".game-space");

  slashLines = setupSlashLines(slashLines);
  scoreBoard = playGame(slashLines, timeRange, maxDistance, accuracy, numOfObjects, scoreBoard);
}

function setupSlashLines(slashLines){
  $.each(slashLines, function(key, value){
    value.line = Object.create(SlashLine);
    value.line.id = key;
    value.line.letter = value.letter;
    value.line.upperEnd = value.upperEnd;
    value.line.lowerEnd = value.lowerEnd;
    // value.line.gradient = (value.lowerEnd.top - value.upperEnd.top) / (value.lowerEnd.left - value.upperEnd.left);
    // value.line.intercept = value.line.gradient * value.lowerEnd.left - value.lowerEnd.top;
    value.line.calculateGradient();
    value.line.calculateIntercept();
    value.line.placeEndPoints();
  })
  return slashLines;
}

function playGame(slashLines, timeRange, maxDistance, accuracy, numOfObjects,scoreBoard){
  var results = null;
  var currentTurn = 1;
  var slashLine = pickLines(slashLines);
  var flyingObjects = slashLine.generateObjects(timeRange, maxDistance, numOfObjects);


  $("body").on("keypress", function(e){
    e.preventDefault();
    console.log(e);
    var strikeLine = findLine(e, slashLines);
    results = strikeLine.strike(flyingObjects, accuracy);
    console.log(results);
    flyingObjects = results[1];
    scoreBoard = checkResults(results, scoreBoard, slashLines, timeRange, maxDistance, accuracy, numOfObjects, currentTurn);
  });

  var safeWord = setInterval(function(){
      var numOnScreen = 0;
      $.each(flyingObjects, function(index, flyingObject){
        flyingObject.fly();
        numOnScreen += isOnScreen(flyingObject);
      })
      currentTurn = numOnScreen;
      if (!currentTurn){
        clearInterval(safeWord);
        scoreBoard = checkResults(results, scoreBoard, slashLines, timeRange, maxDistance, accuracy, numOfObjects, currentTurn);
      }
  },5)
  return scoreBoard;
}


function pickLines(slashLines){
  var lineIndex = Math.ceil(Math.random()*4);
  switch (lineIndex){
    case 1:
      return slashLines.red.line;
    case 2:
      return slashLines.green.line;
    case 3:
      return slashLines.blue.line;
    case 4:
      return slashLines.black.line;
  }
}

function findLine(e, slashLines){
  console.log(e.keyCode);
  var slashLine;
  $.each(slashLines, function(key, value){
    console.log("the line code is: "+value.letter.code)
    if (value.letter.code === e.keyCode) {
      slashLine = value.line;
      $("#canvas")[0].getContext("2d").strokeStyle=key;
    }
  })
  return slashLine;
}

//this function keeps score and determines the outcome of the game, it is called after every keypress, or if no keypress event, at the end of the turn
function checkResults(results, scoreBoard, slashLines, timeRange, maxDistance, accuracy, numOfObjects, currentTurn){
  if (currentTurn){
    results[0] ? (scoreBoard[0] += 10*Math.pow(results[0],2)) : scoreBoard[1]--;
    showFlash(results[0]);
  }
  else if (results === null){
      scoreBoard[1]--;
  }
  displayOutcome(scoreBoard);

  if (scoreBoard[1] <= 0){
    $("body").off();
    setTimeout(function(){
      endGame(scoreBoard);
    },700);
  }
  else if ((!currentTurn) || results[1].length === 0){
    $('.flying-object').remove();
    $("body").off();
    playGame(slashLines, timeRange, maxDistance, accuracy, numOfObjects, scoreBoard);
  }
  return scoreBoard;
}

function displayOutcome(scoreBoard){
  for (i=3-scoreBoard[1]; i>0; i--){
    if ($(".life-icon").length > scoreBoard[1]){
      $($(".life-icon")[0]).remove();
    }
  }
  $(".score").text(scoreBoard[0]);
  return scoreBoard;
}

function isOnScreen(flyingObject){
  var position = flyingObject.physicalBody.offset().left;
  if (flyingObject.direction) {
    return position < -50 ? 0 : 1;
  }
  else {
    return (position > ($(window).width()+50)) ? 0 : 1;
  } 
}

function endGame(scoreBoard){
  var gameSpace = $(".game-space");
  gameSpace.empty();
  $("<h1 class='game-over'>Game Over</h1>").appendTo(gameSpace);
  $("<div class='final-score'>Score: "+scoreBoard[0]+"</div>").appendTo(gameSpace);
  $(".score-board").addClass("invisible");
  $(".game-space").css("z-index", 5);
  var playAgain = $("<button id='replay-button'>Click to Replay</button>").appendTo(gameSpace);
  playAgain.on("click", function(){
    window.location.reload();
  });
}

function showFlash(bonus){
  var sound = Object.create(SoundEffect);
  var score = $(".score");
  var gameSpace = $(".game-space");
  var bonusSign = $(".bonus-sign");
  switch (bonus) {
    case 6:
      sound.play("clear6");
      bonusSign.text("X6!!!");
      var clear6 = $("#clear6");
      setTimeout(function(){
        bonusSign.removeClass("invisible");
        bonusSign.addClass("animated slideInUp");
        clear6.addClass("animated bounceInRight");
        score.addClass("animated pulse");
        gameSpace.addClass("animated shake");
      },50);
      setTimeout(function(){
        clear6.addClass("bounceOutLeft");
        bonusSign.addClass("slideOutUp");
      },500);
    break;
    case 5:
      sound.play("clear5");
      bonusSign.text("X5!!");
      var clear5 = $("#clear5");
      setTimeout(function(){
        bonusSign.removeClass("invisible");
        bonusSign.addClass("animated slideInUp");
        clear5.addClass("animated bounceInRight");
        score.addClass("animated pulse");
        gameSpace.addClass("animated shake");
      },50);
      setTimeout(function(){
        clear5.addClass("bounceOutLeft");
        bonusSign.addClass("slideOutUp");
      },500);
    break;
    case 4:
      sound.play("clear4");
      var clear4 = $("#clear4");
      bonusSign.text("X4!");
      setTimeout(function(){
        bonusSign.removeClass("invisible");
        bonusSign.addClass("animated slideInUp");
        clear4.addClass("animated bounceInRight");
        score.addClass("animated pulse");
        gameSpace.addClass("animated shake");
      },50);
      setTimeout(function(){
        clear4.addClass("bounceOutLeft");
        bonusSign.addClass("slideOutUp");
      },400);
    break;
    case 3:
      sound.play("normal");
      bonusSign.text("X3");
      setTimeout(function(){
        bonusSign.removeClass("invisible");
        bonusSign.addClass("animated slideInUp");
        score.addClass("animated pulse");
        gameSpace.addClass("animated shake");
      },50);
      setTimeout(function(){
        bonusSign.addClass("slideOutUp");
      },400);
    break;
    case 2:
      sound.play("normal");
      bonusSign.text("X2");
      setTimeout(function(){
        bonusSign.removeClass("invisible");
        bonusSign.addClass("animated slideInUp");
        score.addClass("animated pulse");
      },50);
      setTimeout(function(){
        bonusSign.addClass("slideOutUp");
      },400);
    break;
    case 1:
      sound.play("normal");
      setTimeout(function(){
        score.addClass("animated pulse");
    },50);
    break;
    default:
      sound.play("miss");
  }
  $(".flash-pic").removeClass("animated bounceInRight bounceOutLeft");
  score.removeClass("animated pulse");
  gameSpace.removeClass("animated shake");
  bonusSign.removeClass("animated slideInUp slideOutUp");
  bonusSign.addClass("invisible");
}


