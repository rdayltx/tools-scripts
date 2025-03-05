// ==UserScript==
// @name          Loader de Scripts
// @namespace     Pobre's Toolbox
// @version       4.0
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Carrega scripts externos sob demanda
//
// @match        *://*pobres.com.br/url/*
//
// ============== MERCADO LIVRE ==============
// @match         *://*mercadolivre.com.br/*
// @match         *://*produto.mercadolivre.com.br/*
// @exclude-match *://*mercadolivre.com.br/social*
// @exclude-match *://*mercadolivre.com/sec*
// @exclude-match *://*mercadolivre.com.br/ofertas*
// @exclude-match *://*mercadolivre.com.br/cupons*
// @exclude-match *://*mercadolivre.com.br/c/*
// @exclude-match *://*mercadolivre.com.br/ajuda
// @exclude-match *://*mercadolivre.com.br/vendas/*
// @exclude-match *://*mercadolivre.com.br/syi/*
// @exclude-match *://*mercadolivre.com.br/supermercado/*
// @exclude-match *://*mercadolivre.com.br/gz/*
// @exclude-match *://*mercadolivre.com.br/assinaturas*
// @exclude-match *://*mercadolivre.com.br/credits/*
// @exclude-match *://*mercadolivre.com.br/my-reviews*
// @exclude-match *://*mercadolivre.com.br/perguntas/*
// @exclude-match *://*mercadolivre.com.br/navigation*
// @exclude-match *://*mercadolivre.com.br/checkout*
// @exclude-match *://*mercadolivre.com.br/protections*
// @exclude-match *://*mercadolivre.com.br/listas-de-presentes*
// @exclude-match *://*mercadolivre.com.br/meus-alertas*
//
// ============== MAGAZINE LUIZA ==============
// @match         *://*magazinevoce.com.br/*
// @match         *://*sacola.magazinevoce.com.br/*
// @match         *://*magazineluiza.com.br/*
//
// ============== TERABYTE ==============
// @match         *://*terabyteshop.com.br/*
//
// ============== AMAZON ==============
// @match         *://*amazon.com.br/*
// @match         *://*associados.amazon.com.br/p/reporting/*
// @exclude-match *://*amazon.com.br/hz/*
// @exclude-match *://*amazon.com.br/progress-tracker/*
// @exclude-match *://*amazon.com.br/kindle-dbs*
// @exclude-match *://*amazon.com.br/mn*
// @exclude-match *://*amazon.com.br/myk*
// @exclude-match *://*amazon.com.br/b*
// @exclude-match *://*amazon.com.br/gp/*
// @exclude-match *://*amazon.com.br/s*
// @exclude-match *://*amazon.com.br/prime*
// @exclude-match *://*amazon.com.br/gcx*
// @exclude-match *://*amazon.com.br/baby-reg*
// @exclude-match *://*amazon.com.br/gp/css/*
//
// @match         *://keepa.com/*
//
// ============== PAGUEMENOS ==============
// @match         *://paguemenos.com.br/*
//
// @match         *://*pt.anotepad.com/
// @match         *://*nike.com.br/*
//
// @match         *://localhost:1918/*
//
// @downloadURL   https://raw.githubusercontent.com/rdayltx/tools-scripts/main/scripts-loader.user.js
// @updateURL     https://raw.githubusercontent.com/rdayltx/tools-scripts/main/scripts-loader.user.js
//
// @grant         GM_xmlhttpRequest
// @grant         GM_registerMenuCommand
// @grant         GM_addStyle
// @grant         GM_setValue
// @grant         GM_getValue
// @run-at        document-start
// ==/UserScript==

// Variáveis de configuração
const configDefaults = {
  mlUTMcleaner: false, //  Remover UTM Mercado Livre
  amzUTMcleaner: false, //  Remover UTM Amazon
  magaluRecirect: true, //  Redirecionar Magalu para o Pobre
  magaluFreteRemover: false, //  Remover Frete Magalu
  configAtivaAdS: false, //  Busca avançada Relatório Amazon
  configAtivaAS: false, //  Busca data Relatórios Amazon
  configAtivaMLrel: false, //  Exporta Relatório XLSX do ML
  mlReportWebExport: false, //  Exporta Relatório Web do ML
  configSearchML: false, //  Pesquisa no Relatório Web do ML
  configAtivaPobreS: true, // Adiciona funcionalidades no encurtador do pobre
};

// Retrieve or initialize configurations
const getConfig = (key) => GM_getValue(key, configDefaults[key]);

// Function to create the configuration interface
function criarInterface() {
  // Prevent multiple instances
  if (document.getElementById("config-panel")) return;

  // Create main container
  const div = document.createElement("div");
  div.id = "config-panel";
  div.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10000;
          background: linear-gradient(135deg, #f6f8f9 0%, #e5ebee 100%);
          border: 2px solid #3498db;
          border-radius: 15px;
          padding: 25px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 900px;
          max-height: 80vh;
          overflow-y: auto;
          font-family: 'Arial', sans-serif;
      `;

  // Title
  const titulo = document.createElement("h2");
  titulo.innerText = "Configurações do Script";
  titulo.style.cssText = `
          color: #2c3e50;
          text-align: center;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
          margin-bottom: 15px;
      `;
  div.appendChild(titulo);

  // Configuration sites
  const configs = [
    { id: "mlUTMcleaner", label: "Remover UTM Mercado Livre" },
    { id: "amzUTMcleaner", label: "Remover UTM Amazon" },
    { id: "magaluRecirect", label: "Redirecionar para o Pobre Magalu" },
    { id: "magaluFreteRemover", label: "Remover Frete Magalu" },
    { id: "configAtivaAdS", label: "Definir data Amazon Associates" },
    { id: "configAtivaAS", label: "Busca avançada Amazon Associates" },
    { id: "configAtivaMLrel", label: "Exporta Relatório XLSX Mercado Livre" },
    { id: "mlReportWebExport", label: "Exporta Relatório Web Mercado Livre" },
    { id: "configSearchML", label: "Search ML Report" },
    { id: "configAtivaPobreS", label: "Pobre's Shortener Enhancement" },
  ];

  // Create configuration section
  const configContainer = document.createElement("div");
  configContainer.style.cssText = `
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
      `;

  configs.forEach(({ id, label }) => {
    const configWrapper = document.createElement("div");
    configWrapper.style.cssText = `
              display: flex;
              align-items: center;
              background: white;
              padding: 8px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          `;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.checked = getConfig(id);
    checkbox.style.cssText = `
              margin-right: 10px;
              cursor: pointer;
          `;

    const labelElement = document.createElement("label");
    labelElement.htmlFor = id;
    labelElement.innerText = label;
    labelElement.style.cssText = `
              flex-grow: 1;
              cursor: pointer;
          `;

    checkbox.addEventListener("change", () => {
      GM_setValue(id, checkbox.checked);
      showToast(
        `${label} agora está: ${checkbox.checked ? "Ativado" : "Desativado"}`
      );
    });

    // Função para exibir um toast
    function showToast(message) {
      let toast = document.createElement("div");
      toast.innerText = message;
      toast.style.cssText = `
                  position: fixed;
                  bottom: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  background-color: rgba(0, 0, 0, 0.8);
                  color: white;
                  padding: 10px 20px;
                  border-radius: 5px;
                  font-size: 14px;
                  z-index: 10000;
                  opacity: 1;
                  transition: opacity 0.5s ease-in-out;
              `;

      document.body.appendChild(toast);

      // Remover após 2 segundos
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
      }, 2000);
    }

    configWrapper.appendChild(checkbox);
    configWrapper.appendChild(labelElement);
    configContainer.appendChild(configWrapper);
  });

  div.appendChild(configContainer);

  // Close button
  const fechar = document.createElement("button");
  fechar.innerText = "Fechar";
  fechar.style.cssText = `
          width: 100%;
          margin-top: 15px;
          padding: 10px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s ease;
      `;

  fechar.addEventListener("click", () => div.remove());
  fechar.addEventListener("mouseover", () => {
    fechar.style.backgroundColor = "#2980b9";
  });
  fechar.addEventListener("mouseout", () => {
    fechar.style.backgroundColor = "#3498db";
  });

  div.appendChild(fechar);
  document.body.appendChild(div);
}

// Função para carregar scripts
function loadScript(url) {
  const now = Date.now();
  const cacheKey = `script_${url}`;
  const cachedScript = GM_getValue(cacheKey);

  if (cachedScript) {
    const { timestamp, script } = cachedScript;

    // Verifica se o script está expirado (mais de 8 horas)
    if (now - timestamp < 8 * 60 * 60 * 1000) {
      // Executa o script armazenado
      const scriptElement = document.createElement("script");
      scriptElement.textContent = script;
      document.head.appendChild(scriptElement);
      console.log(`Script carregado do cache: ${url}`);
      return;
    }
  }

  // Se o script não estiver no cache ou estiver expirado, faz uma nova requisição
  GM_xmlhttpRequest({
    method: "GET",
    url: url,
    onload: function (response) {
      const script = response.responseText;

      // Armazena o script usando GM_setValue com o carimbo de data/hora atual
      GM_setValue(cacheKey, { timestamp: now, script });

      // Executa o script
      const scriptElement = document.createElement("script");
      scriptElement.textContent = script;
      document.head.appendChild(scriptElement);
      console.log(`Script carregado e executado: ${url}`);
    },
    onerror: function (error) {
      console.error(`Erro ao carregar o script: ${url}`, error);
    },
  });
}

// Execução das funções baseadas nas configurações
function executeConfiguredFeatures() {
  const hostname = window.location.hostname;

  const siteConfigs = [
    {
      condition:
        getConfig("mlReportWebExport") &&
        location.hostname === "www.mercadolivre.com.br" &&
        location.pathname.startsWith("/afiliados/dashboard"),
      func: () => {
        console.log(
          "Executando script de exportação Web de relatório do Mercado Livre"
        );
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/ml-report-webexport.user.js"
        );
      },
    },

    {
      condition:
        getConfig("configAtivaMLrel") &&
        location.hostname === "www.mercadolivre.com.br" &&
        location.pathname.startsWith("/afiliados/dashboard"),
      func: () => {
        console.log(
          "Executando script de exportação de relatório XLSX do Mercado Livre"
        );
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/ml-report-export.user.js"
        );
      },
    },

    {
      condition:
        getConfig("mlUTMcleaner") &&
        (location.hostname === "produto.mercadolivre.com.br" ||
          location.hostname === "www.mercadolivre.com.br"),
      func: () => {
        console.log(
          "Executando script de exportação Web de relatório do Mercado Livre"
        );
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/ml-utm-cleaner.user.js"
        );
      },
    },

    {
      condition:
        getConfig("configSearchML") &&
        location.origin === "http://localhost:1918",
      func: () => {
        console.log("Executando script de Pesquisa em relatório");
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/ml-report-search.user.js"
        );
      },
    },

    {
      condition:
        getConfig("magaluRecirect") &&
        (location.hostname === "www.magazinevoce.com.br" ||
          location.hostname === "www.magazineluiza.com.br"),
      func: () => {
        console.log(
          "Executando script de redirecionamento do Magalu para o Pobre"
        );
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/magalu-redirect.user.js"
        );
      },
    },

    {
      condition:
        getConfig("magaluFreteRemover") &&
        location.hostname === "sacola.magazinevoce.com.br",
      func: () => {
        console.log(
          "Executando script de redirecionamento do Magalu para o Pobre"
        );
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/magalu-frete-remover.user.js"
        );
      },
    },

    {
      condition: getConfig("configAtivaPobreS") && hostname === "pobres.com.br",
      func: () => {
        console.log("Executando script de melhorias do encurtador do Pobre");
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/pobre-shortener.user.js"
        );
      },
    },

    {
      condition: getConfig("amzUTMcleaner") && hostname === "www.amazon.com.br",
      func: () => {
        console.log("Executando script para remover UTM da Amazon");
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/amz-utm-cleaner.user.js"
        );
      },
    },

    {
      condition:
        getConfig("configAtivaAS") && hostname === "associados.amazon.com.br",
      func: () => {
        console.log("Executando script de busca avançada Amazon Associates");
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/amz-associates-search.user.js"
        );
      },
    },

    {
      condition:
        getConfig("configAtivaAdS") && hostname === "associados.amazon.com.br",
      func: () => {
        console.log("Executando script de definição de data Amazon Associates");
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/amz-associates-date-set.user.js"
        );
      },
    },
  ];

  siteConfigs.forEach((config) => {
    console.log(`Checking condition for ${hostname}:`, config.condition);
    if (config.condition) {
      try {
        console.log(`Executing function for ${hostname}`);
        config.func();
      } catch (error) {
        console.error(`Erro ao executar função para ${hostname}:`, error);
      }
    }
  });
}

console.log("Configurações do loader:", window.loaderConfig);
// Executar funções quando o DOM estiver completamente carregado
document.addEventListener("DOMContentLoaded", executeConfiguredFeatures);
// Register menu command
GM_registerMenuCommand("Abrir Configurações", criarInterface, {
  title: "Clique para abrir as configurações do script.",
});
