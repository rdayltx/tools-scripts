// ==UserScript==
// @name          ML WebReport Export
// @namespace     Pobre's Toolbox
// @version       4.0
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
// @match         https://www.mercadolivre.com.br/afiliados/*
// @run-at        document-end
// @grant         GM_registerMenuCommand
// @grant         GM_download
// @grant         GM_addStyle
// @grant         GM_setValue
// @grant         GM_getValue
// ==/UserScript==

(function () {
  "use strict";

  // Estilos CSS
  const styles = `
    .toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 16px;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.5s;
    }
  `;

  // Função para extrair a data do elemento
  function getDateFromPage() {
    const dateElement = document.querySelector(
      ".andes-dropdown__display-values"
    );
    if (dateElement) {
      return dateElement.textContent.trim();
    }
    return "data_desconhecida"; // Valor padrão caso o elemento não seja encontrado
  }

  function coletarDados() {
    console.log("Coletando dados da página...");
    const dados = [];
    const linhas = document.querySelectorAll(
      "tr.andes-table__row.orders-table__row"
    );

    linhas.forEach((linha) => {
      const categoria = linha
        .querySelector('[data-title="Categoria do produto"] span')
        ?.textContent.trim();
      const produto = linha.querySelector('[data-title="Produtos vendidos"] a');
      const unidadesVendidas = linha
        .querySelector('[data-title="Unidades vendidas"] span')
        ?.textContent.trim();

      if (produto) {
        dados.push({
          categoria,
          produto: produto.textContent.trim(),
          link: produto.href,
          unidadesVendidas,
        });
      }
    });
    console.log(`Dados coletados: ${dados.length} itens.`);
    return dados;
  }

  function salvarPagina(dados) {
    console.log("Gerando arquivo HTML para download...");
    const dateText = getDateFromPage(); // Obtém o texto da data
    const fileName = `dados_coletados_${dateText.replace(/\s/g, "_")}.html`; // Cria o nome do arquivo dinâmico

    let conteudo = `<!DOCTYPE html>
      <html>
      <head>
          <title>Dados Coletados - ${dateText}</title>
          <meta charset="UTF-8">
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid black; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .highlight { background-color: rgba(143, 72, 236, 0.64); font-weight: bold; }
          </style>
          <script>
              function performSearch() {
                  const searchText = document.getElementById('searchBox').value.trim().toLowerCase();
                  const rows = document.querySelectorAll('#data-table tbody tr');

                  if (!searchText) {
                      rows.forEach(row => {
                          row.style.display = '';
                          const productCell = row.querySelector('td:nth-child(2)');
                          const productLink = productCell.querySelector('a');
                          if (productLink) {
                              productLink.innerHTML = productLink.textContent;
                          }
                      });
                      return;
                  }

                  rows.forEach(row => {
                      const productCell = row.querySelector('td:nth-child(2)');
                      const productLink = productCell.querySelector('a');
                      const productText = productLink ? productLink.textContent.toLowerCase() : '';

                      if (productText.includes(searchText)) {
                          row.style.display = '';
                          if (productLink) {
                              productLink.innerHTML = productLink.textContent.replace(
                                  new RegExp(searchText, 'gi'),
                                  match => '<span class="highlight">' + match + '</span>'
                              );
                          }
                      } else {
                          row.style.display = 'none';
                      }
                  });
              }
          </script>
      </head>
      <body>
          <h1>Dados Coletados da Tabela - ${dateText}</h1>
          <input type="text" id="searchBox" onkeyup="performSearch()" placeholder="Buscar produto..." style="margin-bottom: 10px; padding: 5px; width: 200px;">
          <table id="data-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Produto</th>
                  <th>Un. Vendidas</th>
                </tr>
              </thead>
              <tbody>`;

    dados.forEach((item) => {
      conteudo += `<tr>
              <td>${item.categoria}</td>
              <td><a href="${item.link}" target="_blank">${item.produto}</a></td>
              <td>${item.unidadesVendidas}</td>
          </tr>`;
    });

    conteudo += `</tbody></table></body></html>`;

    const blob = new Blob([conteudo], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName; // Usa o nome do arquivo dinâmico
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Arquivo HTML baixado com sucesso: ${fileName}`);
  }

  function navegarPelasPaginas() {
    const dadosColetados = [];
    let paginaAtual = 1;

    const paginacaoLinks = document.querySelectorAll(
      ".andes-pagination__button a"
    );
    const totalPaginas = parseInt(
      paginacaoLinks[paginacaoLinks.length - 2].textContent.trim(),
      10
    );

    console.log(`Total de páginas encontradas: ${totalPaginas}`);

    function proximaPagina() {
      console.log(`Coletando dados da página ${paginaAtual}...`);
      setTimeout(() => {
        const dados = coletarDados();

        if (dados.length === 0) {
          console.log("Nenhum dado coletado nesta página. Finalizando coleta.");
          salvarPagina(dadosColetados);
          return;
        }

        dadosColetados.push(...dados);

        const proximaPaginaButton = document.querySelector(
          ".andes-pagination__button--next a"
        );
        if (proximaPaginaButton && paginaAtual < totalPaginas) {
          console.log(
            `Página ${paginaAtual} coletada. Navegando para a próxima...`
          );
          paginaAtual++;
          proximaPaginaButton.click();
          setTimeout(proximaPagina, 3000);
        } else {
          console.log("Coleta finalizada. Baixando o arquivo HTML...");
          salvarPagina(dadosColetados);
        }
      }, 3000);
    }

    proximaPagina();
  }

  function mostrarToast(mensagem) {
    const toast = document.createElement("div");
    toast.textContent = mensagem;
    toast.className = "toast";
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "1";
    }, 100);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 3000);
  }

  function formatDateForUrl(date) {
    const dateObj = new Date(date);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const formatDate = (d) => {
      return d.toISOString().split(".")[0] + ".000-03:00";
    };

    return `${formatDate(dateObj)}--${formatDate(nextDay)}`;
  }

  function generateUrl(date) {
    const baseUrl = "https://www.mercadolivre.com.br/afiliados/dashboard";
    const dateRange = formatDateForUrl(date);
    return `${baseUrl}?filter_time_range=${encodeURIComponent(dateRange)}`;
  }

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
    datePicker.style.cssText = `
      display: block;
      margin-bottom: 10px;
      padding: 5px;
      width: 100%;
    `;

    const calendar = document.createElement("div");
    calendar.innerHTML = "<p>📅 Selecione uma data</p>";
    calendar.style.cssText = `
      font-size: 14px;
      color: #555;
      margin-bottom: 5px;
    `;

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

    modal.appendChild(calendar);
    modal.appendChild(datePicker);
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

  function checkAndAutoExport() {
    if (localStorage.getItem("ml_should_export") === "true") {
      localStorage.removeItem("ml_should_export");
      setTimeout(() => {
        const dados = [];
        mostrarToast("Coleta iniciada!");
        try {
          navegarPelasPaginas();
        } catch (error) {
          alert(`Erro durante a extração: ${error.message}`);
        }
      }, 2000);
    }
  }

  const botaoColeta = document.createElement("button");
  botaoColeta.textContent = "Iniciar Coleta";
  botaoColeta.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 10px;
    font-size: 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 9999;
  `;

  botaoColeta.addEventListener("click", createDateModal);
  document.body.appendChild(botaoColeta);

  checkAndAutoExport();
})();
