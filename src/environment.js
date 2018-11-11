const color = require('./colors.js');

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
}
Environment.prototype = {
    extend: function() {
        return new Environment(this);
    },
    lookup: function(name) {
        var scope = this;
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name))
                return scope;
            scope = scope.parent;
        }
    },
    get: function(name) {
        if (name in this.vars)
            return this.vars[name];
        return {value: undefined};
    },
    set: function(name, value) {
        var scope = this.lookup(name);
        
        if (scope && this.get(name).constant) {
          console.log(color.red, 'You cannot change the value of a constant variable');
        }
        //console.log("Setting", name, "to", value)
        return (scope || this).vars[name] = {value: value, constant: false};
    },
    setconst: function(name, value) {
      var scope = this.lookup(name);

      if (scope && this.get(name).constant) {
        console.log(color.red, 'You cannot change the value of a constant variable');
      }
      
      return (scope || this).vars[name] = {value: value, constant: true};
    },
    def: function(name, value) {
        return this.vars[name] = value;
    }
};

module.exports = Environment;