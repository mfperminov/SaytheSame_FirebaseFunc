const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setInQueue = functions.https.onCall((data, context) => {
  // Grab the text parameter - player Uuid.
  const playerUid = data.text;
  var rival, queueCount;
  admin.database().ref('/meta/queue_count').once('value').then(snapshot => {
    var queueCount = snapshot.val();
    console.log("queueCount is" + queueCount);
    //if count less then 1 or doesn't exist (empty queue) init it to 1 and
    // write playerUid in queue under path
    // ("/meta/queue_uid/:pushId/{count, player_uid}")
    if (queueCount == null || queueCount < 1) {
      queueCount = 1;
      writeToQueue(playerUid, queueCount);
    } else {
      //searching for last-in player in queue (his position -
      //current value of queueCount)
      admin.database().ref("/meta").child("queue_uid").orderByChild("count")
        .equalTo(queueCount).once("value", function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            rivalUid = childSnapshot.child("player_uid").val();
            var currentdate = new Date();
            var pushkey;
            // for both players create nodes
            // /users/:user1Uid/games/:user2Uid/:pushId/{date, result}
            // /users/:user2Uid/games/:user1Uid/:pushId/{date, result}
            // TODO replace uid with result of game (math or unmatch)
            admin.database().ref('/users/' + rivalUid + "/games")
              .push({
                uid: playerUid,
                date: currentdate.toString()
              }).then((snap) => {
                //save game to user2 with same pushId
                pushKey = snap.key;
                admin.database().ref('/users/' + playerUid + "/games/" + pushKey)
                .set({
                  uid: rivalUid,
                  date: currentdate.toString()
                });
                admin.database().ref('/games/'+pushKey).set({
                  result: "in process",
                  player1: playerUid,
                  player2: rivalUid
                });
              });
            //dequeue
            admin.database().ref("/meta/queue_count")
              .transaction(function(current_value) {
                return current_value - 1;
              });
            admin.database().ref("/meta/queue_uid/" + childSnapshot.key)
              .transaction(function(current_value) {
                return null;
              });
          });
        });
    }
  });
  return playerUid;
});

exports.writeAGuess = functions.https.onCall((data, context) => {
  const text = data.text;
  const playerUid = data.playerUid;
  const gameId = data.gameId;
  const turnNumber = data.turnNumber;
return  admin.database().ref("/games_data/"+gameId+"/"+turnNumber+"/"+playerUid)
.set(text);
});

function writeToQueue(playerUid, count) {
  admin.database().ref("/meta/queue_count")
    .transaction(function(current_value) {
      return (current_value || 0) + 1;
    });
  admin.database().ref('/meta/queue_uid').push({
    player_uid: playerUid,
    count: count
  });
}
