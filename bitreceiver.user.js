// ==UserScript==
// @name         BitReceiver
// @namespace    Nillkizz
// @version      0.3.0
// @homepage     https://github.com/Nillkizz/BitReceiverUS/
// @homepageURL  https://github.com/Nillkizz/BitReceiverUS/
// @updateURL    https://github.com/Nillkizz/BitReceiverUS/raw/main/bitreceiver.user.js
// @downloadURL  https://github.com/Nillkizz/BitReceiverUS/raw/main/bitreceiver.user.js
// @description  Receive all requests
// @author       Nillkizz
// @include      http://zergbit.net/dashboard/buy/
// @icon         http://zergbit.net/static/zergbit.ico
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  const buyedIds = [];

  const config = {
    paymentSystems: [
      'Сбербанк',
    ],
    prices: {
      'Сбербанк': {
        min: 0,
        max: Infinity,
        averall: 100000,
      },
      validate(payName, price) {
        let is_valid = [true];
        const payPrices = this[payName];

        if (typeof payPrices !== 'undefined') { // if Max and Min prices is ok
          is_valid.push(payPrices.min < price && payPrices.max > price);
        }

        if (typeof payPrices.curentAverall !== 'number') payPrices.curentAverall = 0;
        is_valid.push((payPrices.curentAverall + parseInt(price)) < payPrices.averall)

        console.log(`Averall/CurrentAverall: ${payPrices.averall}/${payPrices.curentAverall}`)

        is_valid = is_valid.reduce((a, b) => a && b)
        if (is_valid) {
          if (typeof payPrices.curentAverall === 'number') payPrices.curentAverall += parseInt(price);
          else payPrices.curentAverall = parseInt(price);
        }
        return is_valid;
      }
    },
    delay: 0
  };

  const obs = new MutationObserver(cb);
  obs.observe(document.getElementById('confirm_trade_table'), { childList: true });

  function cb(mutationList, observer) {
    processMutations(mutationList);
  }

  function processMutations(mutations) {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case "childList":
          if (mutation.addedNodes.length > 0) {
            processAddedNodes(mutation.addedNodes);
          }
          break;

        default:
          console.log(`Mutation type: ${mutation.type}`);
      }
    }

  }

  function processAddedNodes(nodes) {
    for (const node of nodes) {
      switch (node.tagName) {
        case "TBODY": {

          const tbody = processRequestTBODY(node);
          const id = /# (\d*)/.exec(tbody.data.id)[1];
          console.log("Deal id:", id);

          if (buyedIds.includes(id)) {
            console.log('Has been bought');
            return; //  Has been bought
          }

          if (!config.prices.validate(tbody.data.toSend[1], tbody.data.toSend[0])) {
            console.log("Price not valid")
            return; //  Price Not Ok
          }
          if (config.paymentSystems instanceof Array) {
            if (!config.paymentSystems.includes(tbody.data.toSend[1])) {
              console.log('Payment system not allowed')
              return; //  Payment System Not Ok
            }
          }

          console.log(tbody.data)

          accept_buy_deal(parseInt(id))
          console.log('buyed', tbody.data)
          buyedIds.push(id)
          break;
        }
        default:
          console.log(`Node tag name: ${node.tagName}`);
      }
    }
  }

  function processRequestTBODY(node) {
    const [status, id, req, comment, toSend, toReceive, course, date] = Array.from(node.querySelectorAll('td'))
      .map((el, i) => {
        switch (i) {
          case 0: case 1: case 2: case 3:
            return el.textContent;
          case 4: case 7:
            return [el.childNodes[0].textContent, el.querySelector('span').textContent];
          case 5: case 6:
            return [el.childNodes[0].textContent, el.childNodes[2].textContent];
        }
      })
    node.data = { status, id, req, comment, toSend, toReceive, course, date };
    console.log(node.data)
    return node;
  }
})();