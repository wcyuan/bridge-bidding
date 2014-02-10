
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
    clone: function(props) {
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
    // Use extend to make subclasses
    extend: function(props) {
        var obj = this.clone(props);
        obj.prototype = this;
        return obj;
    },
    // Use make to make new instances (from a class or from an
    // existing instance)
    make: function(props) {
        var obj = this.clone(props);
        obj.prototype = this.prototype;
        obj.init();
        return obj;
    },
};

bridge.is_same_type = function(first, second) {
    return first.prototype.isPrototypeOf(second) &&
        second.prototype.isPrototypeOf(first);
};

// range: a function that returns a list of ints from start to end,
// inclusive.
bridge.range = function() {
    var start = 0;
    var step = 1;
    var end;
    if (arguments.length == 1) {
        end = arguments[0];
    }
    else if (arguments.length == 2) {
        start = arguments[0];
        end = arguments[1];
    }
    else if (arguments.length == 3) {
        start = arguments[0];
        end = arguments[1];
        step = arguments[2];
    }
    var retval = [];
    for (var ii = start; ii <= end; ii += step) {
        retval.push(ii);
    }
    return retval;
}

/**************************************************************************
 * Constants
 **************************************************************************/

bridge.consts = {
    SUITS:   ["CLUBS", "DIAMONDS", "HEARTS", "SPADES"],
    STRAINS: ["CLUBS", "DIAMONDS", "HEARTS", "SPADES", "NO_TRUMP"],
    RANKS:   ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"],
    POINTS:  {"A": 4, "K": 3, "Q": 2, "J": 1},
    MAXBID:  7,
    get_strain: function(c) {
        return this.STRAINS.filter(function(s) {return s[0] == c;})[0];
    },
    is_major: function(strain) {
        return strain == 'SPADES' || strain == 'HEARTS';
    }
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

    toString: function() {
        return this.rank + this.suit.substring(0, 1);
    },
});

/**************************************************************************
 * Deck
 **************************************************************************/
// Note that bridge.card.id is 1-indexed, but bridge.deck, like any
// array, is 0-indexed
bridge.deck = [];
(function() {
    for (var ii = 0;
         ii < bridge.consts.SUITS.length * bridge.consts.RANKS.length;
         ii++)
    {
        bridge.deck.push(bridge.card.make({ id: ii+1 }));
    }
})();

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

    toString_oneline: function() {
        return this.cards.map(function(c) {return c.to_string()}).join(", ");
    },

    toString: function() {
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

    toString: function() {
        if (this.id == 0) {
            return "PS";
        }
        return this.level + this.strain.substring(0, 1);
    },

    is_game: function() {
        return ((this.strain == 'NO_TRUMP' && this.level >= 3) ||
                (this.strain == 'SPADES'   && this.level >= 4) ||
                (this.strain == 'HEARTS'   && this.level >= 4) ||
                (this.strain == 'DIAMONDS' && this.level >= 5) ||
                (this.strain == 'CLUBS'    && this.level >= 5));
    }
});

/**************************************************************************
 * Criterion
 **************************************************************************/

// General criterion that takes the match function as an input and
// does all operations by calling that function.  Downside is that it
// could get slow, if the combination of criteria gets complicated,
// and you probably won't be able to easily tell what a combination
// of criteria means.
bridge.crit = bridge._object.extend({
    desc: null,
    match: null,
    invert: function() {
        var _this = this;
        return this.make({
            match: function(hand, detail) {
                return !_this.match(hand, detail);
            },
            desc: function() {
                return "(not " + _this.desc() + ")";
            },
        });
    },
    compatible: function(other) {
        return true;
    },
    assert_compatible: function(other) {
        if (!this.compatible(other)) {
            throw "Can't operate on incompatible criteria: " + this + " and " + other;
        }
    },
    union: function(other) {
        this.assert_compatible(other);
        var _this = this;
        return this.make({
            match: function(hand, detail) {
                return _this.match(hand, detail) || other.match(hand, detail);
            },
            desc: function() {
                return "(" + _this.desc() + " or " + other.desc() + ")";
            },
        });
    },
    intersect: function(other) {
        this.assert_compatible(other);
        var _this = this;
        return this.make({
            match: function(hand, detail) {
                return _this.match(hand, detail) && other.match(hand, detail);
            },
            desc: function() {
                return "(" + _this.desc() + " and " + other.desc() + ")";
            },
        });
    },
    init: function() {
        if (this.match === null) {
            this.match = function(hand, detail) {
                return true;
            };
            if (this.desc === null) {
                this.desc = function(hand, detail) {
                    return "MATCH_ALL";
                };
            }
        } else if (this.desc === null) {
            this.desc = function() {
                return this.match.toString();
            };
        }
    },
});

// A criterion where you extract a value from a hand (with some
// function which is provided by subclasses) and it must match a set
// of accepted values.
bridge.choice_crit = bridge.crit.extend({
    func: null,
    name: null,
    values: [],
    allvalues: [],
    match: function(hand, detail) {
        var handval = this.func(hand);
        if (this.values.indexOf(handval) < 0) {
            if (detail) {
                console.log("Bad value: " + handval +
                            " not in " + this.values);
            }
            return false;
        }
        return true;
    },
    invert: function() {
        var _this = this;
        return this.make({
            values: _this.allvalues.filter(function(x) {
                return _this.values.indexOf(x) < 0 }),
        });
    },
    union: function(other) {
        this.assert_compatible(other);
        var _this = this;
        return this.make({
            values: _this.allvalues.filter(function(x) {
                return _this.values.indexOf(x) >= 0 ||
                    other.values.indexOf(x) >= 0;
            }),
        });
    },
    intersect: function(other) {
        this.assert_compatible(other);
        var _this = this;
        return this.make({
            values: _this.allvalues.filter(function(x) {
                return _this.values.indexOf(x) >= 0 &&
                    other.values.indexOf(x) >= 0;
            }),
        });
    },
    compatible: function(other) {
        return bridge.is_same_type(this, other)
    },
    desc: function() {
        return this.name + " in " + this.values;
    },
});

// A criterion that matches hands that have a certain number of cards
// of a given suit
bridge.ncard_crit = bridge.choice_crit.extend({
    suit: null,
    func: function(h) { return h.by_suit[this.suit].length; },
    allvalues: bridge.range(0, 12),
    compatible: function(other) {
        return bridge.is_same_type(this, other) && this.suit == other.suit;
    },
    init: function() {
        this.name = "num " + this.suit + "s";
    }
});

// A criterion that looks at a given variable of a hand
bridge.vcrit = bridge.choice_crit.extend({
    variable: null,
    func: function(h) { return h[this.variable]; },
    compatible: function(other) {
        return bridge.is_same_type(this, other) && this.variable == other.variable;
    },
    init: function() {
        this.name = this.variable;
    }
});

// A criterion that looks at a given method of a hand
bridge.fcrit = bridge.choice_crit.extend({
    fname: null,
    func: function(h) { return h[this.fname](); },
    compatible: function(other) {
        return bridge.is_same_type(this, other) && this.fname == other.fname;
    },
    init: function() {
        this.name = this.fname + "()";
    }
});

/**************************************************************************
 * And-criterion
 **************************************************************************/
// A criterion which is made up of a list of sub-criteria.  This
// criterion is true if all of the sub-criteria are true.
bridge.and_crit = bridge.crit.extend({
    crits: [],
    match: function(hand, detail) {
        for (var ii = 0; ii < this.crits.length; ii++) {
            if (this.crits[ii].match(hand, detail)) {
                return false;
            }
        }
        return true;
    },
    desc: function() {
        return desc.crits.map(function(c) { return c.desc(); }).join(' AND ');
    },
});

/**************************************************************************
 * Or-criterion
 **************************************************************************/
// A criterion which is made up of a list of sub-criteria.  This
// criterion is true if any of the sub-criteria are true.
bridge.or_crit = bridge.crit.extend({
    crits: [],
    match: function(hand, detail) {
        for (var ii = 0; ii < this.crits.length; ii++) {
            if (this.crits[ii].match(hand, detail)) {
                return true;
            }
        }
        return false;
    },
    desc: function() {
        return this.crits.map(function(c) { return c.desc(); }).join(' OR ');
    },
});

/**************************************************************************
 * New Hand Range
 **************************************************************************/
// A criterion which is made up of a list of sub-criteria.  This
// criterion is true if all of the sub-criteria are true.
// This is unused
bridge.handrange = bridge.crit.extend({
    crits: [],
    match: function(hand, detail) {
        for (var ii = 0; ii < this.crits.length; ii++) {
            if (!this.crits[ii].match(hand, detail)) {
                return false;
            }
        }
        return true;
    },
    invert: function() {
        return bridge.handset.make({crits: this.crit.map(
            function(c) {return c.invert();}
        )});
    },
    union: function(other) {
        if (this.crits.length == 1 && other.crits.length == 1 && this.compatible(other)) {
            return this.make({
                crits: [this.crits[0].union(other.crits[0])],
            });
        } else {
            return bridge.handset.make({crits: [this, other]});
        }
    },
    intersect: function(other) {
        var newobj = this.make();
        for (var ii = 0; ii < other.crits.length; ii++) {
            var matched = false;
            for (var jj = 0; jj < newobj.crits.length; jj++) {
                if (newobj.crits[jj].compatible(other.crits[ii])) {
                    newobj.crits[jj] = newobj.crits[jj].intersect(other.crits[ii]);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                newobj.crits.push(other.crits[ii]);
            }
        }
        return newobj;
    },
    compatible: function(other) {
        return bridge.is_same_type(this, other);
    },
});

/**************************************************************************
 * Old Handrange
 **************************************************************************/
bridge.handrange = bridge.crit.extend({
    points:      null,
    nCLUBS:      null,
    nDIAMONDS:   null,
    nHEARTS:     null,
    nSPADES:     null,
    is_balanced: null,
    vars: ['points', 'nCLUBS', 'nDIAMONDS', 'nHEARTS', 'nSPADES', 'is_balanced'],
    match: function(hand, detail) {
        // A hand much match all criteria to match.
        if (detail === null) {
            detail = false;
        }
        if (this.points !== null && this.points.indexOf(hand.points()) < 0) {
            if (detail) {
                console.log("Bad points: " + hand.points() + " not in " + this.points);
            }
            return false;
        }
        for (var ss = 0; ss < bridge.consts.SUITS.length; ss++) {
            suit = bridge.consts.SUITS[ss];
            if (this["n" + suit] !== null &&
                this["n" + suit].indexOf(hand.by_suit[suit].length) < 0)
            {
                if (detail) {
                    console.log("Bad " + suit + ": " + hand.by_suit[suit].length +
                                " not in " + this["n" + suit]);
                }
                return false;
            }
        }
        if (this.is_balanced !== null &&
            this.is_balanced.indexOf(hand.is_balanced()) < 0)
        {
            if (detail) {
                console.log("Bad is_balanced: " + hand.is_balanced() +
                            " not in " + this.is_balanced);
            }
            return false;
        }
        return true;
    },
    desc: function() {
        var _this = this;
        return this.vars.filter(function(v) {
            return _this[v] !== null;
        }).map(function(v) {
            return "(" + v + " in " + _this[v] + ")";
        }).join(' AND ');
    }
});

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

bridge.strategy.is_opening = function(bid_history) {
    return (bid_history.length < 2 ||
            bid_history.length < 4 &&
            bid_history[bid_history.length-2].toString() == "PS");
};

bridge.strategy.is_opening_response = function(bid_history) {
    return (bid_history.length > 1 &&
            bridge.strategy.is_opening(bid_history.slice(0, bid_history.length-2)));
};

// This currently doesn't check that the bid is valid (bigger than the
// previous bid), though that only matters if the opponents bid.
bridge.strategy.make_rules = function(bid_history) {
    var rules = [];
    if (bridge.strategy.is_opening(bid_history)) {
        // Opening.  Either your partner hasn't had a chance to bid, or
        // your partner passed.
        rules.push([
            bridge.handrange.make({points: bridge.range(0, 12)}),
            bridge.bid.make({str: "PS"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(16, 18),
                                   is_balanced: [true]}),
            bridge.bid.make({str: "1N"})]);

        rules.push([bridge.or_crit.make({crits: [
            bridge.handrange.make({nSPADES: bridge.range(7, 13)}),
            bridge.handrange.make({nSPADES: [6], nHEARTS: bridge.range(0, 5)}),
            bridge.handrange.make({nSPADES: [5], nHEARTS: bridge.range(0, 4)}),
        ]}), bridge.bid.make({str: "1S"})]);

        rules.push([
            bridge.handrange.make({nHEARTS: bridge.range(5, 13)}),
            bridge.bid.make({str: "1H"})]);

        rules.push([
            bridge.handrange.make({nDIAMONDS: [3], nCLUBS: [3]}),
            bridge.bid.make({str: "1C"})]);

        rules.push([bridge.or_crit.make({crits: [
            bridge.handrange.make({nDIAMONDS: bridge.range(7, 13)}),
            bridge.handrange.make({nDIAMONDS: [6], nCLUBS: bridge.range(0, 6)}),
            bridge.handrange.make({nDIAMONDS: [5], nCLUBS: bridge.range(0, 5)}),
            bridge.handrange.make({nDIAMONDS: [4], nCLUBS: bridge.range(0, 4)}),
        ]}), bridge.bid.make({str: "1D"})]);

        rules.push([
            bridge.crit.make({}),
            bridge.bid.make({str: "1C"})]);
    }
    else if (bridge.strategy.is_opening_response(bid_history) &&
             bid_history[bid_history.length-2].toString() == "1N")
    {
        // Responding to a 1 no-trump opening bid
        rules.push([
            bridge.handrange.make({points: bridge.range(0, 7), nSPADES: bridge.range(5, 13)}),
            bridge.bid.make({str: "1S"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(0, 7), nHEARTS: bridge.range(5, 13)}),
            bridge.bid.make({str: "1H"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(0, 7), nCLUBS: bridge.range(5, 13)}),
            bridge.bid.make({str: "1D"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(0, 7), nDIAMONDS: bridge.range(5, 13)}),
            bridge.bid.make({str: "1C"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(0, 7)}),
            bridge.bid.make({str: "PS"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(8, 9)}),
            bridge.bid.make({str: "2N"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(8, 9)}),
            bridge.bid.make({str: "2N"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(10,40), nSPADES: bridge.range(6, 13)}),
            bridge.bid.make({str: "4S"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(10,40), nHEARTS: bridge.range(6, 13)}),
            bridge.bid.make({str: "4H"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(10,40), nSPADES: [5]}),
            bridge.bid.make({str: "3S"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(10,40), nHEARTS: [5]}),
            bridge.bid.make({str: "3H"})]);

        rules.push([
            bridge.handrange.make({points: bridge.range(10,40)}),
            bridge.bid.make({str: "3N"})]);
    }
    else if (bridge.strategy.is_opening_response(bid_history) &&
             bid_history[bid_history.length-2].toString()[0] == "1")
    {
        // Responding to a suit opening bid
        rules.push([
            bridge.handrange.make({points: bridge.range(0, 5)}),
            bridge.bid.make({str: "PS"})]);

        var open = bid_history[bid_history.length-2];
        if (bridge.consts.is_major(open.strain)) {
            var attrs = bridge._object.make({});
            attrs["n" + open.strain] = bridge.range(3, 13);
            rules.push([
                bridge.handrange.make(attrs.make({points: bridge.range(6, 10)})),
                bridge.bid.make({level: 2, strain: open.strain})]);

            rules.push([
                bridge.handrange.make(attrs.make({points: bridge.range(11, 12)})),
                bridge.bid.make({level: 3, strain: open.strain})]);

            rules.push([
                bridge.handrange.make(attrs.make({points: bridge.range(13, 40)})),
                bridge.bid.make({level: 4, strain: open.strain})]);
        }
        /*
          Otherwise:
          Bid a new suit:
          You may bid a new suit at the 1 level with 4+ cards (and 6+ points)
          You may bid a new suit at the 2 level only with 5+ cards and 13+ points
          Prefer to bid your longest suit if possible.  However, if you have <13 points, you can only bid suits at the one level, and therefore may need to bid your second longest suit.
          Equal length tiebreakers:
          When holding exactly 4 hearts and 4 spades, bid 1H
          Otherwise bid the higher ranking suit
          Bidding a new suit may have unlimited points, and is therefore forcing
          With 6-12 points, no 4+ card major, and 5+ card support for opener's minor, raise:
          6-10 points:    2 level
          11-12 points:  3 level
          When nothing else applies:  Make a "utility response" in notrump:
          6-10 points:    1NT
          11-12 points:  2NT
          13+ points:     3NT
        */
    }
    else if (bid_history[bid_history.length-2].toString() == 'PS')
    {
        rules.push([
            bridge.crit.make({}),
            bridge.bid.make({str: "PS"})]);
    }
    else if (bid_history[bid_history.length-2].is_game())
    {
        rules.push([
            bridge.crit.make({}),
            bridge.bid.make({str: "PS"})]);
    }
    else {
        // XXX
    }
    return rules;
};

// make_bid:
//
// Given a bid history, and a hand, figure out what the next bid
// should be.
bridge.strategy.make_bid = function(bid_history, hand) {
    var rules = bridge.strategy.make_rules(bid_history);
    for (var rr = 0; rr < rules.length; rr++) {
        if (rules[rr][0].match(hand)) {
            return rules[rr][1];
        }
    }
    throw "Incomplete bid rules"
};

// Given a bid history (and a hand), return possible hand ranges for
// the last bid.
bridge.strategy.interpret_bid = function(bid_history, hand) {
    // copy the bid_history before we mutate it
    bid_history = bid_history.slice(0);
    var last_bid = bid_history.pop();
    var rules = bridge.strategy.make_rules(bid_history);
    var handrange = bridge.crit.make({});
    for (var rr = 0; rr < rules.length; rr++) {
        if (last_bid != rules[rr][1]) {
            handrange = handrange.intersect(rules[rr][0].invert());
        }
        else {
            return handrange.intersect(rules[rr][0]);
        }
    }
    return handrange;
};

/**************************************************************************
 * Run a sample auction
 **************************************************************************/

bridge.auction = function(hands) {
    if (!hands) {
        hands = bridge.deal();
    }
    for (var hh = 0; hh < hands.length; hh++) {
        console.log(hands[hh].toString());
        console.log("points: " + hands[hh].points());
    }
    var bids = [];
    var hh = 0;
    var npasses = 0;
    while (true) {
        var bid = bridge.strategy.make_bid(bids, hands[hh]);
        console.log(hh + ": " + bid.toString());
        if (bid.toString() == 'PS') {
            npasses++;
        } else {
            npasses = 0;
        }
        if (npasses == 4) {
            break;
        }
        bids.push(bid);
        hh = (hh + 1) % hands.length;
    }
}

/**************************************************************************
 * Unit Tests
 **************************************************************************/

bridge.test = function() {
    var c = bridge.card.make({
        id: 4,
    });
    if (c.suit != "CLUBS") {
        throw "Bad suit";
    }
    c = bridge.deck[4];
    if (c.suit != "CLUBS") {
        throw "Bad suit";
    }
    if (bridge.card.make({ str: "TH" }).toString() != "TH") {
        throw "Bad card TH";
    }
    if (bridge.deck[51].toString() != "AS") {
        throw "Bad deck";
    }
    var h = bridge.hand.make({
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
    }).toString() != "1S") {
        throw "Bad bid 4";
    }
    if (bridge.bid.make({ str: "1S" }).toString() != "1S") {
        throw "Bad bid 1S";
    }
    var b = bridge.bid.make({
        id: 35,
    });
    if (b.toString() != "7N") {
        throw "Bad bid 35";
    }
    h = bridge.hand.make({
        cards: bridge.range(0, 12),
    });
    var hands = bridge.deal();
    c = bridge.ncard_crit.make({suit: 'SPADES', values: bridge.range(0, 2),});
    if (!c.match(h)) {
        throw "Bad crit for hand:\n" + h;
    }
    var d = c.invert();
    c.union(d);
    for (var ii = 0; ii < hands.length; ii++) {
        if ((hands[ii].by_suit['SPADES'].length > 2 && c.match(hands[ii])) ||
            (hands[ii].by_suit['SPADES'].length < 3 && !c.match(hands[ii])))
        {
            throw "Bad crit for hand " + ii + "\n" + hands[ii];
        }
    }
    if (hands.reduce(function(a, b) { return a + b.hc_points(); }, 0) != 40) {
        throw "hand points don't sum to 40"
    }
    return hands;
};

/**************************************************************************/
