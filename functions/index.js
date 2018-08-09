const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setInQueue = functions.https.onCall((data, context) => {
  // Grab the text parameter - player Uuid.
  const playerUid = data.text;
  var rival;
  admin.database().ref('/meta/queue_count').once('value').then(snapshot => {
    var count;
    //if count less then 1 or doesn't exist (empty queue) init it to 1 and
    // write playerUid in queue under path
    // ("/meta/queue_uid/:pushId/{count, player_uid}")
    if (snapshot.val() == null || snapshot.val() < 1) {
      queueCount = 1;
      writeToQueue(playerUid, queueCount);
    } else {
      queueCount = snapshot.val();
      //searching for last-in player in queue (his position -
      //current value of queueCount)
      admin.database().ref("/meta").child("queue_uid").orderByChild("count")
        .equalTo(queueCount).on("value", function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            rivalUid = childSnapshot.child("player_uid").val();
            var currentdate = new Date();
            var pushkey;
            // for both players create nodes
            // /users/:user1Uid/games/:user2Uid/:pushId/{date, result}
            // /users/:user2Uid/games/:user1Uid/:pushId/{date, result}
            // TODO replace uid with result of game (math or unmatch)
            admin.database().ref('/users/' + rivalUid + "/games/" + playerUid)
              .push({
                uid: playerUid,
                date: currentdate.toString()
              }).then((snap) => {
                //save game to user2 with same pushId
                pushKey = snap.key;
                admin.database().ref('/users/' + playerUid + "/games/" + rivalUid
                 + "/" + pushKey).set({
                    uid: rivalUid,
                    date: currentdate.toString()
                  });
              });
            queueCount = queueCount - 1;
            admin.database().ref("/meta/queue_uid/" + childSnapshot.key).set(null);
            admin.database().ref('/meta/queue_count').set(queueCount);
          });
        });
    }
  });
  return playerUid;
});

function writeToQueue(playerUid, count) {
  admin.database().ref('/meta/queue_count').set(count);
  admin.database().ref('/meta/queue_uid').push({
    player_uid: playerUid,
    count: count
  });
}
