// ==UserScript==
// @name          Amazon Associates Search
// @namespace     Pobre's Toolbox
// @version       1.2
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         https://associados.amazon.com.br/p/reporting/earnings
// @run-at        document-end
// @grant         GM_registerMenuCommand
// @grant         GM_addStyle
// @grant         GM_setValue
// @grant         GM_getValue
//
// ==/UserScript==

(function () {
  "use strict";

  function amazonAssociatesSearch() {
    console.log("Amazon Associates Search script loaded successfully");
    // Busca Avançada em Tabela
    //description:  Realiza busca em tabela com exibição formatada dos resultados

    // Estilos CSS
    const styles = `
      .search-container {
          position: fixed;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          background: #19191c;
          padding: 5px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          display: none;
          width: 90%;
          max-width: 1000px;
          font-family: Arial, sans-serif;
      }

      .search-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 15px;
          transition: border-color 0.3s;
      }

      .search-input:focus {
          border-color: #6816d6;
          outline: none;
      }

      .results-container {
          max-height: calc(80vh - 150px);
          overflow-y: auto;
          padding: 0px 5px 0px 5px;
      }

      .result-item {
          background: white;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          cursor: pointer;
          transition: all 0.2s;
      }

      .result-item:hover {
          background: #f8f9fa;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      }

      .result-title {
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
          font-size: 14px;
          line-height: 1.4;
      }

      .result-stats {
          margin-top: 8px;
          font-size: 13px;
          color: #666;
          display: flex;
          align-items: center;
          gap: 16px;
      }

      .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
      }

      .stat-item:not(:last-child):after {
          content: '|';
          margin-left: 16px;
          color: #ddd;
      }

      .stat-label {
          color: #666;
      }

      .stat-value {
          font-weight: bold;
          color: #333;
      }

      .highlight {
          background-color:rgba(143, 72, 236, 0.64);
          font-weight: bold;
      }
  `;

    // Adicionar estilos ao documento
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Criar e adicionar elementos da UI
    const searchContainer = document.createElement("div");
    searchContainer.className = "search-container";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "search-input";
    searchInput.placeholder = "Digite sua busca...";

    const resultsContainer = document.createElement("div");
    resultsContainer.className = "results-container";

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(resultsContainer);
    document.body.appendChild(searchContainer);

    // Função para realizar a busca
    function performSearch(searchText) {
      resultsContainer.innerHTML = "";

      if (!searchText.trim()) return;

      // Normaliza o texto de pesquisa e divide em palavras-chave
      const keywords = searchText
        .toLowerCase()
        .split(/(\s+|\+)/) // Divide por espaços ou "+"
        .filter((k) => k.trim().length > 0);

      // Função para normalizar texto (remover acentos e caracteres especiais)
      function normalizeText(text) {
        if (typeof text !== "string") return "";
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-zA-Z0-9\+]/g, "");
      }

      function containsAllKeywords(text) {
        const normalizedText = normalizeText(text);
        return keywords.every((keyword) =>
          normalizeText(keyword)
            .split(" ")
            .every((k) => normalizedText.includes(k))
        );
      }

      // Função para destacar palavras-chave no texto
      function highlightKeywords(text) {
        if (!text) return "";
        let highlighted = text;

        // Ordena as keywords por tamanho (maior para menor) para evitar problemas de sobreposição
        const sortedKeywords = [...keywords].sort(
          (a, b) => b.length - a.length
        );

        for (const keyword of sortedKeywords) {
          // Usa uma expressão regular para corresponder apenas a palavras inteiras
          const regex = new RegExp(`\\b(${keyword})\\b`, "gi");
          highlighted = highlighted.replace(
            regex,
            '<span class="highlight">$1</span>'
          );
        }

        return highlighted;
      }

      // Buscar nas linhas da tabela
      const results = new Set();
      const rows = document.querySelectorAll("tr");

      rows.forEach((row) => {
        const cells = row.cells;
        if (cells && cells.length >= 6) {
          const title = cells[0].innerText.trim();
          if (containsAllKeywords(title)) {
            results.add(row);
          }
        }
      });

      // Mostrar resultados
      results.forEach((row) => {
        const cells = row.cells;
        if (!cells) return;

        const title = cells[0].innerText.trim();
        const directOrders = cells[3].innerText.trim();
        const indirectOrders = cells[4].innerText.trim();
        const totalOrders = cells[5].innerText.trim();

        const resultItem = document.createElement("div");
        resultItem.className = "result-item";

        // Extrair o ID e o título
        const titleElement = cells[0].querySelector(".title-text");
        if (!titleElement) {
          console.warn("Elemento .title-text não encontrado em:", cells[0]);
          return; // Pula este item
        }

        const idElement = titleElement.querySelector(".item-id");
        const id = idElement ? idElement.textContent.trim() : "";
        const titleText = titleElement.textContent.replace(id, "").trim();

        resultItem.innerHTML = `
              <div class="result-title">${highlightKeywords(
                `${id} - ${titleText}`
              )}</div>
              <div class="result-stats">
                  <div class="stat-item">
                      <span class="stat-label">Pedidos Diretos:</span>
                      <span class="stat-value">${directOrders}</span>
                  </div>
                  <div class="stat-item">
                      <span class="stat-label">Pedidos Indiretos:</span>
                      <span class="stat-value">${indirectOrders}</span>
                  </div>
                  <div class="stat-item">
                      <span class="stat-label">Total:</span>
                      <span class="stat-value">${totalOrders}</span>
                  </div>
              </div>
          `;

        resultItem.addEventListener("click", () => {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          const originalBackground = row.style.backgroundColor;
          row.style.backgroundColor = "#fff3cd";
          setTimeout(() => {
            row.style.backgroundColor = originalBackground;
          }, 2000);
        });

        resultsContainer.appendChild(resultItem);
      });

      if (results.size === 0) {
        const noResults = document.createElement("div");
        noResults.className = "result-item";
        noResults.textContent = "Nenhum resultado encontrado";
        resultsContainer.appendChild(noResults);
      }
    }

    // Atalhos de teclado
    document.addEventListener("keydown", function (e) {
      // Ctrl+Shift+F para abrir/fechar a busca
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchContainer.style.display =
          searchContainer.style.display === "none" ? "block" : "none";
        if (searchContainer.style.display === "block") {
          searchInput.focus();
        }
      }
      // Esc para fechar
      else if (
        e.key === "Escape" &&
        searchContainer.style.display === "block"
      ) {
        searchContainer.style.display = "none";
      }
    });

    // Evento de busca ao digitar
    let searchTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => performSearch(this.value), 300);
    });

    // Abrir automaticamente ao carregar a página
    window.addEventListener("load", function () {
      searchContainer.style.display = "block";
      searchInput.focus();
    });
  }

  amazonAssociatesSearch();
})();
