class Rules
  @suits = ["club", "diamond", "heart", "spade"]

  @numbers = ["a", 2, 3, 4, 5, 6, 7, 8, 9, 10, "j", "q", "k"]

  @randomize = (max) -> 
    Math.floor(Math.random() * max)

  @deal = ->
    cardSuit = @randomize(Rules.suits.length)
    cardNumber = @randomize(Rules.numbers.length)

    new Card(cardSuit, cardNumber)

class Card
  constructor: (@suit, @number) ->

  cardColor: ->
    if @suit < 2
      return 'red'

    return 'black'

  cardSuit: ->
    Rules.suits[@suit]

  cardLetter: ->
    Rules.numbers[@number]

  value: ->
    if @number == 0
      return 11
    else if @number >= 1 && @number < 10
      return @number + 1
    else
      return 10

  template: (type, animation) ->
    animation = animation || 'slideInRight'

    if type == 'hidden'
      hidden = '<div class="flip-card-container"><div class="bounds"><div class="flipped ' + animation + '" data-card></div></div></div>'

      return hidden

    type = @cardColor() + ' ' + @cardSuit() + ' ' + animation

    card = [
      '<div class="',
      type,
      '" data-card="'
      @cardLetter(),
      '"><i></i></div>'
    ].join('');

    return card

class Hand
  constructor: -> 
    @first = Rules.deal()
    @second = Rules.deal()
    @currentCards = [@first, @second]

  template: (user) ->
    user = user || ''
    hand = ['<div class="hand ' + user + '"><div class="cards">']

    for card, index in @currentCards
      if index == 0 && user == 'dealer'
        hand.push(card.template('hidden'))
      else
        hand.push(card.template())

    hand.push('</div></div>')

    return hand.join('')

  score: ->
    sum = 0
    aces = 0

    for card in @currentCards
      sum += card.value()

    if card.value() == 11
      aces += 1

    while aces > 0 && sum > 21
      sum -= 10
      aces--

    sum

  hit: ->
    newCard = Rules.deal()

    @currentCards.push(newCard)

    return newCard

class UI
  constructor: (@dom, @game) ->
    @player = $(@dom).find('.player')
    @controls = $(@createControls())

    @player.prepend(@indicator())

    $(@dom)
      .append(@controls)

    @events()

  events: ->
    game = @game
    ui = @

    $(@dom)
      .on('click', 'button.hit', ->
        game.hitUser('player')

        game.status()
      )
      .on('click', 'button.stand', ->
        game.stand()

        game.status(true)
      )
      .on('click', 'button.restart', ->
        game.restart()
      )

    $('input#sounds')
      .on('change', ->
        value = $(@).is(":checked")

        game.toggleSounds(value)
      )

  showRestart: ->
    @controls.find('.hit, .stand').remove()
    @controls.find('button').removeAttr('disabled').removeClass('hide')

  showHiddenCard: ->
    $stage = $(@dom).find('.dealer .flip-card-container')
    $hiddenCard = $(@game.dealer.currentCards[0].template(null, 'slideInLeft'))

    $stage.find('.bounds').append($hiddenCard)
    $stage.addClass('reveal')


  update: ->
    @getIndicator().replaceWith(@indicator())

  win: (type) ->
    if type == 'blackjack'
      msg = @indicator('Blackjack! ' + @game.player.score() + '-' + @game.dealer.score(), 'win')
    else
      msg = @indicator('You win! ' + @game.player.score() + '-' + @game.dealer.score(), 'win')

    @game.playSound('win')

    @getIndicator().replaceWith(msg)

  loss: ->
    msg = @indicator('You loose, ' + @game.player.score() + '-' + @game.dealer.score(), 'loss')

    @game.playSound('loose')

    @getIndicator().replaceWith(msg)

  tie: ->
    msg = @indicator('You tied! ' + @game.player.score() + '-' + @game.dealer.score(), 'tie')

    @getIndicator().replaceWith(msg)

  createControls: ->
    template = [
      '<div class="controls animated fadeIn">',
        '<button class="hit">Hit <span>(H)</span></button>',
        '<button class="stand">Stand <span>(S)</span></button>',
        '<button class="restart animated fadeIn hide" disabled>Start Over</button>',
      '</div>',
    ].join('')

    return template

  getIndicator: ->
      return $('.player .indicator', @dom)

  indicator: (msg, modifier) ->
    score = @game.player.score()
    modifier = modifier || ''
    msg = msg || 'Your score is ' + score

    template = [
      '<div class="indicator ' + modifier + ' animated fadeInUp">',
      '<span class="msg">',
      msg,
      '</span>',
      '</div>',
    ].join('')

    return template

class Blackjack
  constructor: (dom) ->
    @dom = dom

    @sounds = 
      enabled: false
      win: new Audio('../assets/sounds/win.mp3')
      loose: new Audio('../assets/sounds/loose.mp3')
      deal: new Audio('../assets/sounds/deal.mp3')

    @init()

  restart: ->
    $(@dom).html('')
    $(@dom).off('click')
    $('input').off()

    @init()

  init: ->
    @player = new Hand()
    @dealer = new Hand()
    
    $dealer = $(@dealer.template('dealer'))
    $player = $(@player.template('player'))

    $(@dom)
      .append($dealer)
      .append($player)

    @animateCards($dealer.find('[data-card]'))
    @animateCards($player.find('[data-card]'))

    @ui = new UI(@dom, @)

    @status()

  toggleSounds: (bool) ->
    @sounds.enabled = bool

  playSound: (soundName) ->
    if @sounds.enabled
      @sounds[soundName].currentTime = 0
      @sounds[soundName].play()

  status: (stand) ->
    if @player.score() < 21 && @dealer.score() < 21 && !stand
      return @ui.update()

    @ui.showHiddenCard()
    @ui.showRestart()

    if @dealer.score() > 21 && @player.score() > 21
      return @ui.loss('house')

    if @player.score() == 21
      return @ui.win('blackjack')

    if @dealer.score() > 21 && @player.score() < 21
      return @ui.win()

    if @player.score() < 21 && @player.score() > @dealer.score()
      return @ui.win()

    if @player.score() == @dealer.score()
      return @ui.tie()

    return @ui.loss()

  animateCards: ($cards) ->
    $cards.each (i, elem) =>
      card = elem
      time = 400 * i

      setTimeout(=>
        @playSound('deal');

        $(elem).addClass('animated')
      , time)

      return elem

  stand: ->
    while @dealer.score() < 17
      @hitUser('dealer')

  hitUser: (user) ->
    target = '.' + user
    $card = $(@[user].hit().template(), @dom)

    if user == 'player' && @dealer.score() < 17
      @hitUser('dealer') 

    $(target, @dom).find('.cards').append($card)

    @animateCards($card)

    return $card






