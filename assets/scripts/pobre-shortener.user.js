// ==UserScript==
// @name          Pobre Shortener enhancement
// @namespace     Pobre's Toolbox
// @version       1.6
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         https://pobres.com.br/*
//
// @grant         GM_registerMenuCommand
// @grant         GM_addStyle
// @grant         GM_setValue
// @grant         GM_getValue
//
// ==/UserScript==

(function () {
  "use strict";

  function pobreShortener() {
    console.log(
      "Script de melhorias do encurtador do Pobre carregado com sucesso"
    );
    // Função para adicionar o botão de navegação
    function adicionarBotaoNavegacao() {
      // Não adicionar o botão se estiver exatamente na URL de destino
      if (
        window.location.href === "https://pobres.com.br/url/" ||
        window.location.href === "https://pobres.com.br/url"
      ) {
        return;
      }

      const form = document.querySelector("body > div > form");

      if (form) {
        // Criar o botão
        const botao = document.createElement("button");
        botao.textContent = "Home";
        botao.style.marginTop = "10px";
        botao.style.padding = "5px 10px";
        botao.style.cursor = "pointer";

        // Adicionar evento de clique
        botao.addEventListener("click", function (e) {
          e.preventDefault();
          window.location.href = "https://pobres.com.br/url/";
        });

        // Inserir o botão após o formulário
        form.parentNode.insertBefore(botao, form.nextSibling);
      }
    }

    // Função para adicionar o botão de cópia
    function adicionarBotaoCopia() {
      const input = document.querySelector("#encurtado");

      if (input) {
        // Obter a posição e dimensões do input
        const rect = input.getBoundingClientRect();

        // Criar o botão de cópia
        const botaoCopia = document.createElement("button");
        botaoCopia.textContent = "📋";
        botaoCopia.style.position = "fixed";
        botaoCopia.style.left = rect.right - 30 + "px";
        botaoCopia.style.top = rect.top + "px";
        botaoCopia.style.height = rect.height + "px";
        botaoCopia.style.padding = "0 8px";
        botaoCopia.style.cursor = "pointer";
        botaoCopia.style.border = "none";
        botaoCopia.style.background = "transparent";
        botaoCopia.style.fontSize = "16px";
        botaoCopia.style.zIndex = "9999";

        // Atualizar posição do botão quando a janela for redimensionada
        window.addEventListener("resize", () => {
          const newRect = input.getBoundingClientRect();
          botaoCopia.style.left = newRect.right - 30 + "px";
          botaoCopia.style.top = newRect.top + "px";
          botaoCopia.style.height = newRect.height + "px";
        });

        // Atualizar posição do botão durante o scroll
        window.addEventListener("scroll", () => {
          const newRect = input.getBoundingClientRect();
          botaoCopia.style.left = newRect.right - 30 + "px";
          botaoCopia.style.top = newRect.top + "px";
        });

        // Adicionar evento de clique
        botaoCopia.addEventListener("click", function (e) {
          e.preventDefault();

          // Copiar o conteúdo
          const texto = input.value;
          navigator.clipboard
            .writeText(texto)
            .then(() => {
              // Feedback visual temporário
              const textoOriginal = botaoCopia.textContent;
              botaoCopia.textContent = "✅";
              setTimeout(() => {
                botaoCopia.textContent = textoOriginal;
              }, 2000);
            })
            .catch((err) => {
              console.error("Erro ao copiar:", err);
              alert("Não foi possível copiar o texto");
            });
        });

        // Adicionar o botão ao body
        document.body.appendChild(botaoCopia);
      }
    }

    // Função para limpar o input
    function limparInput() {
      const input = document.querySelector("#id_url");
      if (input) {
        input.value = "";
      }
    }

    // Executar as funções quando o DOM estiver pronto
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        adicionarBotaoNavegacao();
        adicionarBotaoCopia();
        limparInput();
      });
    } else {
      adicionarBotaoNavegacao();
      adicionarBotaoCopia();
      limparInput();
    }
  }

  // Aguarda o DOM estar completamente carregado antes de executar o script
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pobreShortener);
  } else {
    pobreShortener();
  }
})();
