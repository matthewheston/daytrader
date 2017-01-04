function getParameterByName(name, url) {
      if (!url) url = window.location.href;
      url = url.toLowerCase(); // This is just to avoid case sensitiveness
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
              results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(function() {
  var socket = io();
  var room = getParameterByName("room");
  var player = getParameterByName("player");
  var chatType = player + ": ";
  socket.emit("room", room);

  socket.on("room-full", function() {
    $("#waiting").hide();
    $("#submitButton").prop('disabled', false);
  });

  $("#submitButton").click(function() {
    var data = {};
    data["personalRate"] = $("#personalRate").val();
    data["groupRate"] = $("#groupRate").val();
    if (parseInt(data["personalRate"]) + parseInt(data["groupRate"]) != 10) {
      $("body").append('<p class="disposable">Personal and group contributions must add up to 10</p>');
    } else {
      $(".disposable").remove();
      data["room"] = room;
      data["player"] = player;

      $("#submitButton").prop("disabled", true);

      socket.emit("submit", data);
    }
  });

  socket.on("increment-round", function(round) {
    $("#currentRound").text(round);
    if ((round-1) % 3 == 0) {
      $("#chat-container").show();
      $("#submitButton").prop("disabled", true);
      setTimeout(function() {
        $("#chat-container").hide();
        $("#submitButton").prop("disabled", false);
      }, 120000);
    }
    if (round > 10) {
      var finalScore = $("#myTotal").text();
      $("body").empty();
      $("body").append("<p>You have completed the exercise. Your final score was " + finalScore);
    }
  });
  socket.on("group-total", function(groupTotal) {
    currentVal = parseInt($("#myTotal").text()); 
    individualContribution = 2 * parseInt($("#personalRate").val());
    groupContribution = 3 * groupTotal;
    console.log(individualContribution);
    console.log(groupContribution);
    $("#myTotal").text(parseInt(currentVal + individualContribution + groupContribution));
    $("body").append('<p class="disposable">You made $' + parseInt(individualContribution + groupContribution) + " this round.");
    $("#submitButton").prop("disabled", false);
  });

  // chat
  $('form').submit(function(){
    socket.emit('chat-message', {'chat': chatType + $('#m').val(), 'room': room});
    $('#m').val('');
    return false;
  });
  socket.on('chat-message', function(msg){
    $("#chat-box").scrollTop(document.getElementById("chat-box").scrollHeight);
    $('#messages').append($('<li>').text(msg));
  });
});
