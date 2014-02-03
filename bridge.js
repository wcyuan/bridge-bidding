
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
}

bridge._ordered_dict = bridge._object.extend({
    values : [],
    name : null,
    is_valid_value: function(value) {
	if (value < 1 || value > this.values.length) {
	    throw "Invalid " + this.name + " id: " + value;
	}
	return true;
    }
    is_valid_name: function(name) {
	if (this.values.indexOf(name) < 0) {
	    throw "Invalid " + this.name + ": " + name;
	}
	return true;
    }
    from_value: function(value) {
	this.is_valid_value(value);
	return this.values[value-1];
    }
    from_name: function(name) {
	this.is_valid_name(name);
	return this.indexOf(name)+1;
    }
    length: function() {
	return this.values.length;
    }
    get: function(idx) {
	return this.values[idx];
    }
});

/**************************************************************************
 * Constants
 **************************************************************************/

bridge.consts = {
    SUITS:   ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"],
    STRAINS: ["CLUBS", "DIAMONDS", "HEARTS", "SPADES", "NO_TRUMP"],
    RANKS:   ["A", 2, 3, 4, 5, 6, 7, 8, 9, "T", "J", "Q", "K"],
    POINTS:  {"A": 4, "K": 3, "Q": 2, "J": 1},
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
	if (this.id !== null &&
	    (this.id < 1 ||
	    this.id > bridge.consts.SUITS.length * bridge.consts.RANKS.length)) {
	    throw "Invalid card id: " + this.id;
	}

	if (this.suit_id !== null &&
	    (this.suit_id < 1 ||
	    this.suit_id > bridge.consts.SUITS.length)) {
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
	    this.rank_id > bridge.consts.RANKS.length)) {
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
	    this.id = (this.suit-1) * bridge.consts.RANKS.length + this.rank;
	} else {
            if (this.suit === null) {
		this.suit_id = Math.floor((this.id-1) / bridge.consts.RANKS.length) + 1;
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
	} else {
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
for (var ii = 0; ii < bridge.consts.SUITS.length * bridge.consts.RANKS.length; ii++) {
    bridge.deck.push(bridge.card.extend({ id: ii+1 }).init());
}

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
	}
	this.by_suit = {};
	for (var ii = 0; ii < bridge.consts.SUITS.length; ii++) {
	    this.by_suit[bridge.consts.SUITS[ii]] = [];
	}
	this.cards.sort(function(a,b) {return a.id - b.id});
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

    is_balanced: function() {
	var seen_doubleton = false;
	for (var suit in this.by_suit) {
	    if (this.by_suit[suit].length < 2) {
		return false;
	    } else if (this.by_suit[suit].length == 2) {
		if (seen_doubleton) {
		    return false;
		} else {
		    seen_doubleton = true;
		}
	    }
	}
	return true;
    },

    to_string: function() {
	return this.cards.map(function(c) {return c.to_string()}).join(", ");
    }
});

bridge.handrange = {
};

bridge.bid = {
    // rank + strain
};

/**************************************************************************
 * Test
 **************************************************************************/

bridge.strategy = {};

// Given a bid history, and a hand, figure out what the next bid
// should be.
bridge.strategy.make_bid = function(bid_history, hand) {
};

// Given a bid history (and a hand), return possible hand ranges for
// the last bid.
bridge.strategy.interpret_bid = function(bid_history, hand) {
};

/*
  Main functions:

  if opening (your partner hasn't bid):
    - if 16-18 points + balanced, bid 1NT
    - if 

 */

/**************************************************************************
 * Test
 **************************************************************************/

bridge.test = function() {
    c = bridge.card.extend({
	id: 4,
    }).init();
    if (c.suit != "CLUBS") {
	throw "Bad suit";
    }
    c = bridge.deck[4];
    if (c.suit != "CLUBS") {
	throw "Bad suit";
    }
    if (bridge.deck[51].to_string() != "KS") {
	throw "Bad deck";
    }
    h = bridge.hand.extend({
	cards: [0, 1, 2, 13, 14, 15, 26, 27, 28, 39, 40, 41],
    }).init();
    if (h.is_balanced() != true) {
	throw "Unbalanced";
    }
    if (h.hc_points() != 16) {
	throw "Wrong points";
    }
    return h;
};

/**************************************************************************/

