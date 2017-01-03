function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

$(function () {
  var socket = io();
  $("#create-room").click(function () {
    var uuid = generateUUID();
    var myLink = "/daytrader/?player=" + $("#playerName").val().replace(" ", "_") + "&room=" + uuid;
    var partnerLink = "/daytrader/?room=" + uuid;
    socket.emit("room-setup", {"keyword": $("#sessionName").val().toLowerCase(), "url": partnerLink});
    $(".welcome").append('<p><a href="' + myLink +'">Click here</a> to begin.</p>');
  });
  $("#join-room").click(function() {
    if ($("#playerName").val()) {
      $("#enterName").remove();
      socket.emit("get-rooms");
    } else {
      $(".welcome").append('<p id="enterName">Please enter your name first.</p>');
    }
  });
  socket.on("send-to-room", function(data) {
    console.log(data);
    if (data[0] == $("#sessionName").val().toLowerCase())
      window.location = data[1];
  });
  socket.on("room-list", function(roomList) {
    $.each(roomList, function(roomName) {
      $(".welcome").append('<ul id="rooms"></li>');
      $("#rooms").append('<li><a href="{0}">{1}</a></li>'.format(roomList[roomName] + "&player=" + $("#playerName").val(), roomName));
    });
  });
});
