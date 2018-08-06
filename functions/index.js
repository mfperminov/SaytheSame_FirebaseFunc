const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();
// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.setInQueue = functions.https.onCall((data, context) => {
  // Grab the text parameter.
  const text = data.text;
  var rival;
  admin.database().ref('/meta/queue_count').once('value').then(snapshot => {
    var count;
    if (snapshot.val() == null) {
      count = 1;
    } else {
      count = snapshot.val();
      admin.database().ref("/meta").child("queue_uid").orderByChild("count").equalTo(count).on("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          rival = childSnapshot.child("text").val();
          var currentdate = new Date();
          var ref1 = admin.database().ref('/users/' + rival);
          var ref2 = admin.database().ref('/users/' + text);
          ref1.once("value").then(function(ref1snap) {
            if (!ref1snap.hasChild("games")) {
              admin.database().ref('/users/' + rival).update({
                games: "games"
              });
            }
          });
          ref2.once("value").then(function(ref2snap) {
            if (!ref2snap.hasChild("games")) {
              admin.database().ref('/users/' + text).update({
                games: "games"
              });
            }
          });
          admin.database().ref('/users/' + rival + "/games").push({
            id: text,
            date: currentdate.toString()
          });
          admin.database().ref('/users/' + text + "/games").push({
            id: rival,
            date: currentdate.toString()
          });
        });
      });
      count++;
    }
    admin.database().ref('/meta/queue_count').set(count);
    admin.database().ref('/meta/queue_uid').push({
      text: text,
      count: count
    });

  });
  return text;
});
