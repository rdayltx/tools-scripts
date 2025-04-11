// ==UserScript==
// @name          ML Double Verify WebReport Export
// @namespace     Pobre's Toolbox
// @version       4.2
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
    .progress-bar-container {
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        height: 20px;
        background-color: #f3f3f3;
        border-radius: 10px;
        overflow: hidden;
        z-index: 9999;
    }
    .progress-bar {
        height: 100%;
        background-color: #4CAF50;
        width: 0%;
        transition: width 0.3s;
    }
    .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #000;
        font-size: 12px;
        font-weight: bold;
    }
  `;

  // Adiciona os estilos ao documento
  GM_addStyle(styles);

  // Estado global
  let dadosColetados = [];
  let paginaAtual = 1;
  let totalPaginas = 1;
  let emProcessoDeColeta = false;

  // Função para extrair a data do elemento
  function getDateFromPage() {
    const dateElement = document.querySelector(
      ".andes-dropdown__display-values"
    );
    if (dateElement) {
      return dateElement.textContent.trim();
    }
    return "data_desconhecida";
  }

  // Função para criar uma barra de progresso
  function criarBarraProgresso() {
    // Remove barra existente se houver
    const barraExistente = document.querySelector(".progress-bar-container");
    if (barraExistente) {
      document.body.removeChild(barraExistente);
    }

    const container = document.createElement("div");
    container.className = "progress-bar-container";

    const barra = document.createElement("div");
    barra.className = "progress-bar";

    const texto = document.createElement("div");
    texto.className = "progress-text";
    texto.textContent = "Preparando...";

    container.appendChild(barra);
    container.appendChild(texto);
    document.body.appendChild(container);

    return {
      atualizar: function (porcentagem, mensagem) {
        barra.style.width = `${porcentagem}%`;
        texto.textContent = mensagem || `${porcentagem}%`;
      },
      remover: function () {
        document.body.removeChild(container);
      },
    };
  }

  // Aguarda elementos serem carregados na página
  function esperarElemento(seletor, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(seletor)) {
        return resolve(document.querySelector(seletor));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(seletor)) {
          observer.disconnect();
          resolve(document.querySelector(seletor));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Fallback com timeout
      setTimeout(() => {
        observer.disconnect();
        if (document.querySelector(seletor)) {
          resolve(document.querySelector(seletor));
        } else {
          reject(new Error(`Timeout ao esperar elemento: ${seletor}`));
        }
      }, timeout);
    });
  }

  // Aguarda que a página esteja carregada e estável
  async function esperarCarregamentoPagina() {
    // Primeiro espera que a tabela apareça
    try {
      await esperarElemento("tr.andes-table__row.orders-table__row", 15000);
    } catch (e) {
      console.warn("Tabela não encontrada após espera");
    }

    // Depois espera um tempo adicional para garantir que a ordenação e outros processos ocorreram
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verifica novamente se a tabela está presente
    if (!document.querySelector("tr.andes-table__row.orders-table__row")) {
      console.warn(
        "Tabela não encontrada após carregamento. Página pode estar vazia."
      );
    }
  }

  // Função para ordenar por unidades vendidas de maneira mais confiável
  async function ordenarPorUnidadesVendidas() {
    mostrarToast("Verificando ordem da tabela...");

    try {
      // Espera o cabeçalho da tabela aparecer
      const cabecalhoUnidades = await esperarElemento(
        'th[id*="head-header-quantity"] button',
        10000
      );

      // Verifica se já está ordenado corretamente
      const isDescending = cabecalhoUnidades
        .closest("th")
        .classList.contains("andes-table__header--sorted-desc");

      if (isDescending) {
        console.log(
          "Tabela já está ordenada por unidades vendidas (decrescente)"
        );
        return;
      }

      // Se não estiver ordenado, clica no cabeçalho
      mostrarToast("Ordenando por unidades vendidas...");
      cabecalhoUnidades.click();

      // Espera um pouco e verifica novamente
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verifica se agora está ordenado corretamente
      const isNowDescending = cabecalhoUnidades
        .closest("th")
        .classList.contains("andes-table__header--sorted-desc");

      // Se ainda não estiver ordenado corretamente, clica novamente
      if (!isNowDescending) {
        console.log("Clicando novamente para garantir ordem decrescente");
        cabecalhoUnidades.click();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      mostrarToast("Tabela ordenada com sucesso!");
      console.log("Ordenação concluída");
    } catch (error) {
      console.error("Erro ao ordenar tabela:", error);
      mostrarToast("Erro ao ordenar tabela, continuando sem ordenação.");
    }
  }

  // Função para detectar o número total de páginas
  function detectarTotalPaginas() {
    try {
      // Tenta encontrar o último botão numérico de paginação
      const botoesPaginacao = document.querySelectorAll(
        ".andes-pagination__button:not(.andes-pagination__button--next) a"
      );

      if (botoesPaginacao.length === 0) {
        return 1; // Se não há botões, assume que é apenas uma página
      }

      // Encontra o maior número de página
      let maxPage = 1;
      for (let i = 0; i < botoesPaginacao.length; i++) {
        const pageText = botoesPaginacao[i].textContent.trim();
        const pageNum = parseInt(pageText, 10);
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum;
        }
      }

      return maxPage;
    } catch (error) {
      console.error("Erro ao detectar total de páginas:", error);
      return 1; // Fallback para 1 página em caso de erro
    }
  }

  // Função para coletar dados da página atual de forma mais robusta
  function coletarDados() {
    try {
      console.log("Coletando dados da página atual...");
      const dados = [];

      // Seleciona todas as linhas da tabela
      const linhas = document.querySelectorAll(
        "tr.andes-table__row.orders-table__row"
      );
      console.log(`Encontradas ${linhas.length} linhas na tabela.`);

      if (linhas.length === 0) {
        console.warn("Nenhuma linha encontrada na tabela!");
        // Pode tirar um screenshot ou salvar o HTML atual para debug
      }

      linhas.forEach((linha, index) => {
        try {
          const categoriaElement = linha.querySelector(
            '[data-title="Categoria do produto"] span'
          );
          const produtoElement = linha.querySelector(
            '[data-title="Produtos vendidos"] a'
          );
          const unidadesElement = linha.querySelector(
            '[data-title="Unidades vendidas"] span'
          );
          const ganhoElement = linha.querySelector(
            '[data-title="Ganhos"] .andes-money-amount'
          );

          if (!produtoElement) {
            console.warn(`Produto não encontrado na linha ${index + 1}`);
            return;
          }

          const categoria = categoriaElement
            ? categoriaElement.textContent.trim()
            : "Categoria não encontrada";
          const produto = produtoElement.textContent.trim();
          const link = produtoElement.href;
          const unidadesVendidas = unidadesElement
            ? unidadesElement.textContent.trim()
            : "0";
          const ganho = ganhoElement
            ? ganhoElement.getAttribute("aria-label") || "Valor não encontrado"
            : "Valor não encontrado";

          dados.push({
            categoria,
            produto,
            link,
            unidadesVendidas,
            ganho,
          });
        } catch (error) {
          console.error(`Erro ao processar linha ${index + 1}:`, error);
        }
      });

      console.log(
        `Dados coletados na página ${paginaAtual}: ${dados.length} itens.`
      );
      return dados;
    } catch (error) {
      console.error("Erro ao coletar dados:", error);
      return [];
    }
  }

  // Função para navegar para a próxima página
  async function navegarParaProximaPagina() {
    try {
      const botaoProximaPagina = document.querySelector(
        ".andes-pagination__button--next a"
      );

      if (!botaoProximaPagina) {
        console.log(
          "Botão de próxima página não encontrado. Pode ser a última página."
        );
        return false;
      }

      console.log(`Navegando para a página ${paginaAtual + 1}...`);
      botaoProximaPagina.click();

      // Aguarda o carregamento da nova página
      await esperarCarregamentoPagina();

      paginaAtual++;
      console.log(`Agora na página ${paginaAtual}`);
      return true;
    } catch (error) {
      console.error("Erro ao navegar para próxima página:", error);
      return false;
    }
  }

  // Função para ordenar por ganhos
  async function ordenarPorGanhos() {
    mostrarToast("Verificando ordem da tabela por ganhos...");

    try {
      // Espera o cabeçalho da tabela aparecer
      const cabecalhoGanhos = await esperarElemento(
        'th[id*="head-header-earnings"] button',
        10000
      );

      // Verifica se já está ordenado corretamente
      const isDescending = cabecalhoGanhos
        .closest("th")
        .classList.contains("andes-table__header--sorted-desc");

      if (isDescending) {
        console.log("Tabela já está ordenada por ganhos (decrescente)");
        return;
      }

      // Se não estiver ordenado, clica no cabeçalho
      mostrarToast("Ordenando por ganhos...");
      cabecalhoGanhos.click();

      // Espera um pouco e verifica novamente
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verifica se agora está ordenado corretamente
      const isNowDescending = cabecalhoGanhos
        .closest("th")
        .classList.contains("andes-table__header--sorted-desc");

      // Se ainda não estiver ordenado corretamente, clica novamente
      if (!isNowDescending) {
        console.log(
          "Clicando novamente para garantir ordem decrescente por ganhos"
        );
        cabecalhoGanhos.click();
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      mostrarToast("Tabela ordenada por ganhos com sucesso!");
      console.log("Ordenação por ganhos concluída");
    } catch (error) {
      console.error("Erro ao ordenar tabela por ganhos:", error);
      mostrarToast(
        "Erro ao ordenar tabela por ganhos, continuando sem ordenação."
      );
    }
  }

  // Função para voltar à primeira página
  async function voltarParaPrimeiraPagina() {
    try {
      // Encontrar o link para a primeira página
      const primeiraPaginaLink = document.querySelector(
        '.andes-pagination__button:not(.andes-pagination__button--back) a[aria-label*="página 1"]'
      );

      if (primeiraPaginaLink) {
        console.log("Voltando para a primeira página...");
        primeiraPaginaLink.click();
        await esperarCarregamentoPagina();
        paginaAtual = 1;
        return true;
      } else {
        // Alternativa: se botão específico não for encontrado, tenta o "Anterior" várias vezes
        const botaoAnterior = document.querySelector(
          ".andes-pagination__button--back a"
        );
        if (botaoAnterior) {
          let tentativas = 0;
          while (paginaAtual > 1 && tentativas < 20) {
            console.log(`Voltando página ${paginaAtual} → ${paginaAtual - 1}`);
            botaoAnterior.click();
            await esperarCarregamentoPagina();
            paginaAtual--;
            tentativas++;
          }
          return true;
        }
      }

      console.warn(
        "Não foi possível encontrar um modo de voltar à primeira página"
      );
      return false;
    } catch (error) {
      console.error("Erro ao voltar para primeira página:", error);
      return false;
    }
  }

  // Função para comparar produtos e encontrar os que faltam
  function encontrarProdutosFaltantes(dadosOriginais, dadosNovos) {
    const produtosOriginais = new Map();

    // Armazena os dados originais em um mapa, usando o link como chave
    dadosOriginais.forEach((item) => {
      produtosOriginais.set(item.link, item);
    });

    // Encontra produtos nos novos dados que não estão nos originais
    const produtosFaltantes = dadosNovos.filter(
      (item) => !produtosOriginais.has(item.link)
    );

    console.log(
      `Encontrados ${produtosFaltantes.length} produtos faltantes na segunda coleta`
    );
    return produtosFaltantes;
  }

  // Função principal de coleta de dados de todas as páginas
  async function iniciarColeta() {
    if (emProcessoDeColeta) {
      mostrarToast("Uma coleta já está em andamento...");
      return;
    }

    emProcessoDeColeta = true;
    dadosColetados = [];
    paginaAtual = 1;

    const barraProgresso = criarBarraProgresso();

    try {
      // Primeiro ordenar a tabela por unidades vendidas
      await ordenarPorUnidadesVendidas();

      // Aguarda carregamento após ordenação
      await esperarCarregamentoPagina();

      // Detecta o total de páginas
      totalPaginas = detectarTotalPaginas();
      console.log(`Total de páginas detectadas: ${totalPaginas}`);

      // Loop principal de coleta
      let continuarColeta = true;

      while (continuarColeta && paginaAtual <= totalPaginas) {
        // Atualiza a barra de progresso
        const porcentagem = Math.round((paginaAtual / totalPaginas) * 100);
        barraProgresso.atualizar(
          porcentagem,
          `Coletando página ${paginaAtual} de ${totalPaginas}`
        );

        // Coleta dados da página atual
        await esperarCarregamentoPagina();
        const dadosPagina = coletarDados();

        // Se não encontrou dados, tenta novamente
        if (dadosPagina.length === 0) {
          console.warn(
            `Nenhum dado encontrado na página ${paginaAtual}. Tentando novamente...`
          );

          // Aguarda mais um pouco e tenta de novo
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const segundaTentativa = coletarDados();

          if (segundaTentativa.length === 0) {
            console.warn(
              `Segunda tentativa falhou. Continuando para próxima página...`
            );
          } else {
            console.log(
              `Segunda tentativa recuperou ${segundaTentativa.length} itens.`
            );
            dadosColetados.push(...segundaTentativa);
          }
        } else {
          dadosColetados.push(...dadosPagina);
        }

        // Verifica se é a última página
        if (paginaAtual >= totalPaginas) {
          console.log("Chegou à última página.");
          continuarColeta = false;
        } else {
          // Navega para a próxima página
          const navegacaoSucesso = await navegarParaProximaPagina();

          if (!navegacaoSucesso) {
            console.warn(
              "Falha ao navegar para a próxima página. Encerrando coleta."
            );
            continuarColeta = false;
          }
        }
      }

      barraProgresso.atualizar(
        100,
        "Primeira coleta finalizada! Verificando por ganhos..."
      );
      console.log(
        `Primeira coleta finalizada. Total de dados: ${dadosColetados.length}`
      );

      // ---- SEGUNDA FASE: VERIFICAÇÃO POR GANHOS ----
      // Guarda os dados coletados na primeira fase
      const dadosUnidadesVendidas = [...dadosColetados];

      // Volta para a primeira página
      mostrarToast("Voltando para primeira página...");
      const voltouParaPrimeiraPagina = await voltarParaPrimeiraPagina();

      if (voltouParaPrimeiraPagina) {
        // Ordena por ganhos
        await ordenarPorGanhos();

        // Aguarda carregamento após ordenação
        await esperarCarregamentoPagina();

        // Reseta dados coletados para a segunda fase
        dadosColetados = [];
        paginaAtual = 1;

        // Loop de coleta por ganhos (apenas nas primeiras páginas)
        // Vamos coletar apenas as primeiras páginas para eficiência, onde os itens com maiores ganhos estão
        const paginasVerificar = Math.min(5, totalPaginas);
        let continuarSegundaColeta = true;

        barraProgresso.atualizar(0, "Verificando itens por ganhos...");

        while (continuarSegundaColeta && paginaAtual <= paginasVerificar) {
          const porcentagem = Math.round(
            (paginaAtual / paginasVerificar) * 100
          );
          barraProgresso.atualizar(
            porcentagem,
            `Verificando por ganhos: página ${paginaAtual} de ${paginasVerificar}`
          );

          // Coleta dados da página atual
          await esperarCarregamentoPagina();
          const dadosPagina = coletarDados();

          if (dadosPagina.length > 0) {
            dadosColetados.push(...dadosPagina);
          }

          // Verifica se é a última página da verificação
          if (paginaAtual >= paginasVerificar) {
            continuarSegundaColeta = false;
          } else {
            // Navega para a próxima página
            const navegacaoSucesso = await navegarParaProximaPagina();
            if (!navegacaoSucesso) {
              console.warn(
                "Falha ao navegar para a próxima página na verificação por ganhos."
              );
              continuarSegundaColeta = false;
            }
          }
        }

        // Encontra produtos que faltaram na primeira coleta
        const produtosFaltantes = encontrarProdutosFaltantes(
          dadosUnidadesVendidas,
          dadosColetados
        );

        // Adiciona produtos faltantes ao conjunto final
        if (produtosFaltantes.length > 0) {
          console.log(
            "Produtos faltantes encontrados na verificação por ganhos:",
            produtosFaltantes
          );
          dadosUnidadesVendidas.push(...produtosFaltantes);
          mostrarToast(
            `Encontrados ${produtosFaltantes.length} produtos adicionais!`
          );
        }

        // Ordena todos os dados por unidades vendidas para manter consistência
        dadosUnidadesVendidas.sort(
          (a, b) =>
            parseInt(b.unidadesVendidas || 0, 10) -
            parseInt(a.unidadesVendidas || 0, 10)
        );

        // Finaliza a coleta com todos os dados
        barraProgresso.atualizar(100, "Coleta finalizada!");
        console.log(
          `Coleta finalizada. Total de dados: ${dadosUnidadesVendidas.length}`
        );

        // Salva os dados
        if (dadosUnidadesVendidas.length > 0) {
          mostrarToast(
            `Coleta finalizada! ${dadosUnidadesVendidas.length} itens coletados no total.`
          );
          salvarPagina(dadosUnidadesVendidas);
        } else {
          mostrarToast("Coleta finalizada, mas nenhum dado foi encontrado!");
        }
      } else {
        // Se não conseguiu voltar à primeira página, salva só os dados da primeira coleta
        mostrarToast(
          `Não foi possível fazer a verificação por ganhos. Salvando ${dadosUnidadesVendidas.length} itens.`
        );
        salvarPagina(dadosUnidadesVendidas);
      }
    } catch (error) {
      console.error("Erro durante a coleta:", error);
      mostrarToast("Erro durante a coleta de dados!");
    } finally {
      emProcessoDeColeta = false;
      setTimeout(() => barraProgresso.remover(), 3000);
    }
  }

  function salvarPagina(dados) {
    console.log("Gerando arquivo HTML para download...");
    const dateText = getDateFromPage();
    const fileName = `dados_coletados_${dateText.replace(/\s/g, "_")}.html`;

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
              .stats { margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
              .category-group { margin-bottom: 10px; }
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
              
              function toggleCategoryStats() {
                  const statsElement = document.getElementById('category-stats');
                  if (statsElement.style.display === 'none') {
                      statsElement.style.display = 'block';
                  } else {
                      statsElement.style.display = 'none';
                  }
              }
          </script>
      </head>
      <body>
          <h1>Dados Coletados da Tabela - ${dateText}</h1>
          <div class="stats">
              <h2>Estatísticas Gerais</h2>
              <p>Total de produtos: <strong>${dados.length}</strong></p>
              <p>Total de unidades vendidas: <strong>${dados.reduce(
                (total, item) =>
                  total + parseInt(item.unidadesVendidas || 0, 10),
                0
              )}</strong></p>
              <button onclick="toggleCategoryStats()">Mostrar/Ocultar Estatísticas por Categoria</button>
              
              <div id="category-stats" style="display: none;">
                  <h3>Produtos por Categoria</h3>`;

    // Agrupa por categoria
    const categorias = {};
    dados.forEach((item) => {
      const categoria = item.categoria || "Sem categoria";
      if (!categorias[categoria]) {
        categorias[categoria] = {
          count: 0,
          unidades: 0,
        };
      }
      categorias[categoria].count++;
      categorias[categoria].unidades += parseInt(
        item.unidadesVendidas || 0,
        10
      );
    });

    // Adiciona estatísticas por categoria
    Object.keys(categorias)
      .sort()
      .forEach((categoria) => {
        conteudo += `
      <div class="category-group">
        <p><strong>${categoria}</strong>: ${categorias[categoria].count} produtos, ${categorias[categoria].unidades} unidades vendidas</p>
      </div>`;
      });

    conteudo += `
              </div>
          </div>
          
          <input type="text" id="searchBox" onkeyup="performSearch()" placeholder="Buscar produto..." style="margin-bottom: 10px; padding: 5px; width: 300px;">
          <table id="data-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Produto</th>
                  <th>Un. Vendidas</th>
                  <th>Ganhos</th>
                </tr>
              </thead>
              <tbody>`;

    dados.forEach((item) => {
      conteudo += `<tr>
              <td>${item.categoria || ""}</td>
              <td><a href="${item.link}" target="_blank">${
        item.produto
      }</a></td>
              <td>${item.unidadesVendidas || ""}</td>
              <td>${item.ganho || ""}</td>
          </tr>`;
    });

    conteudo += `</tbody></table></body></html>`;

    const blob = new Blob([conteudo], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`Arquivo HTML gerado com sucesso: ${fileName}`);
  }

  function mostrarToast(mensagem) {
    const toastExistente = document.querySelector(".toast");
    if (toastExistente) {
      document.body.removeChild(toastExistente);
    }

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
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
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

  async function checkAndAutoExport() {
    if (localStorage.getItem("ml_should_export") === "true") {
      localStorage.removeItem("ml_should_export");
      setTimeout(async () => {
        try {
          mostrarToast("Iniciando coleta automática...");
          await iniciarColeta();
        } catch (error) {
          console.error("Erro durante a exportação automática:", error);
          mostrarToast(`Erro durante a coleta: ${error.message}`);
        }
      }, 2000);
    }
  }

  // Cria o botão de coleta
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

  botaoColeta.addEventListener("click", () => {
    // Em vez de abrir o modal, inicia diretamente a coleta na página atual
    iniciarColeta();
  });

  // Cria um botão separado para a seleção de data
  const botaoData = document.createElement("button");
  botaoData.textContent = "Selecionar Data";
  botaoData.style.cssText = `
    position: fixed;
    top: 10px;
    right: 130px;
    padding: 10px;
    font-size: 16px;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 9999;
  `;

  botaoData.addEventListener("click", createDateModal);

  document.body.appendChild(botaoColeta);
  document.body.appendChild(botaoData);

  // Verifica se deve iniciar uma exportação automática
  checkAndAutoExport();
})();
