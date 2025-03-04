// ==UserScript==
// @name          ML UTM Cleaner
// @namespace     Pobre's Toolbox
// @version       1.2
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
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
// @exclude-match *://*mercadolivre.com.br/afiliados/*
//
// @run-at        document-start
//
//
// ==/UserScript==
(function () {
  "use strict";

  // Pega a URL atual
  let url = window.location.href;

  // Procura o primeiro "#" ou "?" na URL e remove tudo após ele
  let cleanedUrl = url.split("#")[0].split("?")[0];

  // Se a URL foi alterada, redireciona para a URL limpa
  if (url !== cleanedUrl) {
    window.location.replace(cleanedUrl);
  }
})();
