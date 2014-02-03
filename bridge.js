var bridge = bridge || {};

// Following recommendations in
// http://www.adobe.com/devnet/html5/articles/javascript-object-creation.html

// Constants
bridge.consts = {
    SUITS: ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"],
    RANKS: ["A", 2, 3, 4, 5, 6, 7, 8, 9, "T", "J", "Q", "K"],
}

/**************************************************************************
 * Card
 **************************************************************************/

bridge.card = {
    // Members
    id      : null,
    suit    : null,
    suit_id : null,
    rank    : null,
    rank_id : null,

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
	if (this.id !== null &&
	    (this.id < 1 ||
	    this.id > bridge.consts.SUITS.length * bridge.consts.N_CARDS_PER_SUIT)) {
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
		this.suit_id = Math.floor(this.id / bridge.consts.RANKS.length) + 1;
		this.suit = bridge.consts.SUITS[this.suit_id-1];
	    }
            if (this.rank === null) {
		this.rank_id = this.id % bridge.consts.RANKS.length + 1;
		this.rank = bridge.consts.RANKS[this.rank_id-1];
	    }
	}
	return this;
    },
};

/**************************************************************************
 * Hand
 **************************************************************************/

bridge.hand = {
    cards : null,
    by_suit : null,

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
	this.by_suit = {};
	
	return this;
    }

    
};

bridge.handrange = {
};

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
    return c;
};

/*
  Main functions:
  1. Given a bid history, and a hand, figure out what the next bid should be.

  if opening (your partner hasn't bid):
    - if 16-18 points + balanced, bid 1NT
    - if 

  2. Given a bid history (and a hand), return possible hand ranges for all other players.
 */

(function() {
    if (typeof Object.create !== "function") {
        Object.create = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }
}());


