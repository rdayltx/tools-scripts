// ==UserScript==
// @name          Loader de Scripts
// @namespace     Pobre's Toolbox
// @version       1.4
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Carrega scripts externos sob demanda
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
  configAtivaAMZ: false, //  Remover UTM Amazon
  configAtivaPM: false, //  Remover UTM Paguemenos
  configAtivaNike: false, //  Remover UTM Nike
  configAtivaTB: false, //  Remover UTM Terabyte
  magaluRecirect: true, //  Redirecionar Magalu para o Pobre
  configAtivaMagaluF: true, //  Botão remover Frete Magalu
  configAtivaAP: false, //  Botões maiusculo e minusculo no Anotepad
  configAtivaAdS: false, //  Busca avançada Relatório Amazon
  configAtivaAS: false, //  Busca data Relatórios Amazon
  configAtivaMLrel: false, //  Exporta Relatório Mercado Livre
  mlReportWebExport: false, //  Exporta Relatório Mercado Livre
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
    { id: "configAtivaAMZ", label: "Remover UTM Amazon" },
    { id: "configAtivaPM", label: "Remover UTM Pague Menos" },
    { id: "configAtivaNike", label: "Remover UTM Nike" },
    { id: "configAtivaTB", label: "Remover UTM Terabyte" },
    { id: "magaluRecirect", label: "Redirecionar para o Pobre Magalu" },
    { id: "configAtivaMagaluF", label: "Remover Frete Magalu" },
    { id: "configAtivaAP", label: "Text Anotepad" },
    { id: "configAtivaAdS", label: "Definir data Amazon Associates" },
    { id: "configAtivaAS", label: "Busca avançada Amazon Associates" },
    { id: "configAtivaMLrel", label: "Exporta Relatório XLSX Mercado Livre" },
    { id: "mlReportWebExport", label: "Exporta Relatório Web Mercado Livre" },
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
          "Executando script de exportação de relatório do Mercado Livre"
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
        getConfig("magaluRecirect") &&
        (location.hostname === "magazinevoce.com.br" ||
          location.hostname === "magazineluiza.com.br"),
      func: () => {
        console.log(
          "Executando script de exportação Web de relatório do Mercado Livre"
        );
        loadScript(
          "https://raw.githubusercontent.com/rdayltx/tools-scripts/refs/heads/main/assets/scripts/magalu-redirect.user.js"
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

// Executar funções quando o DOM estiver completamente carregado
document.addEventListener("DOMContentLoaded", executeConfiguredFeatures);
// Register menu command
GM_registerMenuCommand("Abrir Configurações", criarInterface, {
  title: "Clique para abrir as configurações do script.",
});
