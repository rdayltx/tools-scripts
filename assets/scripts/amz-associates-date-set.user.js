// ==UserScript==
// @name          Amazon Associates Date Set
// @namespace     Pobre's Toolbox
// @version       1.2
// @icon          https://raw.githubusercontent.com/rdayltx/tools-scripts/main/assets/pobre_tools.ico
// @description   Ferramentas do analista
// @author        DayLight
//
// @match         https://associados.amazon.com.br/p/reporting/earnings
// @run-at        document-end
// @grant         GM_registerMenuCommand
// @grant         GM_addStyle
// @grant         GM_setValue
// @grant         GM_getValue
//
// ==/UserScript==
(function () {
  "use strict";

  function amazonAssociatesDateSet() {
    //Amazon Associates Date Set
    //description:  Sincroniza datas no relatório do Amazon Associates e ajusta resultados vendas
    const STORAGE_KEY = "amazon_associates_last_date";
    const RELOAD_FLAG = "amazon_associates_reload_flag";

    function setResultsPerPage() {
      const rowLimitSelect = document.querySelector(
        "#ac-report-commission-simple-orders-tbl-rowlimit"
      );
      if (rowLimitSelect) {
        rowLimitSelect.value = "100";
        rowLimitSelect.dispatchEvent(new Event("change", { bubbles: true }));

        const dropdownPrompt = document.querySelector(".a-dropdown-prompt");
        if (dropdownPrompt) {
          dropdownPrompt.textContent = "100";
        }
      } else {
        setTimeout(setResultsPerPage, 1000);
      }
    }

    function clickOrderColumn() {
      const orderColumn = document.querySelector(
        "#ac-report-commission-simple-orders-tbl > div.a-dtt-table-container > table > thead > tr > th:nth-child(4)"
      );
      if (orderColumn) {
        orderColumn.click();
        orderColumn.click();
      }
    }

    function applyDate(selectedDate) {
      if (!selectedDate) return;

      const fromInput = document.querySelector(
        "#ac-daterange-cal-input-from-report-timeInterval"
      );
      const toInput = document.querySelector(
        "#ac-daterange-cal-input-to-report-timeInterval"
      );

      if (fromInput && toInput) {
        const [year, month, day] = selectedDate.split("-");
        const formattedDate = `${month}/${day}/${year}`;

        fromInput.value = formattedDate;
        toInput.value = formattedDate;

        ["change", "input"].forEach((eventType) => {
          [fromInput, toInput].forEach((input) => {
            const event = new Event(eventType, { bubbles: true });
            input.dispatchEvent(event);
          });
        });

        const applyBtn = document.querySelector(
          "#ac-daterange-ok-button-report-timeInterval-announce"
        );
        if (applyBtn) {
          applyBtn.click();
          setTimeout(() => {
            setResultsPerPage();
          }, 2000);
        }

        const customRadio = document.querySelector('input[value="custom"]');
        if (customRadio) {
          customRadio.checked = true;
          customRadio.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }

    function createDatePicker() {
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;top:10px;right:10px;z-index:9999;background:#fff;padding:10px;border:1px solid #ccc;border-radius:5px;";

      const datePicker = document.createElement("input");
      datePicker.type = "date";
      datePicker.style.marginRight = "10px";

      const lastDate = localStorage.getItem(STORAGE_KEY);
      if (lastDate) {
        datePicker.value = lastDate;
      }

      const applyButton = document.createElement("button");
      applyButton.textContent = "Aplicar Data";
      applyButton.style.cssText =
        "padding:5px 10px;cursor:pointer;background:#FF9900;border:1px solid #FF9900;border-radius:3px;color:white;";

      applyButton.addEventListener("click", () => {
        const selectedDate = datePicker.value;
        if (!selectedDate) return;

        localStorage.setItem(STORAGE_KEY, selectedDate);
        localStorage.setItem(RELOAD_FLAG, "true");

        window.location.reload();
      });

      container.appendChild(datePicker);
      container.appendChild(applyButton);
      return container;
    }

    function init() {
      if (
        document.querySelector(
          "#ac-daterange-cal-input-from-report-timeInterval"
        )
      ) {
        document.body.appendChild(createDatePicker());

        const reloadFlag = localStorage.getItem(RELOAD_FLAG);
        const lastDate = localStorage.getItem(STORAGE_KEY);

        if (reloadFlag === "true" && lastDate) {
          localStorage.removeItem(RELOAD_FLAG);
          setTimeout(() => {
            applyDate(lastDate);
          }, 1000);
        }

        setResultsPerPage();
      } else {
        setTimeout(init, 1000);
      }
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const rowLimitSelect = document.querySelector(
            "#ac-report-commission-simple-orders-tbl-rowlimit"
          );
          if (rowLimitSelect && rowLimitSelect.value !== "100") {
            setResultsPerPage();
          }
        }
      });
    });

    window.addEventListener("load", () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });

    init();
    // Wait for table to load before clicking column
    setTimeout(clickOrderColumn, 5000);
  }

  amazonAssociatesDateSet();
})();
