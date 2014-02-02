var bridge = bridge || {};

// Following recommendations in
// http://www.adobe.com/devnet/html5/articles/javascript-object-creation.html

bridge.card = {
    // Constants
    N_SUITS: 4,
    N_CARDS_PER_SUIT: 13,

    // Members
    id : null,
    suit : null,
    rank : null,

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
        if (this.suit === null) {
	    this.suit = Math.floor(this.id / this.N_CARDS_PER_SUIT) + 1;
	}
        if (this.rank === null) {
	    this.rank = this.id % this.N_CARDS_PER_SUIT + 1;
	}
	return this;
    },
};

bridge.hand = {
};

bridge.handrange = {
};

(function() {
    if (typeof Object.create !== "function") {
        Object.create = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }
}());


