// ==UserScript==
// @name        New script
// @namespace     Pobre's Toolbox
// @version       2.6
// @icon          https://raw.githubusercontent.com/rdayltx/userscripts/master/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         https://www.mercadolivre.com.br/afiliados/*
//
// @run-at        document-end
//
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
//
// ==/UserScript==

(function () {
  "use strict";

  function mlRelatorioExport() {
    console.log("Iniciando mlRelatorioExport...");

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js";
    script.onload = function () {
      console.log("Biblioteca xlsx carregada com sucesso.");
      mainMlExport();
    };
    script.onerror = function () {
      console.error("Erro ao carregar a biblioteca xlsx.");
    };
    document.head.appendChild(script);

    function mainMlExport() {
      console.log("Função mainMlExport iniciada.");
      let allData = [];
      let currentPage = 0;

      // Format date for MercadoLivre URL
      function formatDateForUrl(date) {
        const dateObj = new Date(date);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);

        const formatDate = (d) => {
          return d.toISOString().split(".")[0] + ".000-03:00";
        };

        return `${formatDate(dateObj)}--${formatDate(nextDay)}`;
      }

      // Generate complete URL for a specific date
      function generateUrl(date) {
        const baseUrl = "https://www.mercadolivre.com.br/afiliados/dashboard";
        const dateRange = formatDateForUrl(date);
        return `${baseUrl}?filter_time_range=${encodeURIComponent(dateRange)}`;
      }

      // Create date selection modal
      function createDateModal() {
        const modal = document.createElement("div");
        modal.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 10000;
                `;

        const datePicker = document.createElement("input");
        datePicker.type = "date";
        datePicker.style.marginBottom = "15px";
        datePicker.style.padding = "5px";

        const confirmButton = document.createElement("button");
        confirmButton.textContent = "Confirmar";
        confirmButton.style.cssText = `
                    background: #007BFF;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 10px;
                `;

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancelar";
        cancelButton.style.cssText = `
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                `;

        modal.appendChild(datePicker);
        modal.appendChild(document.createElement("br"));
        modal.appendChild(confirmButton);
        modal.appendChild(cancelButton);

        confirmButton.onclick = () => {
          if (datePicker.value) {
            localStorage.setItem("ml_export_date", datePicker.value);
            localStorage.setItem("ml_should_export", "true");
            window.location.href = generateUrl(datePicker.value);
          }
        };

        cancelButton.onclick = () => {
          document.body.removeChild(modal);
          document.body.removeChild(overlay);
        };

        const overlay = document.createElement("div");
        overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 9999;
                `;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
      }

      // Function to check if we should auto-export
      function checkAndAutoExport() {
        if (localStorage.getItem("ml_should_export") === "true") {
          localStorage.removeItem("ml_should_export"); // Clear the flag
          setTimeout(() => {
            allData = [];
            showLoading("Extraindo dados...");
            try {
              scrapeTable();
              goToNextPage();
            } catch (error) {
              alert(`Erro durante a extração: ${error.message}`);
              hideLoading();
            }
          }, 2000); // Wait for page to load
        }
      }

      function showLoading(message) {
        let loadingDiv = document.getElementById("loadingIndicator");
        if (!loadingDiv) {
          loadingDiv = document.createElement("div");
          loadingDiv.id = "loadingIndicator";
          loadingDiv.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        padding: 20px;
                        background-color: #000;
                        color: #fff;
                        z-index: 10000;
                        border-radius: 8px;
                    `;
          document.body.appendChild(loadingDiv);
        }
        loadingDiv.textContent = message;
      }

      function hideLoading() {
        const loadingDiv = document.getElementById("loadingIndicator");
        if (loadingDiv) loadingDiv.remove();
      }

      function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
              clearInterval(interval);
              resolve(element);
            }
          }, 100);
          setTimeout(() => {
            clearInterval(interval);
            reject(new Error("Elemento não encontrado no tempo limite."));
          }, timeout);
        });
      }

      function scrapeTable() {
        const table = document.querySelector(
          ".andes-table.general-orders-table"
        );
        if (!table) {
          alert("Tabela não encontrada. Verifique se está na página correta.");
          return;
        }

        // Extrai cabeçalhos (apenas na primeira página)
        if (currentPage === 0) {
          const headers = [];
          const headerCells = table.querySelectorAll(
            "thead.andes-table__head th"
          );
          headerCells.forEach((header, index) => {
            if (index !== 0 && index !== 3) {
              // Ignora colunas A (índice 0) e C (índice 3)
              headers.push(header.textContent.trim());
            }
          });
          allData.push(headers); // Adiciona os cabeçalhos como primeira linha na planilha
          currentPage = 1;
        }

        // Extrai linhas de dados
        const rows = table.querySelectorAll(
          ".andes-table__row.orders-table__row"
        );
        const pageData = [];
        rows.forEach((row) => {
          const rowData = [];
          row.querySelectorAll("td").forEach((cell, index) => {
            if (index !== 0 && index !== 3) {
              // Ignora colunas A (índice 0) e D (índice 3)
              rowData.push(cell.textContent.trim());
            }
          });
          pageData.push(rowData);
        });

        allData = allData.concat(pageData);
      }

      async function goToNextPage() {
        try {
          const nextButton = document.querySelector(
            ".andes-pagination__button--next"
          );
          if (
            nextButton &&
            !nextButton.classList.contains("andes-pagination__button--disabled")
          ) {
            nextButton.querySelector("a").click();
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Espera para o carregamento
            scrapeTable();
            await goToNextPage(); // Chama recursivamente até não haver próxima página
          } else {
            exportToXLSX();
          }
        } catch (error) {
          alert(`Erro ao navegar para a próxima página: ${error.message}`);
        }
      }

      function getDateRangeFromSpan() {
        const spanElement = document.querySelector(
          "#\\:Rmlicq\\:-display-values"
        );
        if (spanElement) {
          return spanElement.textContent.trim().replace(/\s+/g, "_");
        }
        return null;
      }

      function exportToXLSX() {
        const dateRange = getDateRangeFromSpan();
        const fileName = dateRange
          ? `Métricas_ML_${dateRange}.xlsx`
          : `Métricas_ML_${new Date().getDate().toString().padStart(2, "0")}-${(
              new Date().getMonth() + 1
            )
              .toString()
              .padStart(2, "0")}.xlsx`;

        // Processa os dados para remover "R$" e configurar colunas como números
        const processedData = allData.map((row, index) => {
          if (index === 0) return row; // Mantém os cabeçalhos inalterados

          // Converte a coluna "B" (índice 1) em número inteiro, se aplicável
          if (row[1]) {
            const intValue = parseInt(row[1], 10);
            row[1] = !isNaN(intValue) ? intValue : row[1];
          }

          return row;
        });

        // Cria a planilha a partir dos dados processados
        const worksheet = XLSX.utils.aoa_to_sheet(processedData);

        // Formata células das coluna "B" como números
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const colC = XLSX.utils.encode_cell({ r: R, c: 1 }); // Coluna "B" (índice 1)

          if (worksheet[colC] && typeof worksheet[colC].v === "number") {
            worksheet[colC].t = "n"; // Tipo "n" para números
          }
        }

        // Adiciona largura automática e largura fixa para a coluna "A"
        const colWidths = processedData[0].map((_, index) => {
          if (index === 0) return { width: 80 }; // Define largura fixa para a coluna "A"
          return { width: 18 }; // Largura padrão para outras colunas
        });
        worksheet["!cols"] = colWidths;

        // Adiciona filtros automáticos
        worksheet["!autofilter"] = {
          ref: XLSX.utils.encode_range(range),
        };

        // Cria o workbook e adiciona a planilha
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tabela");

        // Salva o arquivo Excel
        XLSX.writeFile(workbook, fileName);
        alert("Exportação concluída!");
        hideLoading();
      }

      // Create export button
      const exportButton = document.createElement("button");
      exportButton.textContent = "Exportar Tabela";
      exportButton.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                padding: 10px;
                background-color: #007BFF;
                color: #fff;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            `;
      exportButton.onclick = createDateModal;
      document.body.appendChild(exportButton);

      // Check for auto-export on page load
      checkAndAutoExport();
    }
  }

  // Aguarda o DOM estar completamente carregado antes de executar o script
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mlRelatorioExport);
  } else {
    mlRelatorioExport();
  }
})();
