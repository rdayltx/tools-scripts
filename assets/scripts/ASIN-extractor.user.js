// ==UserScript==
// @name         Amazon ASIN Capturer Enhanced
// @namespace    Pobre's Toolbox
// @version      1.7
// @description  Capture ASIN from Amazon product page and send to GitHub Gist in a unique and incremental JSON list
// @author       DayLight
// @icon         https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @match        https://www.amazon.com.br/*
// @match        https://keepa.com/*
// @exclude     *://keepa.com/keepaBox.html
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL   https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/scripts/ASIN-extractor.user.js
// @updateURL     https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/scripts/ASIN-extractor.user.js
// ==/UserScript==

(function () {
  "use strict";

  // Configurações
  // Função para armazenar o token do GitHub
  function setGitHubToken(token) {
    GM_setValue("GITHUB_TOKEN", token);
  }

  // Função para recuperar o token do GitHub
  function getGitHubToken() {
    return GM_getValue("GITHUB_TOKEN", ""); // Retorna uma string vazia se o token não estiver definido
  }

  function initializeGitHubToken() {
    let token = getGitHubToken();
    if (!token) {
      token = prompt("Por favor, insira seu token do GitHub:");
      if (token) {
        setGitHubToken(token);
        console.log("Token do GitHub armazenado com sucesso!");
      } else {
        console.error("Nenhum token foi fornecido.");
      }
    }
    return token;
  }

  // Inicializa o token do GitHub
  const GITHUB_TOKEN = initializeGitHubToken();
  if (!GITHUB_TOKEN) {
    alert("Token do GitHub não encontrado. O script não pode continuar.");
    return;
  }

  const GIST_ID = "022f62a2b1db02547b1159e3813a0c46"; // Deixe vazio para criar um novo Gist ou insira o ID do Gist existente
  const GIST_FILENAME = "asin_list.json";

  // Lista de palavras conhecidas que são frequentemente confundidas com ASINs
  const FALSE_POSITIVES = [
    "PAGINATION",
    "NAVIGATION",
    "JAVASCRIPT",
    "SEARCHFORM",
    "BACKGROUND",
    "CATEGORIES",
    "NEWSLETTER",
    "SUBMISSION",
    "DECORATION",
    "TELEVISION",
    "DEPARTMENT",
    "SMARTPHONE",
    "MARKETPLACE",
  ];

  // Função para criar um novo Gist
  function createNewGist(content) {
    GM_xmlhttpRequest({
      method: "POST",
      url: "https://api.github.com/gists",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      data: JSON.stringify({
        description: "Lista de ASINs da Amazon",
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(content, null, 2),
          },
        },
      }),
      onload: function (response) {
        if (response.status === 201) {
          const gistUrl = JSON.parse(response.responseText).html_url;
          console.log(`Novo Gist criado com sucesso!\nURL do Gist: ${gistUrl}`);
        } else {
          alert("Erro ao criar novo Gist: " + response.responseText);
        }
      },
      onerror: function (error) {
        alert("Erro de rede ao tentar criar novo Gist.");
      },
    });
  }

  // Função para recuperar o conteúdo atual do Gist
  function fetchGistContent(callback) {
    if (!GIST_ID) {
      callback({ codes: [] });
      return;
    }

    GM_xmlhttpRequest({
      method: "GET",
      url: `https://api.github.com/gists/${GIST_ID}`,
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      onload: function (response) {
        if (response.status === 200) {
          const gistData = JSON.parse(response.responseText);
          const content = gistData.files[GIST_FILENAME].content;
          callback(JSON.parse(content));
        } else if (response.status === 404) {
          alert("Gist não encontrado. Criando um novo Gist...");
          callback({ codes: [] });
        } else {
          alert("Erro ao recuperar o Gist: " + response.responseText);
        }
      },
      onerror: function (error) {
        alert("Erro de rede ao tentar recuperar o Gist.");
      },
    });
  }

  // Função para atualizar o Gist com o novo conteúdo
  function updateGist(content) {
    const url = GIST_ID
      ? `https://api.github.com/gists/${GIST_ID}`
      : "https://api.github.com/gists";
    const method = GIST_ID ? "PATCH" : "POST";

    GM_xmlhttpRequest({
      method: method,
      url: url,
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      data: JSON.stringify({
        description: "Lista de ASINs da Amazon",
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(content, null, 2),
          },
        },
      }),
      onload: function (response) {
        if (response.status === 200 || response.status === 201) {
          const gistUrl = JSON.parse(response.responseText).html_url;
          console.log(`ASIN adicionado com sucesso!\nURL do Gist: ${gistUrl}`);
          showTemporaryNotification(
            `ASIN ${
              content.codes[content.codes.length - 1]
            } adicionado com sucesso!`
          );
        } else {
          alert("Erro ao atualizar o Gist: " + response.responseText);
        }
      },
      onerror: function (error) {
        alert("Erro de rede ao tentar atualizar o Gist.");
      },
    });
  }

  // Função para mostrar uma notificação temporária
  // function showTemporaryNotification(message) {
  //   const notification = document.createElement("div");
  //   notification.textContent = message;
  //   notification.style.position = "fixed";
  //   notification.style.bottom = "70px";
  //   notification.style.left = "20px";
  //   notification.style.backgroundColor = "#4CAF50";
  //   notification.style.color = "white";
  //   notification.style.padding = "10px";
  //   notification.style.borderRadius = "5px";
  //   notification.style.zIndex = 1001;
  //   notification.style.opacity = "1";
  //   notification.style.transition = "opacity 0.5s";

  //   document.body.appendChild(notification);

  //   setTimeout(() => {
  //     notification.style.opacity = "0";
  //     setTimeout(() => {
  //       document.body.removeChild(notification);
  //     }, 500);
  //   }, 3000);
  // }

  // Função para extrair ASIN de uma URL
  function extractAsinFromUrl(url) {
    try {
      const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (dpMatch) return validateAsin(dpMatch[1]);

      const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})(?:\/|\?|$)/);
      if (gpMatch) return validateAsin(gpMatch[1]);

      const asinMatch = url.match(/asin=([A-Z0-9]{10})(?:&|$)/);
      if (asinMatch) return validateAsin(asinMatch[1]);

      return null;
    } catch (e) {
      console.error("Erro ao extrair ASIN da URL:", e);
      return null;
    }
  }

  // Função para validar um possível ASIN
  function validateAsin(potentialAsin) {
    if (!potentialAsin) return null;

    if (FALSE_POSITIVES.includes(potentialAsin)) {
      console.log(`Rejeitando falso positivo: ${potentialAsin}`);
      return null;
    }

    if (potentialAsin.length !== 10) return null;
    if (!/^[A-Z0-9]{10}$/.test(potentialAsin)) return null;

    const commonPrefixes = [
      "B0",
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "B9",
      "0",
      "1",
      "2",
      "3",
    ];
    const hasCommonPrefix = commonPrefixes.some((prefix) =>
      potentialAsin.startsWith(prefix)
    );

    return hasCommonPrefix ? potentialAsin : null;
  }

  // Função para buscar ASIN em todo o documento
  function searchAsinInDocument() {
    const asinPattern = /\b[A-Z0-9]{10}\b/g;
    const htmlContent = document.documentElement.innerHTML;
    const matches = htmlContent.match(asinPattern);

    if (matches && matches.length) {
      const possibleAsins = [...new Set(matches)]
        .filter((asin) => !FALSE_POSITIVES.includes(asin))
        .filter((asin) => validateAsin(asin));

      if (possibleAsins.length === 0) return null;

      for (const asin of possibleAsins) {
        if (
          htmlContent.includes(`/dp/${asin}`) ||
          htmlContent.includes(`/gp/product/${asin}`) ||
          htmlContent.includes(`asin=${asin}`)
        ) {
          return asin;
        }
      }

      const b0Asins = possibleAsins.filter((asin) => asin.startsWith("B0"));
      if (b0Asins.length > 0) {
        return b0Asins[0];
      }

      return null;
    }

    return null;
  }

  // Função aprimorada para capturar o ASIN da página
  function captureASIN() {
    let asin = null;
    let asinSource = "";

    const asinElement =
      document.getElementById("ASIN") ||
      document.querySelector('input[name="ASIN"]');
    if (asinElement) {
      asin = validateAsin(asinElement.value);
      if (asin) asinSource = "elemento específico";
    }

    if (!asin) {
      const tabAmazonElement = document.getElementById("tabAmazon");
      if (tabAmazonElement) {
        const linkElement = tabAmazonElement.querySelector('a[href*="asin="]');
        if (linkElement) {
          const url = new URL(linkElement.href);
          asin = validateAsin(url.searchParams.get("asin"));
          if (asin) asinSource = "tabAmazon";
        }
      }
    }

    if (!asin) {
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink && canonicalLink.href) {
        asin = extractAsinFromUrl(canonicalLink.href);
        if (asin) asinSource = "link canônico";
      }
    }

    if (!asin) {
      asin = extractAsinFromUrl(window.location.href);
      if (asin) asinSource = "URL da página";
    }

    if (!asin) {
      const metaElements = document.querySelectorAll("meta");
      for (const meta of metaElements) {
        const content = meta.getAttribute("content") || "";
        if (
          content.includes("/dp/") ||
          content.includes("/gp/product/") ||
          content.includes("asin=")
        ) {
          asin = extractAsinFromUrl(content);
          if (asin) {
            asinSource = "metadados";
            break;
          }
        }
      }
    }

    if (!asin) {
      const links = document.querySelectorAll(
        'a[href*="/dp/"], a[href*="/gp/product/"], a[href*="asin="]'
      );
      for (const link of links) {
        asin = extractAsinFromUrl(link.href);
        if (asin) {
          asinSource = "link da página";
          break;
        }
      }
    }

    if (!asin) {
      asin = searchAsinInDocument();
      if (asin) asinSource = "busca no documento";
    }

    if (!asin) {
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        try {
          if (iframe.contentDocument) {
            const iframeAsinElement =
              iframe.contentDocument.getElementById("ASIN") ||
              iframe.contentDocument.querySelector('input[name="ASIN"]');
            if (iframeAsinElement) {
              asin = validateAsin(iframeAsinElement.value);
              if (asin) {
                asinSource = "iframe";
                break;
              }
            }

            const iframeLinks = iframe.contentDocument.querySelectorAll(
              'a[href*="/dp/"], a[href*="/gp/product/"], a[href*="asin="]'
            );
            for (const link of iframeLinks) {
              asin = extractAsinFromUrl(link.href);
              if (asin) {
                asinSource = "link dentro de iframe";
                break;
              }
            }
          }
        } catch (e) {
          console.warn(
            "Não foi possível acessar iframe devido a restrições de segurança:",
            e
          );
        }
      }
    }

    if (asin && !FALSE_POSITIVES.includes(asin)) {
      console.log(`ASIN capturado: ${asin} (encontrado via ${asinSource})`);
      return asin;
    } else if (asin) {
      console.log(`Falso positivo detectado e ignorado: ${asin}`);
      return null;
    } else {
      console.log("Nenhum ASIN encontrado na página");
      return null;
    }
  }

  // Função principal que será executada ao clicar no botão "Iniciar rastreamento"
  function main() {
    const asin = captureASIN();
    if (asin) {
      fetchGistContent(function (data) {
        if (!data.codes.includes(asin)) {
          data.codes.push(asin);
          updateGist(data);
        } else {
          console.log(`ASIN ${asin} já existe na lista.`);
          showTemporaryNotification(`ASIN ${asin} já existe na lista.`);
        }
      });
    }
  }

  function showTemporaryNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.marginTop = "10px";
    notification.style.padding = "10px";
    notification.style.backgroundColor = "#4CAF50";
    notification.style.color = "white";
    notification.style.borderRadius = "5px";
    notification.style.opacity = "1";
    notification.style.transition = "opacity 0.5s ease-in-out";
    notification.style.textAlign = "center";
    notification.style.width = "fit-content";
    notification.style.marginLeft = "auto";
    notification.style.marginRight = "auto";

    // Seleciona o botão "Capturar ASIN"
    const button = document.querySelector("button[data-asin-capture]");

    if (button) {
      button.insertAdjacentElement("afterend", notification);
    } else {
      document.body.appendChild(notification); // Fallback, caso o botão não seja encontrado
    }

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  }

  // Adiciona um atributo para facilitar a seleção do botão
  function addFloatingButton() {
    const button = document.createElement("button");
    button.textContent = "Atualizar Lista";
    button.setAttribute("data-asin-capture", "true"); // Para facilitar a busca do botão
    button.style.display = "block";
    button.style.margin = "10px auto"; // Centraliza horizontalmente
    button.style.padding = "5px";
    button.style.background = "rgb(133 132 132 / 18%)";
    button.style.color = "#636363";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.textAlign = "center";

    button.addEventListener("click", () => {
      main();
      // showTemporaryNotification("ASIN capturado com sucesso!");
    });

    const targetDiv = document.querySelector("#keepaContainer");

    if (targetDiv) {
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.alignItems = "center"; // Centraliza o conteúdo
      container.style.marginTop = "10px";

      targetDiv.insertAdjacentElement("beforebegin", container);
      container.appendChild(button);
    }
  }

  // Adiciona o listener para o botão "Iniciar rastreamento"
  function addTrackingButtonListener() {
    const observer = new MutationObserver(function (mutationsList, observer) {
      const trackingButton = document.getElementById("submitTracking");
      if (trackingButton) {
        console.log('Botão "Iniciar rastreamento" encontrado');

        trackingButton.addEventListener("click", function (event) {
          console.log('Botão "Iniciar rastreamento" pressionado');
          main(); // Executa a função principal ao clicar no botão
        });
        observer.disconnect(); // Para de observar assim que o botão é encontrado
      }
    });

    // Configura o observer para observar o corpo do documento
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Executar após o carregamento completo da página
  window.addEventListener("load", function () {
    addTrackingButtonListener();
    addFloatingButton();
  });
})();
