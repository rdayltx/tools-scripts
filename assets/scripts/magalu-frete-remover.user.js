// ==UserScript==
// @name          Magalu Frete Remover
// @namespace     Pobre's Toolbox
// @version       1.0
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         *://sacola.magazinevoce.com.br/*
//
// @run-at        document-start
//
//
// ==/UserScript==
(function () {
  "use strict";

  // Função para criar o botão
  function createToggleButton() {
    const button = document.createElement("button");
    button.innerHTML = "Alternar Frete";
    button.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 9999;
              padding: 10px 20px;
              background-color: #0086ff;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
          `;
    document.body.appendChild(button);
    return button;
  }

  // Função para extrair valor numérico de uma string
  function extractValue(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/[^\d,]/g, "").replace(",", "."));
  }

  // Função para formatar valor em moeda
  function formatCurrency(value) {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  }

  // Função principal para alternar os valores
  function toggleShipping() {
    const freteElement = document.querySelector(
      "#root > div > div > div.App.clearfix > div > div.OrderReview > div.OrderReview-container > div.OrderReview-rightContainer > div > div.OrderReviewTotals-shipment > span.OrderReviewTotals-right"
    );
    const pixElement = document.querySelector(
      "#root > div > div > div.App.clearfix > div > div.OrderReview > div.OrderReview-container > div.OrderReview-rightContainer > div > div.OrderReviewTotals-total > span.OrderReviewTotals-right > div > span.OrderReviewTotal__cash"
    );
    const cartaoElement = document.querySelector(
      "#root > div > div > div.App.clearfix > div > div.OrderReview > div.OrderReview-container > div.OrderReview-rightContainer > div > div.OrderReviewTotals-total > span.OrderReviewTotals-right > div > span.OrderReviewTotal__to"
    );
    const totalContainer = cartaoElement?.parentElement;

    if (!freteElement || !pixElement || !cartaoElement) {
      console.log("Elementos não encontrados");
      return;
    }

    // Lê os valores atuais
    const freteValue = extractValue(freteElement.textContent);
    const pixValue = extractValue(pixElement.textContent);
    const cartaoValue = extractValue(cartaoElement.textContent);

    // Toggle estado
    const button = document.querySelector("#toggleFreteButton");
    const isFreteRemoved = button.dataset.removed === "true";

    if (!isFreteRemoved) {
      // Configura o estilo inicial do container
      const cartaoElement = document.querySelector(
        "#root > div > div > div.App.clearfix > div > div.OrderReview > div.OrderReview-container > div.OrderReview-rightContainer > div > div.OrderReviewTotals-total > span.OrderReviewTotals-right > div > span.OrderReviewTotal__to"
      );
      if (cartaoElement) {
        const totalContainer = cartaoElement.parentElement;
        totalContainer.style.display = "flex";
        totalContainer.style.flexDirection = "column";
        totalContainer.style.gap = "8px";
      }

      // Remover frete - subtrai do valor atual
      cartaoElement.textContent = `${formatCurrency(
        cartaoValue - freteValue
      )} no Cartão`;
      pixElement.textContent = `${formatCurrency(
        pixValue - freteValue
      )} no Pix`;
      button.dataset.removed = "true";
      button.style.backgroundColor = "#ff4444";
    } else {
      // Reativar frete - simplesmente recarrega os valores originais da página
      window.location.reload();
    }

    // Mantém a quebra de linha
    if (totalContainer) {
      totalContainer.style.display = "flex";
      totalContainer.style.flexDirection = "column";
      totalContainer.style.gap = "8px";
    }
  }

  // Função de inicialização
  function init() {
    const button = createToggleButton();
    button.id = "toggleFreteButton";
    button.dataset.removed = "false";
    button.addEventListener("click", toggleShipping);
  }

  // Aguardar carregamento da página
  window.addEventListener("load", function () {
    setTimeout(init, 1000); // Aguarda 1 segundo para garantir que todos os elementos estejam carregados
  });
})();
