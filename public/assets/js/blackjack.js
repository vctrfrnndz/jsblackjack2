var Blackjack, Card, Hand, Rules, UI;

Rules = (function() {
  function Rules() {}

  Rules.suits = ["club", "diamond", "heart", "spade"];

  Rules.numbers = ["a", 2, 3, 4, 5, 6, 7, 8, 9, 10, "j", "q", "k"];

  Rules.randomize = function(max) {
    return Math.floor(Math.random() * max);
  };

  Rules.deal = function() {
    var cardNumber, cardSuit;
    cardSuit = this.randomize(Rules.suits.length);
    cardNumber = this.randomize(Rules.numbers.length);
    return new Card(cardSuit, cardNumber);
  };

  return Rules;

})();

Card = (function() {
  function Card(suit, number) {
    this.suit = suit;
    this.number = number;
  }

  Card.prototype.cardColor = function() {
    if (this.suit < 2) {
      return 'red';
    }
    return 'black';
  };

  Card.prototype.cardSuit = function() {
    return Rules.suits[this.suit];
  };

  Card.prototype.cardLetter = function() {
    return Rules.numbers[this.number];
  };

  Card.prototype.value = function() {
    if (this.number === 0) {
      return 11;
    } else if (this.number >= 1 && this.number < 10) {
      return this.number + 1;
    } else {
      return 10;
    }
  };

  Card.prototype.template = function(type, animation) {
    var card, hidden;
    animation = animation || 'slideInRight';
    if (type === 'hidden') {
      hidden = '<div class="flip-card-container"><div class="bounds"><div class="flipped ' + animation + '" data-card></div></div></div>';
      return hidden;
    }
    type = this.cardColor() + ' ' + this.cardSuit() + ' ' + animation;
    card = ['<div class="', type, '" data-card="', this.cardLetter(), '"><i></i></div>'].join('');
    return card;
  };

  return Card;

})();

Hand = (function() {
  function Hand() {
    this.first = Rules.deal();
    this.second = Rules.deal();
    this.currentCards = [this.first, this.second];
  }

  Hand.prototype.template = function(user) {
    var card, hand, index, j, len, ref;
    user = user || '';
    hand = ['<div class="hand ' + user + '"><div class="cards">'];
    ref = this.currentCards;
    for (index = j = 0, len = ref.length; j < len; index = ++j) {
      card = ref[index];
      if (index === 0 && user === 'dealer') {
        hand.push(card.template('hidden'));
      } else {
        hand.push(card.template());
      }
    }
    hand.push('</div></div>');
    return hand.join('');
  };

  Hand.prototype.score = function() {
    var aces, card, j, len, ref, sum;
    sum = 0;
    aces = 0;
    ref = this.currentCards;
    for (j = 0, len = ref.length; j < len; j++) {
      card = ref[j];
      sum += card.value();
    }
    if (card.value() === 11) {
      aces += 1;
    }
    while (aces > 0 && sum > 21) {
      sum -= 10;
      aces--;
    }
    return sum;
  };

  Hand.prototype.hit = function() {
    var newCard;
    newCard = Rules.deal();
    this.currentCards.push(newCard);
    return newCard;
  };

  return Hand;

})();

UI = (function() {
  function UI(dom1, game1) {
    this.dom = dom1;
    this.game = game1;
    this.player = $(this.dom).find('.player');
    this.controls = $(this.createControls());
    this.player.prepend(this.indicator());
    $(this.dom).append(this.controls);
    this.events();
  }

  UI.prototype.events = function() {
    var game, ui;
    game = this.game;
    ui = this;
    $(this.dom).on('click', 'button.hit', function() {
      game.hitUser('player');
      return game.status();
    }).on('click', 'button.stand', function() {
      game.stand();
      return game.status(true);
    }).on('click', 'button.restart', function() {
      return game.restart();
    });
    return $('input#sounds').on('change', function() {
      var value;
      value = $(this).is(":checked");
      return game.toggleSounds(value);
    });
  };

  UI.prototype.showRestart = function() {
    this.controls.find('.hit, .stand').remove();
    return this.controls.find('button').removeAttr('disabled').removeClass('hide');
  };

  UI.prototype.showHiddenCard = function() {
    var $hiddenCard, $stage;
    $stage = $(this.dom).find('.dealer .flip-card-container');
    $hiddenCard = $(this.game.dealer.currentCards[0].template(null, 'slideInLeft'));
    $stage.find('.bounds').append($hiddenCard);
    return $stage.addClass('reveal');
  };

  UI.prototype.update = function() {
    return this.getIndicator().replaceWith(this.indicator());
  };

  UI.prototype.win = function(type) {
    var msg;
    if (type === 'blackjack') {
      msg = this.indicator('Blackjack! ' + this.game.player.score() + '-' + this.game.dealer.score(), 'win');
    } else {
      msg = this.indicator('You win! ' + this.game.player.score() + '-' + this.game.dealer.score(), 'win');
    }
    this.game.playSound('win');
    return this.getIndicator().replaceWith(msg);
  };

  UI.prototype.loss = function() {
    var msg;
    msg = this.indicator('You loose, ' + this.game.player.score() + '-' + this.game.dealer.score(), 'loss');
    this.game.playSound('loose');
    return this.getIndicator().replaceWith(msg);
  };

  UI.prototype.tie = function() {
    var msg;
    msg = this.indicator('You tied! ' + this.game.player.score() + '-' + this.game.dealer.score(), 'tie');
    return this.getIndicator().replaceWith(msg);
  };

  UI.prototype.createControls = function() {
    var template;
    template = ['<div class="controls animated fadeIn">', '<button class="hit">Hit <span>(H)</span></button>', '<button class="stand">Stand <span>(S)</span></button>', '<button class="restart animated fadeIn hide" disabled>Start Over</button>', '</div>'].join('');
    return template;
  };

  UI.prototype.getIndicator = function() {
    return $('.player .indicator', this.dom);
  };

  UI.prototype.indicator = function(msg, modifier) {
    var score, template;
    score = this.game.player.score();
    modifier = modifier || '';
    msg = msg || 'Your score is ' + score;
    template = ['<div class="indicator ' + modifier + ' animated fadeInUp">', '<span class="msg">', msg, '</span>', '</div>'].join('');
    return template;
  };

  return UI;

})();

Blackjack = (function() {
  function Blackjack(dom) {
    this.dom = dom;
    this.sounds = {
      enabled: false,
      win: new Audio(window.location.href + 'assets/sounds/win.mp3'),
      loose: new Audio(window.location.href + 'assets/sounds/loose.mp3'),
      deal: new Audio(window.location.href + 'assets/sounds/deal.mp3')
    };
    this.init();
  }

  Blackjack.prototype.restart = function() {
    $(this.dom).html('');
    $(this.dom).off('click');
    $('input').off();
    return this.init();
  };

  Blackjack.prototype.init = function() {
    var $dealer, $player;
    this.player = new Hand();
    this.dealer = new Hand();
    $dealer = $(this.dealer.template('dealer'));
    $player = $(this.player.template('player'));
    $(this.dom).append($dealer).append($player);
    this.animateCards($dealer.find('[data-card]'));
    this.animateCards($player.find('[data-card]'));
    this.ui = new UI(this.dom, this);
    return this.status();
  };

  Blackjack.prototype.toggleSounds = function(bool) {
    return this.sounds.enabled = bool;
  };

  Blackjack.prototype.playSound = function(soundName) {
    if (this.sounds.enabled) {
      this.sounds[soundName].currentTime = 0;
      return this.sounds[soundName].play();
    }
  };

  Blackjack.prototype.status = function(stand) {
    if (this.player.score() < 21 && this.dealer.score() < 21 && !stand) {
      return this.ui.update();
    }
    this.ui.showHiddenCard();
    this.ui.showRestart();
    if (this.dealer.score() > 21 && this.player.score() > 21) {
      return this.ui.loss('house');
    }
    if (this.player.score() === 21) {
      return this.ui.win('blackjack');
    }
    if (this.dealer.score() > 21 && this.player.score() < 21) {
      return this.ui.win();
    }
    if (this.player.score() < 21 && this.player.score() > this.dealer.score()) {
      return this.ui.win();
    }
    if (this.player.score() === this.dealer.score()) {
      return this.ui.tie();
    }
    return this.ui.loss();
  };

  Blackjack.prototype.animateCards = function($cards) {
    return $cards.each((function(_this) {
      return function(i, elem) {
        var card, time;
        card = elem;
        time = 400 * i;
        setTimeout(function() {
          _this.playSound('deal');
          return $(elem).addClass('animated');
        }, time);
        return elem;
      };
    })(this));
  };

  Blackjack.prototype.stand = function() {
    var results;
    results = [];
    while (this.dealer.score() < 17) {
      results.push(this.hitUser('dealer'));
    }
    return results;
  };

  Blackjack.prototype.hitUser = function(user) {
    var $card, target;
    target = '.' + user;
    $card = $(this[user].hit().template(), this.dom);
    if (user === 'player' && this.dealer.score() < 17) {
      this.hitUser('dealer');
    }
    $(target, this.dom).find('.cards').append($card);
    this.animateCards($card);
    return $card;
  };

  return Blackjack;

})();
