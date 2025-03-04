// ==UserScript==
// @name         Highlight Tracked itens keepa
// @namespace    Pobre's Toolbox
// @version       4.4
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match        https://keepa.com/*
//
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @downloadURL   https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/keepa-highlight.user.js
// @updateURL     https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/keepa-highlight.user.js
// ==/UserScript==

(function () {
  "use strict";

  const gistUrl =
    "https://gist.githubusercontent.com/rdayltx/022f62a2b1db02547b1159e3813a0c46/raw/d3fea1c437f2d77972cf9ae8b72a8f51839bfa5b/asin_list.json";
  const storageKey = "trackedCodes";
  const updateInterval = 5 * 60 * 1000; // 1 minutos
  const newImageUrl =
    "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/image/award-icon.svg";
  const processedRows = new Set(); // Armazena linhas já processadas

  // Debounce para evitar execução excessiva
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Carrega os códigos alvo do JSON
  function loadTargetCodes(callback) {
    console.log("Carregando códigos alvo do Gist...");
    GM_xmlhttpRequest({
      method: "GET",
      url: gistUrl,
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          const targetCodes = data.codes || [];
          console.log(
            `Códigos alvo carregados: ${targetCodes.length} códigos.`
          );
          GM_setValue(storageKey, targetCodes); // Armazena os códigos no storage
          callback(targetCodes); // Passa os códigos para a função de callback
        } catch (error) {
          console.error("Erro ao processar o JSON:", error);
          callback([]);
        }
      },
      onerror: function (error) {
        console.error("Erro ao carregar o JSON:", error);
        callback([]);
      },
    });
  }

  // Substitui as imagens nas linhas correspondentes
  function replaceImages(targetCodes) {
    // console.log("Substituindo imagens...");
    const rows = document.querySelectorAll(
      '.data-container.text_long.asin div[role="row"]'
    );
    console.log(`Total de linhas encontradas: ${rows.length}`);

    rows.forEach((row) => {
      if (processedRows.has(row)) {
        // console.log(`Linha já processada: ${row}`);
        return; // Ignora linhas já processadas
      }

      const asinElement = row.querySelector('div[col-id="asin"]');
      if (asinElement) {
        const asin = asinElement.textContent.trim();
        // console.log(`Verificando ASIN: ${asin}`);

        if (targetCodes.includes(asin)) {
          const img = row.querySelector(".gridDomainCell img");
          if (img) {
            console.log(`Substituindo imagem na linha com ASIN: ${asin}`);
            img.src = newImageUrl;
            processedRows.add(row); // Marca a linha como processada
          }
        }
      }
    });
  }

  // Destaca o texto nas linhas correspondentes
  function highlightText(targetCodes) {
    // console.log("Destacando texto...");
    const rows = document.querySelectorAll(
      '.data-container.text_long.asin div[role="row"]'
    );
    console.log(`Total de linhas encontradas: ${rows.length}`);

    rows.forEach((row) => {
      const asinElement = row.querySelector('div[col-id="asin"]');
      if (asinElement) {
        const asin = asinElement.textContent.trim();
        // console.log(`Verificando ASIN: ${asin}`);

        if (targetCodes.includes(asin)) {
          console.log(`Destacando linha com ASIN: ${asin}`);
          row.style.backgroundColor = "#FDF7E6";
          row.style.color = "black";
        }
      }
    });
  }

  // Atualiza os códigos e aplica as alterações
  function updateCodes() {
    console.log("Atualizando códigos...");
    loadTargetCodes((targetCodes) => {
      highlightText(targetCodes);
      replaceImages(targetCodes);
    });
  }

  // Inicializa o script
  function init() {
    console.log("Inicializando script...");
    const storedCodes = GM_getValue(storageKey, []);
    console.log(`Códigos armazenados: ${storedCodes.length} códigos.`);

    highlightText(storedCodes);
    replaceImages(storedCodes);
    updateCodes();
    setInterval(updateCodes, updateInterval);
  }

  // Observador de mutação com debounce
  const observer = new MutationObserver(
    debounce(() => {
      console.log("Mudanças detectadas no DOM. Processando...");
      const storedCodes = GM_getValue(storageKey, []);
      highlightText(storedCodes);
      replaceImages(storedCodes);
    }, 200)
  ); // Debounce de 200ms

  // Função para iniciar o observador após 10 segundos
  function startObserver() {
    console.log("Procurando contêiner da tabela...");
    const tableContainer = document.querySelector(
      ".data-container.text_long.asin"
    );
    if (tableContainer) {
      console.log("Contêiner da tabela encontrado. Iniciando observador...");
      observer.observe(tableContainer, { childList: true, subtree: true });
    } else {
      console.error(
        "Contêiner da tabela não encontrado. Tentando novamente em 10 segundos..."
      );
      setTimeout(startObserver, 4000); // Tenta novamente após 4 segundos
    }
  }

  // Função para esperar a classe "loadingFlipper" desaparecer
  function waitForLoadingToComplete() {
    return new Promise((resolve) => {
      const checkLoading = () => {
        const loadingElement = document.querySelector(".loadingFlipper");
        if (!loadingElement) {
          console.log("Loading completo. Iniciando script...");
          resolve();
        } else {
          console.log("Aguardando loading...");
          setTimeout(checkLoading, 500); // Verifica a cada 500ms
        }
      };
      checkLoading();
    });
  }

  // Inicia o script após o carregamento da página
  window.addEventListener("load", () => {
    console.log("Página carregada. Aguardando 5 segundos...");
    setTimeout(async () => {
      console.log("Aguardando loadingFlipper desaparecer...");
      await waitForLoadingToComplete();

      updateCodes(); // Atualiza os códigos imediatamente ao carregar a página

      setTimeout(startObserver, 3000); // Espera 3 segundos antes de procurar o contêiner
    }, 2000); // Espera 2 segundos antes de iniciar
  });
})();
