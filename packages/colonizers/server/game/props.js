'use strict';

function defineProperty(obj, propertyName, value) {
  if (typeof value === 'function') {
    Object.defineProperty(obj, propertyName, {
      get: value
    });
  } else {
    Object.defineProperty(obj, propertyName, {
      value: value,
      writable: true
    });
  }
}

function defineProperties(obj, properties) {
  var propertyNames = Object.getOwnPropertyNames(properties);
  propertyNames.forEach(function(propertyName) {
    defineProperty(obj, propertyName, properties[propertyName]);
  });
}

module.exports = {
  defineProperty: defineProperty,
  defineProperties: defineProperties
};
