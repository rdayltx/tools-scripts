// ==UserScript==
// @name          Amazon ASIN Highlighter
// @namespace     https://amazon.com.br/
// @version       2.3
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @author        DayLight
// @description   Destaca produtos na Amazon com ASINs no Firebase e permite adicionar novos, incluindo o nome de quem adicionou.
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

  let db;
  let currentASIN = null;
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();

  firebase
    .auth()
    .signInAnonymously()
    .then(() => {
      main();
      setupUrlChangeDetection();
    })
    .catch(console.error);

  function setupUrlChangeDetection() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      triggerUrlChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      triggerUrlChange();
    };

    window.addEventListener("popstate", triggerUrlChange);

    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        triggerUrlChange();
      }
    }, 500);
  }

  function triggerUrlChange() {
    const newASIN = getASIN();
    if (newASIN !== currentASIN) {
      currentASIN = newASIN;
      main();
    }
  }

  function main() {
    const existingBtn = document.getElementById("asin-button");
    if (existingBtn) existingBtn.remove();

    const asin = getASIN();
    if (asin) {
      checkASIN(asin).then((doc) => {
        addASINButton(asin, doc);
      });
    }
  }

  function getASIN() {
    const match = window.location.href.match(/\/(?:dp|gp\/product)\/(\w{10})/);
    return match ? match[1] : null;
  }

  function checkASIN(asin) {
    return db.collection("asins").doc(asin).get();
  }

  function getUserName() {
    let userName = localStorage.getItem("userName");
    if (!userName) {
      userName = prompt("Por favor, insira seu nome:");
      if (userName) {
        localStorage.setItem("userName", userName);
      } else {
        showToast("Nome do usuário é necessário para adicionar ASINs.", 5000);
        return null;
      }
    }
    return userName;
  }

  function addASINButton(asin, doc) {
    const btn = document.createElement("button");
    btn.id = "asin-button";

    if (doc.exists) {
      // Verifica se "addedBy" existe; se não, usa "pobre" como padrão
      const addedBy = doc.data().addedBy || "Pobre";
      btn.innerHTML = `✔️ ASIN Cadastrado por ${addedBy}`;
      btn.style.background = "#00c400"; // Verde para indicar que já foi cadastrado
      btn.style.cursor = "not-allowed";
      btn.disabled = true; // Desabilita o botão, pois o ASIN já existe
    } else {
      btn.innerHTML = "➕ Add ASIN";
      btn.style.background = "#4285f4"; // Azul para indicar que pode ser adicionado
      btn.style.cursor = "pointer";
    }

    btn.style.cssText += `
      position: fixed;
      bottom: 20px;
      right: 150px;
      padding: 10px 15px;
      color: white;
      border: none;
      border-radius: 5px;
      z-index: 9999;
      font-family: Arial;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    `;

    btn.addEventListener("click", () => {
      if (doc.exists) return;

      const userName = getUserName();
      if (!userName) return;

      db.collection("asins")
        .doc(asin)
        .set({
          added: new Date().toISOString(),
          url: window.location.href,
          addedBy: userName,
        })
        .then(() => {
          showToast("ASIN Adicionado com sucesso!");
          btn.innerHTML = `✔️ ASIN Cadastrado por ${userName}`;
          btn.style.background = "#00c400";
          btn.style.cursor = "not-allowed";
          btn.disabled = true;
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
