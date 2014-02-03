
// Following recommendations in
// http://www.adobe.com/devnet/html5/articles/javascript-object-creation.html

var bridge = bridge || {};

/**************************************************************************
 * Infrastructure
 **************************************************************************/

(function() {
    if (typeof Object.create !== "function") {
        Object.create = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }
}());

bridge._object = {
    extend: function(props) {
        var prop, obj;
        obj = Object.create(this);
        for(prop in props) {
            if(props.hasOwnProperty(prop)) {
                obj[prop] = props[prop];
            }
        }
        return obj;
    },
    init: function() {
	return this;
    },
    make: function(props) {
	return this.extend(props).init();
    },
};

/**************************************************************************
 * Constants
 **************************************************************************/

bridge.consts = {
    SUITS:   ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"],
    STRAINS: ["CLUBS", "DIAMONDS", "HEARTS", "SPADES", "NO_TRUMP"],
    RANKS:   ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"],
    POINTS:  {"A": 4, "K": 3, "Q": 2, "J": 1},
    MAXBID:  7,
};

/**************************************************************************
 * Card
 **************************************************************************/

bridge.card = bridge._object.extend({
    // Members
    // id, suit_id, and rank_id are all 1-indexed
    id      : null,
    suit    : null,
    suit_id : null,
    rank    : null,
    rank_id : null,

    init: function() {
	if ("str" in this) {
	    if (this.str !== null) {
		this.rank = this.str.substring(0, 1);
		var suit_char = this.str.substring(1, 2);
		for (var ii = 0; ii < bridge.consts.SUITS.length; ii++) {
		    if (suit_char === bridge.consts.SUITS[ii].substring(0, 1)) {
			this.suit = bridge.consts.SUITS[ii];
			break;
		    }
		}
	    }
	    delete this.str;
	}
	if (this.id !== null &&
	    (this.id < 1 ||
	    this.id > bridge.consts.SUITS.length * bridge.consts.RANKS.length))
	{
	    throw "Invalid card id: " + this.id;
	}

	if (this.suit_id !== null &&
	    (this.suit_id < 1 ||
	    this.suit_id > bridge.consts.SUITS.length))
	{
	    throw "Invalid suit_id: " + this.suit_id;
	}

	if (this.suit !== null && bridge.consts.SUITS.indexOf(this.suit) < 0) {
	    throw "Invalid suit: " + this.suit;
	}

	if (this.suit === null && this.suit_id !== null) {
	    this.suit = bridge.consts.SUITS[this.suit_id-1];
	}

	if (this.suit_id === null && this.suit !== null) {
	    this.suit_id = bridge.consts.SUITS.indexOf(this.suit)+1;
	}

	if (this.rank_id !== null &&
	    (this.rank_id < 1 ||
	    this.rank_id > bridge.consts.RANKS.length))
	{
	    throw "Invalid rank_id: " + this.rank_id;
	}

	if (this.rank !== null && bridge.consts.RANKS.indexOf(this.rank) < 0) {
	    throw "Invalid rank: " + this.rank;
	}

	if (this.rank === null && this.rank_id !== null) {
	    this.rank = bridge.consts.RANKS[this.rank_id-1];
	}

	if (this.rank_id === null && this.rank !== null) {
	    this.rank_id = bridge.consts.RANKS.indexOf(this.rank)+1;
	}

	if (this.id === null) {
	    if (this.suit === null || this.rank === null) {
		throw "No id for card";
	    }
	    this.id = (this.suit_id-1) * bridge.consts.RANKS.length + this.rank_id;
	}
	else {
            if (this.suit === null) {
		this.suit_id = Math.floor((this.id-1) /
					  bridge.consts.RANKS.length) + 1;
		this.suit = bridge.consts.SUITS[this.suit_id-1];
	    }
           if (this.rank === null) {
		this.rank_id = (this.id-1) % bridge.consts.RANKS.length + 1;
		this.rank = bridge.consts.RANKS[this.rank_id-1];
	    }
	}
	return this;
    },

    hc_points: function() {
	if (this.rank in bridge.consts.POINTS) {
	    return bridge.consts.POINTS[this.rank];
	}
	else {
	    return 0;
	}
    },

    to_string: function() {
	return this.rank + this.suit.substring(0, 1);
    },
});

/**************************************************************************
 * Deck
 **************************************************************************/
// Note that bridge.card.id is 1-indexed, but bridge.deck, like any
// array, is 0-indexed
bridge.deck = [];
for (var ii = 0;
     ii < bridge.consts.SUITS.length * bridge.consts.RANKS.length;
     ii++)
{
    bridge.deck.push(bridge.card.make({ id: ii+1 }));
}

bridge.shuffle = function() { 
    var deck = [];
    for (var ii = 0; ii < bridge.deck.length; ii++) {
	deck.push(ii);
    }
    for (var ii = 0; ii < bridge.deck.length; ii++) {
	var rand = Math.floor((Math.random()*bridge.deck.length));
	var tmp = deck[rand];
	deck[rand] = deck[ii];
	deck[ii] = tmp;
    }
    return deck;
};

bridge.deal = function() {
    var deck = bridge.shuffle();
    var hands = [];
    for (var ii = 0; ii < 4; ii++) {
	hands.push(bridge.hand.make({
	    cards: deck.slice(13*ii, 13*ii+13)
	}));
    }
    return hands;
};

/**************************************************************************
 * Hand
 **************************************************************************/

bridge.hand = bridge._object.extend({
    cards : null,
    by_suit : null,

    init: function() {
	for (var ii = 0; ii < this.cards.length; ii++) {
	    if (typeof this.cards[ii] === 'number') {
		this.cards[ii] = bridge.deck[this.cards[ii]];
	    }
	    else if (typeof this.cards[ii] === "string") {
		this.cards[ii] = bridge.card.make({str: this.cards[ii]});
	    }
	}
	this.by_suit = {};
	for (var ii = 0; ii < bridge.consts.SUITS.length; ii++) {
	    this.by_suit[bridge.consts.SUITS[ii]] = [];
	}
	this.cards.sort(function(a,b) {return b.id - a.id});
	for (var ii = 0; ii < this.cards.length; ii++) {
	    this.by_suit[this.cards[ii].suit].push(this.cards[ii]);
	}
	return this;
    },

    hc_points: function() {
	var points = 0;
	for (var ii = 0; ii < this.cards.length; ii++) {
	    points += this.cards[ii].hc_points();
	}
	return points;
    },
    
    points: function() {
	var points = this.hc_points();
	for (var suit in this.by_suit) {
	    points += Math.max(0, this.by_suit[suit].length - 4);
	}
	return points;
    },

    is_balanced: function() {
	var seen_doubleton = false;
	for (var suit in this.by_suit) {
	    if (this.by_suit[suit].length < 2) {
		return false;
	    }
	    else if (this.by_suit[suit].length == 2) {
		if (seen_doubleton) {
		    return false;
		}
		else {
		    seen_doubleton = true;
		}
	    }
	}
	return true;
    },

    to_string_oneline: function() {
	return this.cards.map(function(c) {return c.to_string()}).join(", ");
    },

    to_string: function() {
	return bridge.consts.SUITS.map(
	    function(s) {
		return s.substring(0, 1)
		    + ": "
		    + this.by_suit[s].map(
			function(c) {return c.rank;}
		    ).join('');}, this
	).join("\n");
    },
});

/**************************************************************************
 * Bid
 **************************************************************************/

bridge.bid = bridge._object.extend({
    // XXX Need to add DOUBLE, and REDOUBLE
    id        : null,
    level     : null,
    strain_id : null,
    strain    : null,

    init: function() {
	if ("str" in this) {
	    if (this.str !== null) {
		if (this.str == "PS") {
		    this.id = 0;
		}
		else {
		    this.level = parseInt(this.str.substring(0, 1));
		    var strain_char = this.str.substring(1, 2);
		    for (var ii = 0; ii < bridge.consts.STRAINS.length; ii++) {
			if (strain_char ==
			    bridge.consts.STRAINS[ii].substring(0, 1))
			{
			    this.strain = bridge.consts.STRAINS[ii];
			    break;
			}
		    }
		}
	    }
	    delete this.str;
	}

	if (this.id !== null &&
	    (this.id < 0 ||
	    this.id > bridge.consts.STRAINS.length * bridge.consts.MAXBID))
	{
	    throw "Invalid bid id: " + this.id;
	}

	if (this.level !== null &&
	    (this.level < 1 || this.level > bridge.consts.MAXBID))
	{
	    throw "Invalid level: " + this.level;
	}

	if (this.strain_id !== null &&
	    (this.strain_id < 1 ||
	     this.strain_id > bridge.consts.STRAINS.length))
	{
	    throw "Invalid strain_id: " + this.strain_id;
	}

	if (this.strain !== null &&
	    bridge.consts.STRAINS.indexOf(this.strain) < 0)
	{
	    throw "Invalid strain: " + this.strain;
	}

	if (this.strain === null && this.strain_id !== null) {
	    this.strain = bridge.consts.STRAINS[this.strain_id-1];
	}

	if (this.strain_id === null && this.strain !== null) {
	    this.strain_id = bridge.consts.STRAINS.indexOf(this.strain)+1;
	}

	if (this.id === null) {
	    if (this.level === null || this.strain === null) {
		throw "No id for bid";
	    }
	    this.id = (this.level-1) * bridge.consts.STRAINS.length + this.strain_id;
	}
	else if (this.id != 0) {
            if (this.level === null) {
		this.level = Math.floor((this.id-1) / bridge.consts.STRAINS.length) + 1;
	    }
            if (this.strain === null) {
		this.strain_id = (this.id-1) % bridge.consts.STRAINS.length + 1;
		this.strain = bridge.consts.STRAINS[this.strain_id-1];
	    }
	}
	return this;
    },

    to_string: function() {
	if (this.id == 0) {
	    return "PS";
	}
	return this.level + this.strain.substring(0, 1);
    },
});

/**************************************************************************
 * Hand Range
 **************************************************************************/
bridge.handrange = {
};

/**************************************************************************
 * Strategy
 *
 * A strategy is based on two functions:
 *
 *   make_bid - given a bid history and a hand, figure out what to bid
 *
 *   interpret_bid - given a bid history, figure out what hands your
 *                   partner could have. (returns a hand-range)
 *
 * The ideal way for this to work is to have a class:
 *   handrange
 * that encapsulates a set of possible hands.  Then, have a function that,
 * for any given bid history, creates an ordered list of bidding rules of the
 * form:
 *   < handrange, bid >
 * In order to create the list of handranges, you probably need the
 * handranges of your partner's previous bid.
 *
 * Then, to make a bid, just loop through the rules until you find a range that
 * matches your hand, then that's your bid.
 *
 * To interpret a bid, loop through the rules to find all the bids that match the
 * given bid, and concatenate the handranges together.
 *
 **************************************************************************/

bridge.strategy = {};

// make_bid:
//
// Given a bid history, and a hand, figure out what the next bid
// should be.
bridge.strategy.make_bid = function(bid_history, hand) {
    // Opening.  Either your partner hasn't had a chance to bid, or
    // your partner passed.
    if (bid_history.length < 2 ||
	bid_history.length < 4 &&
	bid_history[bid_history.length-3].to_string() == "PS")
    {
	var pts = hand.points();
	if (pts < 13) {
	    return bridge.bid.make({str: "PS"});
	}
	if (pts >= 16 && pts <= 18 && hand.is_balanced()) {
	    return bridge.bid.make({str: "1N"});
	}
	// First look for a five card major
	if (hand.by_suit["SPADES"].length > 4) {
	    return bridge.bid.make({str: "1S"});
	}
	else if (hand.by_suit["HEARTS"].length > 4) {
	    return bridge.bid.make({str: "1H"});
	}
	// 3 clubs and 3 diamonds is an exception
	else if (hand.by_suit["DIAMONDS"].length == 3 &&
		 hand.by_suit["CLUBS"].length == 3)
	{
	    return bridge.bid.make({str: "1C"});
	}
	else if (hand.by_suit["DIAMONDS"].length >= 
		 hand.by_suit["CLUBS"].length)
	{
	    return bridge.bid.make({str: "1D"});
	}
	else {
	    return bridge.bid.make({str: "1C"});
	}
    }
};

// Given a bid history (and a hand), return possible hand ranges for
// the last bid.
bridge.strategy.interpret_bid = function(bid_history, hand) {
};

/**************************************************************************
 * Unit Tests
 **************************************************************************/

bridge.test = function() {
    c = bridge.card.make({
	id: 4,
    });
    if (c.suit != "CLUBS") {
	throw "Bad suit";
    }
    c = bridge.deck[4];
    if (c.suit != "CLUBS") {
	throw "Bad suit";
    }
    if (bridge.card.make({ str: "TH" }).to_string() != "TH") {
	throw "Bad card TH";
    }
    if (bridge.deck[51].to_string() != "AS") {
	throw "Bad deck";
    }
    h = bridge.hand.make({
	cards: [0, 1, 2, 13, 14, 15, 26, 27, 28, 39, 40, 41],
    });
    if (h.is_balanced() != true) {
	throw "Unbalanced";
    }
    if (h.hc_points() != 0) {
	throw "Wrong points";
    }
    h = bridge.hand.make({
	cards: ["9S", "8S", "7S", "6S", "3S", "9H", "8H",
		"KD", "4D", "AC", "QC", "8C", "3C"],
    });
    if (h.is_balanced() != false) {
	throw "Shouldn't be balanced";
    }
    if (h.hc_points() != 9) {
	throw "Wrong HC points 2";
    }
    if (h.points() != 10) {
	throw "Wrong points 2";
    }
    if (bridge.bid.make({
	id: 4,
    }).to_string() != "1S") {
	throw "Bad bid 4";
    }
    if (bridge.bid.make({ str: "1S" }).to_string() != "1S") {
	throw "Bad bid 1S";
    }
    b = bridge.bid.make({
	id: 35,
    });
    if (b.to_string() != "7N") {
	throw "Bad bid 35";
    }
    hands = bridge.deal();
    if (hands.reduce(function(a, b) { return a + b.hc_points(); }, 0) != 40) {
	throw "hand points don't sum to 40"
    }
    return hands;
};

/**************************************************************************/

