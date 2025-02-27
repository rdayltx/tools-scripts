// ==UserScript==
// @name          Magalu URL redirect
// @namespace     Pobre's Toolbox
// @version       1.0
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         *://*magazinevoce.com.br/*
// @match         *://*magazineluiza.com.br/*
//
// @run-at        document-start
//
//
// ==/UserScript==
(function () {
  "use strict";

  // Pega a URL atual
  const urlAtual = window.location.href;

  // Nome que queremos usar na URL
  const novoNome = "pobredasofertas";

  // Primeiro verifica se é uma URL do Magazine Luiza
  const magazineLuizaRegex = /^https:\/\/www\.magazineluiza\.com\.br(\/.*)/;

  if (magazineLuizaRegex.test(urlAtual)) {
    // Se for Magazine Luiza, converte para Magazine Você
    const novaUrl = urlAtual.replace(
      magazineLuizaRegex,
      `https://www.magazinevoce.com.br/${novoNome}$1`
    );

    // Redireciona para a nova URL
    if (novaUrl !== urlAtual) {
      window.location.href = novaUrl;
    }
  } else {
    // Se já for Magazine Você, aplica a lógica original
    const magazineVoceRegex =
      /(https:\/\/www\.magazinevoce\.com\.br\/)([^\/]+)(\/.*)/;
    const novaUrl = urlAtual.replace(magazineVoceRegex, `$1${novoNome}$3`);

    if (novaUrl !== urlAtual) {
      window.location.href = novaUrl;
    }
  }
})();
