// ==UserScript==
// @name          Mercado Livre afiliados Search
// @namespace     Pobre's Toolbox
// @version       1.3
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         http://localhost:1918/*
// @run-at        document-end
// @grant         GM_registerMenuCommand
// @grant         GM_addStyle
// @grant         GM_setValue
// @grant         GM_getValue
//
// ==/UserScript==

(function () {
  "use strict";

  function mercadoLivreSearch() {
    console.log("Mercado Livre Search script loaded successfully");

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
          width: 97%;
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
          max-height: calc(180vh - 150px);
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
          background-color: rgba(143, 72, 236, 0.64);
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
        .split(/(\s+|\+)/)
        .filter((k) => k.trim().length > 0);

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

      function highlightKeywords(text) {
        if (!text) return "";
        let highlighted = text;
        const sortedKeywords = [...keywords].sort(
          (a, b) => b.length - a.length
        );
        for (const keyword of sortedKeywords) {
          const regex = new RegExp(`\\b(${keyword})\\b`, "gi");
          highlighted = highlighted.replace(
            regex,
            '<span class="highlight">$1</span>'
          );
        }
        return highlighted;
      }

      // Buscar nas linhas da tabela do Mercado Livre
      const results = new Set();
      const rows = document.querySelectorAll("#data-table tbody tr");

      rows.forEach((row) => {
        const productCell = row.querySelector("td:nth-child(2) a");
        if (productCell) {
          const productText = productCell.textContent.trim();
          if (containsAllKeywords(productText)) {
            results.add(row);
          }
        }
      });

      // Mostrar resultados
      results.forEach((row) => {
        const categoria = row
          .querySelector("td:nth-child(1)")
          .textContent.trim();
        const productCell = row.querySelector("td:nth-child(2) a");
        const unidadesVendidas = row
          .querySelector("td:nth-child(3)")
          .textContent.trim();

        if (!productCell) return;

        const productText = productCell.textContent.trim();
        const productLink = productCell.href;

        const resultItem = document.createElement("div");
        resultItem.className = "result-item";

        resultItem.innerHTML = `
          <div class="result-title">
            <a href="${productLink}" target="_blank">${highlightKeywords(
          productText
        )}</a>
          </div>
          <div class="result-stats">
            <div class="stat-item">
              <span class="stat-label">Unidades Vendidas:</span>
              <span class="stat-value">${unidadesVendidas}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Categoria:</span>
              <span class="stat-value">${categoria}</span>
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
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchContainer.style.display =
          searchContainer.style.display === "none" ? "block" : "none";
        if (searchContainer.style.display === "block") {
          searchInput.focus();
        }
      } else if (
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

  mercadoLivreSearch();
})();
