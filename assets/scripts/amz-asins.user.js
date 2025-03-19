// ==UserScript==
// @name          Amazon ASIN Highlighter
// @namespace     https://amazon.com.br/
// @version       1.1
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
// @description   Destaca produtos na Amazon com ASINs no Firebase e permite adicionar novos.
// @match         https://www.amazon.com.br/*
// @grant         none
// @require       https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js
// @require       https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js
// @require       https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js
// @downloadURL   https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/scripts/amz-asins.user.js
// @updateURL     https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/scripts/amz-asins.user.js
// ==/UserScript==

(function () {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyAfMl8dnRMlO2F4CLpCe0SreCALS_xmdVg",
    authDomain: "amz-asin.firebaseapp.com",
    projectId: "amz-asin",
    storageBucket: "amz-asin.firebasestorage.app",
    messagingSenderId: "967791356293",
    appId: "1:967791356293:web:f72c98b63cfdabfd3d7cec",
  };

  // Initialize Firebase
  let db;
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();

  // Anonymous authentication with state handling
  firebase
    .auth()
    .signInAnonymously()
    .then(() => {
      console.log("Authenticated anonymously");
      main();
    })
    .catch((error) => {
      console.error("Authentication error:", error);
    });

  function main() {
    const asin = getASIN();
    if (asin) {
      checkASIN(asin);
      addASINButton(asin);
    }
  }

  function getASIN() {
    const match = window.location.href.match(/\/dp\/(\w{10})/);
    return match ? match[1] : null;
  }

  function checkASIN(asin) {
    db.collection("asins")
      .doc(asin)
      .get()
      .then((doc) => {
        if (doc.exists) highlightProduct();
      })
      .catch((error) => {
        console.error("Firestore error:", error);
      });
  }

  function highlightProduct() {
    const indicator = document.createElement("div");
    indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #00ff00;
            border-radius: 50%;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;
    document.body.appendChild(indicator);
  }

  function addASINButton(asin) {
    const btn = document.createElement("button");
    btn.textContent = "➕ Add ASIN";
    btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 150px;
            padding: 10px 15px;
            background: #4285f4;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 9999;
            font-family: Arial;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        `;

    btn.addEventListener("click", () => {
      db.collection("asins")
        .doc(asin)
        .set({
          added: new Date().toISOString(),
          url: window.location.href,
        })
        .then(() => {
          alert("ASIN added successfully!");
          highlightProduct();
        })
        .catch((error) => {
          console.error("Save error:", error);
          alert("Error saving ASIN");
        });
    });

    document.body.appendChild(btn);
  }
})();
