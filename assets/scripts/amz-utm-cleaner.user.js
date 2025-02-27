// ==UserScript==
// @name          Amz UTM Cleaner
// @namespace     Pobre's Toolbox
// @version       1.1
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         *://*amazon.com.br/*
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
// @exclude-match *://*amazon.com.br/yourstore*
// @exclude-match *://*amazon.com.br/yourmembershipsandsubscriptions*
// @exclude-match *://*amazon.com.br/yourmemberships*
// @exclude-match *://*amazon.com.br/yourdevices*
// @exclude-match *://*amazon.com.br/yourpayments*
// @exclude-match *://*amazon.com.br/gp/css/*
// @exclude-match *://*amazon.com.br/cart*
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
