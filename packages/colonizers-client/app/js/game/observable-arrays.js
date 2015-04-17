/*!
 * Based on Knockout ES5 plugin - https://github.com/SteveSanderson/knockout-es5
 * Copyright (c) Steve Sanderson
 * MIT license
 */

'use strict';

// Array handling
// --------------
//
// Arrays are special, because unlike other property types, they have standard
// mutator functions (`push`/`pop`/`splice`/etc.) and it's desirable to trigger
// a change notification whenever one of those mutator functions is invoked.
//
// Traditionally, Knockout handles this by putting special versions of
// `push`/`pop`/etc. on observable arrays that mutate the underlying array and
// then trigger a notification. That approach doesn't work for Knockout-ES5
// because properties now return the underlying arrays, so the mutator runs
// in the context of the underlying array, not any particular observable:
//
//     // Operates on the underlying array value
//     myModel.someCollection.push('New value');
//
// To solve this, Knockout-ES5 detects array values, and modifies them as
// follows:
//  1. Associates a hidden subscribable with each array instance that it
//     encounters
//  2. Intercepts standard mutators (`push`/`pop`/etc.) and makes them trigger
//     the subscribable
// Then, for model properties whose values are arrays, the property's underlying
// observable subscribes to the array subscribable, so it can trigger a change
// notification after mutation.

// After each array mutation, fires a notification on the given subscribable
function wrapStandardArrayMutators(array, subscribable, signal) {
  var fnNames =
    ['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'];
  fnNames.forEach(function(fnName) {
    var origMutator = array[fnName];
    array[fnName] = function() {
      var result = origMutator.apply(this, arguments);
      if (signal.pause !== true) {
        subscribable.notifySubscribers(this);
      }

      return result;
    };
  });
}

// Adds Knockout's additional array mutation functions to the array
function addKnockoutArrayMutators(ko, array, subscribable, signal) {
  var fnNames = ['remove', 'removeAll', 'destroy', 'destroyAll', 'replace'];
  fnNames.forEach(function(fnName) {
    // Make it a non-enumerable property for consistency with standard Array
    // functions
    Object.defineProperty(array, fnName, {
      enumerable: false,
      value: function() {
        var result;

        // These additional array mutators are built using the underlying
        // push/pop/etc. mutators, which are wrapped to trigger notifications.
        // But we don't want to trigger multiple notifications, so pause the
        // push/pop/etc. wrappers and delivery only one notification at the end
        // of the process.
        signal.pause = true;
        try {
          // Creates a temporary observableArray that can perform the operation.
          var fn = ko.observableArray.fn[fnName];
          result = fn.apply(ko.observableArray(array), arguments);
        }
        finally {
          signal.pause = false;
        }

        subscribable.notifySubscribers(array);
        return result;
      }
    });
  });
}

// Gets or creates a subscribable that fires after each array mutation
function getSubscribableForArray(ko, array) {
  var subscribable = array._subscribable;
  var signal = {};

  if (!subscribable) {
    subscribable = array._subscribable = new ko.subscribable();

    wrapStandardArrayMutators(array, subscribable, signal);
    addKnockoutArrayMutators(ko, array, subscribable, signal);
  }

  return subscribable;
}

// Listens for array mutations, and when they happen, cause the observable to
// fire notifications. This is used to make model properties of type array fire
// notifications when the array changes.
// Returns a subscribable that can later be disposed.
function startWatchingarray(ko, observable, array) {
  var subscribable = getSubscribableForArray(ko, array);
  return subscribable.subscribe(observable);
}

// Given an observable that underlies a model property, watch for any array
// value that might be assigned as the property value, and hook into its change
// events
function notifyWhenPresentOrFutureArrayValuesMutate(ko, observable) {
  var watchingArraySubscription = null;
  ko.computed(function() {
    // Unsubscribe to any earlier array instance
    if (watchingArraySubscription) {
      watchingArraySubscription.dispose();
      watchingArraySubscription = null;
    }

    // Subscribe to the new array instance
    var newarray = observable();
    if (newarray instanceof Array) {
      watchingArraySubscription = startWatchingarray(ko, observable, newarray);
    }
  });
}

module.exports = notifyWhenPresentOrFutureArrayValuesMutate;
