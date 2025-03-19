// ==UserScript==
// @name          Amazon ASIN Highlighter
// @namespace     https://amazon.com.br/
// @version       1.7
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
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
    storageBucket: "amz-asin.appspot.com",
    messagingSenderId: "967791356293",
    appId: "1:967791356293:web:f72c98b63cfdabfd3d7cec",
  };

  let db;
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();

  firebase
    .auth()
    .signInAnonymously()
    .then(() => main())
    .catch(console.error);

  function main() {
    const asin = getASIN();
    if (asin) {
      checkASIN(asin).then((exists) => {
        addASINButton(asin, exists);
        // if (exists) highlightProduct();
      });
    }
  }

  function getASIN() {
    const match = window.location.href.match(/\/dp\/(\w{10})/);
    return match ? match[1] : null;
  }

  function checkASIN(asin) {
    return db
      .collection("asins")
      .doc(asin)
      .get()
      .then((doc) => doc.exists)
      .catch((error) => {
        console.error("Firestore error:", error);
        return false;
      });
  }

  // function highlightProduct() {
  //   const indicator = document.createElement("div");
  //   indicator.style.cssText = `
  //     position: fixed;
  //     bottom: 15px;
  //     right: 380px;
  //     width: 50px;
  //     height: 50px;
  //     background:#00c400;
  //     border-radius: 50%;
  //     z-index: 9999;
  //     box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  //   `;
  //   document.body.appendChild(indicator);
  // }

  function addASINButton(asin, exists) {
    const btn = document.createElement("button");
    btn.innerHTML = exists ? "✔️ ASIN Cadastrado" : "➕ Add ASIN";

    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 150px;
      padding: 10px 15px;
      background: ${exists ? "#00c400" : "#4285f4"};
      color: white;
      border: none;
      border-radius: 5px;
      cursor: ${exists ? "not-allowed" : "pointer"};
      z-index: 9999;
      font-family: Arial;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    `;

    btn.disabled = exists;

    btn.addEventListener("click", () => {
      if (exists) return;

      db.collection("asins")
        .doc(asin)
        .set({
          added: new Date().toISOString(),
          url: window.location.href,
        })
        .then(() => {
          showToast("ASIN Adicionado com sucesso!");
          // highlightProduct();
          btn.innerHTML = "✔️ ASIN Cadastrado";
          btn.style.background = "#999";
          btn.style.cursor = "not-allowed";
          btn.disabled = true;
          exists = true;
        })
        .catch((error) => {
          console.error("Save error:", error);
          showToast("Erro ao salvar ASIN!", 5000);
        });
    });

    document.body.appendChild(btn);
  }

  function showToast(message, duration = 3000) {
    const toast = document.createElement("div");
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(0, 0, 0, 0.8)",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "5px",
      zIndex: "10000",
      fontSize: "14px",
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }
})();
