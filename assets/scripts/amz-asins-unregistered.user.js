// ==UserScript==
// @name          Amazon ASIN Highlighter (Unregistered)
// @namespace     https://amazon.com.br/
// @version       2.8
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @author        DayLight
// @description   Destaca produtos na Amazon não cadastrados no Firebase, incluindo resultados de busca, produtos relacionados e seções de compra conjunta.
// @match         https://www.amazon.com.br/*
// @grant         none
// @require       https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js
// @require       https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js
// @require       https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js
// @downloadURL   https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/scripts/amz-asins-unregistered.user.js
// @updateURL     https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/scripts/amz-asins-unregistered.user.js
// ==/UserScript==

(function () {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyAfMl8dnRMlO2F4CLpCe0SreCALS_xmdVg",
    authDomain: "amz-asin.firebaseapp.com",
    projectId: "amz-asin",
    storageBucket: "amz-asin.firestoragebase.app",
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
    // Remove a mensagem "Produto não cadastrado!" se existir
    const existingWarning = document.querySelector(
      'div[style*="background-color: rgb(255, 107, 107)"]'
    );
    if (existingWarning) {
      existingWarning.remove();
    }

    // Limpa botões anteriores
    const existingBtns = document.querySelectorAll("#asin-button");
    existingBtns.forEach((btn) => btn.remove());

    const asin = getASIN();
    if (asin) {
      checkASIN(asin).then((doc) => {
        addASINButton(asin, doc);
        highlightProductIfUnregistered(asin, doc);
      });
    }

    // Destacar produtos em resultados de busca e seções específicas
    highlightSearchResults();
  }

  function getASIN() {
    const match = window.location.href.match(/\/(?:dp|gp\/product)\/(\w{10})/);
    return match ? match[1] : null;
  }

  function checkASIN(asin) {
    return db.collection("asins").doc(asin).get();
  }

  function highlightSearchResults() {
    // Seletores abrangentes para capturar diferentes tipos de produtos
    const productSelectors = [
      // Resultados de busca e carrosséis padrão
      '.s-result-item[data-asin]:not([data-asin=""])',
      '.a-carousel-card[data-asin]:not([data-asin=""])',

      // Seções específicas da Amazon
      '.a-section .a-spacing-base[data-asin]:not([data-asin=""])',

      // Produtos relacionados e compra conjunta
      '[data-csa-c-type="item"][data-csa-c-item-type="asin"]:not([data-csa-c-item-id=""])',
      '.p13n-sc-uncoverable-faceout[data-asin]:not([data-asin=""])',

      // Seletor genérico para elementos com ASIN
      '[data-asin]:not([data-asin=""])',

      // Seções específicas como "Comprados juntos" ou "Vistos juntos"
      '.a-carousel-container [data-a-carousel-id]:not([data-a-carousel-id=""])',
    ];

    const productElements = document.querySelectorAll(
      productSelectors.join(", ")
    );

    productElements.forEach((productEl) => {
      // Apenas pula se o próprio elemento for um botão de "Adicionar ao carrinho"
      if (
        productEl.classList.contains("a-button") ||
        productEl.classList.contains("a-button-primary") ||
        productEl.classList.contains("a-button-text") ||
        productEl.id === "averageCustomerReviews" ||
        productEl.classList.contains(
          "_tell-amazon-desktop_style_tell_amazon_div__1YDZk"
        ) ||
        productEl.classList.contains(
          "_cr-ratings-histogram_style_ratings-histogram-card-data__dudeB"
        ) ||
        productEl.classList.contains(
          "_Y3Itb_media-thumbnail-container_2MRZY"
        ) ||
        (productEl.classList.contains("ax-atc") &&
          productEl.classList.contains("celwidget") &&
          productEl.classList.contains("atc-btn-container"))
        // (
        //   productEl.classList.contains("a-column") &&
        //     productEl.classList.contains("a-span6") &&
        //     productEl.classList.contains("a-span-last")
        // )
      ) {
        return; // Pula para o próximo elemento
      }

      // Extrai o ASIN de diferentes atributos possíveis
      const asin =
        productEl.getAttribute("data-asin") ||
        productEl
          .getAttribute("data-csa-c-item-id")
          ?.replace("amzn1.asin.", "");

      if (asin && asin.length === 10) {
        checkASIN(asin)
          .then((doc) => {
            if (!doc.exists) {
              // Adiciona destaque para produtos não registrados
              const highlightStyle = {
                border: "2px solid #ff6b6b",
                borderRadius: "5px",
                padding: "5px",
                position: "relative",
                boxSizing: "border-box", // Novo estilo adicionado
                display: "inline-block", // Garante que o elemento respeite as dimensões
              };

              Object.assign(productEl.style, highlightStyle);

              // Adiciona ícone de aviso
              if (!productEl.querySelector(".unregistered-warning")) {
                const warningIcon = document.createElement("div");
                warningIcon.innerHTML = "⚠️ Não Cadastrado";
                warningIcon.style.cssText = `
                background-color: #ff6b6b;
                color: white;
                font-size: 10px;
                padding: 2px 5px;
                position: absolute;
                top: -1px; // Ajuste fino de posicionamento
                right: -1px;
                border-radius: 0 5px 0 3px;
                z-index: 10;
                line-height: 1.2;
                font-family: Arial,sans-serif;
              `;

                // Verifica se já não existe um ícone de aviso
                if (!productEl.querySelector(".unregistered-warning")) {
                  warningIcon.classList.add("unregistered-warning");
                  productEl.appendChild(warningIcon);
                }
              }
            }
          })
          .catch(console.error);
      }
    });
  }

  function highlightProductIfUnregistered(asin, doc) {
    const productContainer = document.querySelector(
      "#centerCol, .product-details"
    );

    if (!doc.exists) {
      if (productContainer) {
        productContainer.style.border = "3px solid #ff6b6b";
        productContainer.style.borderRadius = "10px";

        const warningText = document.createElement("div");
        warningText.textContent = "Produto não cadastrado!";
        warningText.style.cssText = `
          background-color: #ff6b6b;
          color: white;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          margin-bottom: 10px;
        `;

        productContainer.insertBefore(warningText, productContainer.firstChild);
      }
    }
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
      // Se o ASIN já existe, mostra em verde com informação de quem adicionou
      const addedBy = doc.data().addedBy || "Pobre";
      btn.innerHTML = `✔️ ASIN Já Cadastrado por ${addedBy}`;
      btn.style.background = "#00c400"; // Verde
      btn.style.cursor = "not-allowed";
      btn.disabled = true;
    } else {
      // Se o ASIN não existe, destaca em vermelho para indicar que pode ser adicionado
      btn.innerHTML = "⚠️ Adicionar ASIN Não Cadastrado";
      btn.style.background = "#ff6b6b"; // Vermelho
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
          added: new Date().toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
          }),
          url: window.location.href,
          addedBy: userName,
        })
        .then(() => {
          showToast("ASIN Adicionado com sucesso!");
          btn.innerHTML = `✔️ ASIN Cadastrado por ${userName}`;
          btn.style.background = "#00c400";
          btn.style.cursor = "not-allowed";
          btn.disabled = true;

          // Remove o destaque vermelho após adicionar
          const productContainer = document.querySelector(
            "#centerCol, .product-details"
          );
          if (productContainer) {
            productContainer.style.border = "none";
            const warningText = productContainer.querySelector(
              'div[style*="background-color: #ff6b6b"]'
            );
            if (warningText) warningText.remove();
          }
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
