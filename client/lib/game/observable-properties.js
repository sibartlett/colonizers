/*!
 * Based on Knockout ES5 plugin - https://github.com/SteveSanderson/knockout-es5
 * Copyright (c) Steve Sanderson
 * MIT license
 */

'use strict';

var ko = require('knockout'),
    notifyWhenPresentOrFutureArrayValuesMutate = require('./observable-arrays');

function defineObservableProperty(obj, propertyName, value) {
  var isComputed = typeof value === 'function',
      isArray = Array.isArray(value),
      observable;

  if (isComputed) {
    observable = ko.computed(value, obj);
  } else if (isArray) {
    observable = ko.observableArray(value);
    notifyWhenPresentOrFutureArrayValuesMutate(ko, observable);
  } else {
    observable = ko.observable(value);
  }

  obj._observables = obj._observables || {};
  obj._observables[propertyName] = observable;

  if (isComputed) {
    Object.defineProperty(obj, propertyName, {
      get: observable
    });
  } else {
    Object.defineProperty(obj, propertyName, {
      get: observable,
      set: observable
    });
  }
}

function defineObservableProperties(obj, properties) {
  var props, simple, computed;

  obj._observables = obj._observables || {};

  if (!obj.getObservable) {
    obj.getObservable = function getObservable(observableName) {
      return this._observables[observableName];
    }.bind(obj);
  }

  if (!obj.subscribe) {
    obj.subscribe = function subscribe(observableName, fn) {
      var observable = this._observables[observableName];
      if (observable) {
        observable.subscribe(fn);
      }
    }.bind(obj);
  }

  props = Object.getOwnPropertyNames(properties)
    .map(function(name) {
      return {
        name: name,
        value: properties[name]
      };
    });

  simple = props.filter(function(prop) {
    return typeof prop.value !== 'function';
  });

  computed = props.filter(function(prop) {
    return typeof prop.value === 'function';
  });

  simple.concat(computed).forEach(function(prop) {
    defineObservableProperty(obj, prop.name, prop.value);
  });
}

function copyObservables() {
  var obj = arguments[0],
      others = Array.prototype.slice.call(arguments, 1);

  others
  .filter(function(item) {
    return item._observables ? true : false;
  })
  .forEach(function(item) {
    var propNames = Object.getOwnPropertyNames(item);
    propNames.forEach(function(propName) {
      var propDescriptor = Object.getOwnPropertyDescriptor(item, propName);
      Object.defineProperty(obj, propName, propDescriptor);
    });
  });
}

module.exports = {
  defineProperty: defineObservableProperty,
  defineProperties: defineObservableProperties,
  copyObservables: copyObservables
};
