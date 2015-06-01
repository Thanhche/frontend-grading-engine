
/***
*     _____ _            _____            _            
*    |_   _| |          |  ___|          (_)           
*      | | | |__   ___  | |__ _ __   __ _ _ _ __   ___ 
*      | | | '_ \ / _ \ |  __| '_ \ / _` | | '_ \ / _ \
*      | | | | | |  __/ | |__| | | | (_| | | | | |  __/
*      \_/ |_| |_|\___| \____/_| |_|\__, |_|_| |_|\___|
*                                    __/ |             
*                                   |___/              
*/
/*
  Returns the TA object, which is responsible for querying the DOM and performing tests.

  Each active_test creates its own instance of TA, referenced in active_test as `iwant`.

  Bullseye: Target tree
*/


/*
TODO:

if debug mode, attach a unique class to each element as it gets targeted

*/

/*
TODO:
error messages all over this code
documentation
*/


function Target() {
  this.id = parseInt(Math.random() * 1000000);
  this.element = null;
  this.value = null;
  this.operation = null;
  this.children = [];
  this.parent = null;
};

Object.defineProperties(Target.prototype, {
  hasChildren: {
    get: function() {
      var hasKids = false;
      if (this.children.length > 0) {
        hasKids = true;
      };
      return hasKids;
    }
  },
  hasValue: {
    get: function() {
      var somethingThere = false;
      if (this.value !== null && this.value !== undefined) {
        somethingThere = true;
      };
      return somethingThere;
    }
  },
  // TODO: this might not be working?
  hasGrandkids: {
    get: function() {
      var gotGrandKids = false;
      gotGrandKids = this.children.some(function (kid) {
        return kid.hasChildren;
      });
      return gotGrandKids;
    }
  }
});


/*
TODO:

Move all grading methods to GradeBook. TA methods call GradeBook methods
 */

/**
 * Maintains and reports on the state of a set of questions. Each question consists of a student value and our expected value.
 */
function GradeBook() {
  this.questions = [];
  this.passed = false;
};

Object.defineProperties(GradeBook.prototype, {
  numberOfQuestions: {
    get: function () {
      return this.questions.length;
    }
  },
  numberCorrectQuestions: {
    get: function () {
      var numberCorrect = 0;
      this.questions.forEach(function (question) {
        if (question.correct) {
          numberCorrect +=1;
        }
      })
      return numberCorrect;
    }
  },
  allCorrect: {
    get: function () {
      var isAllGood = false;
      if (this.numberOfQuestions === this.numberCorrectQuestions) {
        isAllGood = true;
      }
      return isAllGood;
    }
  },
  numberWrongQuestions: {
    get: function () {
      var numberWrong = 0;
      numberWrong = numberOfQuestions - numberCorrectQuestions;
      return numberWrong;
    }
  },
  report: {
    get: function () {
      return {
        passed: this.passed,
        questions: this.questions
      };
    }
  }
});

/**
 * Takes in a set of values from the target. Adds to gradebook.
 * @param {object} targetFragment - only what the GradeBook needs to know about the Target
 */
GradeBook.prototype.recordQuestion = function (targetFragment) {
  this.questions.push({
    id: targetFragment.id,
    value: targetFragment.value
  });
};

/**
 * Will iterate through all the questions and return if they meet grade criteria
 * @param  {object} config - {string} config.strictness, {boolean} config.not, {function} config.callback
 * @return {boolean} passed - Are enough questions correct to pass the active_test?
 */
GradeBook.prototype.grade = function (config) {
  var strictness, not, callback;
  strictness = config.strictness;
  not = config.not;
  callback = config.callback; // expect that the callback encapsulates any comparison values from us

  this.questions.forEach(function (question) {
    question.correct = callback(question.value);
    if (not) {
      question.correct = !question.correct;
    }
  });

  var passed = false;
  switch (strictness) {
    case 'some':
      if (this.numberCorrectQuestions < this.numberOfQuestions && this.numberCorrectQuestions > 0) {
        passed = true;
      };
      break;
    case 'onlyOne':
      if (this.numberCorrectQuestions === 1) {
        passed = true;
      };
      break;
    default:
      passed = this.allCorrect;
      break;
  };

  this.passed = passed;
  return passed;
};


function TA() {
  this.target = null;
  this.gradebook = new GradeBook();
  this.operations = [];
  this.needToIterate = false;
  this.gradeOpposite = false;
  this.testingExistence = false;
  this.picky = false;
};

Object.defineProperties(TA.prototype, {
  count: {
    get: function() {
      this.runAgainstNextToBottomTargets(function (target) {
        return target.children.length;
      })
      return this;
    }
  },
  not: {
    get: function () {
      this.gradeOpposite = true;
      return this;
    }
  },
  numberOfTargets: {
    get: function () {
      return this.targetIds.length;
    }
  },
  onlyOneOf: {
    get: function () {
      this.picky = 'onlyOneOf';
      return this;
    }
  },
  pageImageBytes: {
    get: function () {
      // TODO
    }
  },
  someOf: {
    get: function () {
      this.picky = 'someOf';
      return this;
    }
  },
  targetIds: {
    get: function () {
      var ids = [];
      this.traverseTargets(function (target) {
        ids.push(target.id);
      });
      return ids;
    }
  },
  toExist: {
    get: function() {
      this.testingExistence = true;
      var operations = this.operations || [];
      
      var doesExist = false;
      
      // typeof null === "object", for some insane reason. This is to correct for it.
      if (operations === null) {
        operations = false;
      }
      var typeOfOperation = typeof operations;
      if (typeOfOperation === "object" && operations instanceof Array) {
        typeOfOperation = "array";
      }

      if (typeOfOperation !== "array") {
        this.operations = [operations]
      }

      var doesExistFunc = function () {};
      var subDoesExist = false;

      switch (typeOfOperation) {
        case "number":
          doesExistFunc = function (x) {
            var subDoesExist = false;
            if (x > 0) {
              subDoesExist = true;
            }
          }
          break;
        case "string":
          doesExistFunc = function (x) {
            var subDoesExist = false;
            if (x.length > 0) {
              subDoesExist = true;
            }
          }
          break;
        case "array":
          doesExistFunc = function (x) {
            if (x) {
              return true;
            } else {
              return false;
            }
          }
          break;
        case "object":
          doesExistFunc = function (x) {
            var subDoesExist = false;
            if (Object.keys(x).length > 0) {
              subDoesExist = true;
            }
          }
          break;
        case "function":
          doesExistFunc = function (x) {
            var subDoesExist = false;
            if (x.getBody().length > 0) {
              subDoesExist = true;
            }
          }
          break;
        default:
          // good for booleans or undefined
          doesExistFunc = function (x) {
            var subDoesExist = false;            
            if (x) {
              subDoesExist = true;
            }
          }
          break;
      }

      doesExist = this.grade(doesExistFunc);
      return this.wrapUpAndReturn(doesExist);
    }
  },
  UAString: {
    get: function () {
      this.operations = navigator.userAgent;
      this.documentValueSpecified = navigator.userAgent;
      return this;
    }
  },
  value: {
    get: function () {
      // TODO: TA returns a single value from the first Target hit with a value. Used to create vars in active_tests.
      // return this.documentValueSpecified;
      // var self = this;
      // return self.visitDfs(function() {
      //   console.log(this.value);
      // });
      var value = null;
      this.traverseTargets(function (target) {
        if (target.value) {
          value = target.value
        };
      });
      return value;
    }
  },
  values: {
    get: function () {
      // BROKEN
      // TODO: TA returns a <no>flat array of Targets </no>with non-null values. Used to create vars in active_tests.
      var values = [];
      this.traverseTargets(function (target) {
        if (target.value) {
          values.push(target.value);
        };
      });
      return values;
    }
  }
})

/**
 * Let the tester know this just happened
 * @param  {string} operation - the thing that just happened
 */
TA.prototype.registerOperation = function (operation) {
  this.operations.push(operation);
};


// TODO: use config to determine if all targets should be traversed or if it, for instance, breaks after the first value gets hit?
TA.prototype.traverseTargets = function (callback, lastNodeCallback, config) {
  // http://www.timlabonne.com/2013/07/tree-traversals-with-javascript/
  // var totalNumberOfTargets, numberOfTargets;
  // totalNumberOfTargets = this.numberOfTargets;
  // numberOfTargets = 0;

  /**
   * Recursively dive into a tree structure from the top. Used on the Target structure here.
   * @param  {object} node - node of tree in question. Start with the top.
   * @param  {function} func - function to run against each node
   * @param  {function} lastNodeCallback - will be called after the last function has run against the last node. Does not take a parameter! Should be bullseye independent.
   */
  function visitDfs (node, func, lastNodeCallback) {
    if (func) {
      func(node);
    }
 
    node.children.forEach(function (child, index, arr) {
      visitDfs(child, func);
    });

    // // TODO: check that this actually works
    // numberOfTargets +=1;
    // if (numberOfTargets === totalNumberOfTargets) {
    //   lastNodeCallback();
    // };
  };
  // don't really need this
  function visitBfs (node, func) {
    var q = [node];
    while (q.length > 0) {
      node = q.shift();
      if (func) {
        func(node);
      }

      node.children.forEach(function (child, index, arr) {
        q.push(child);
      });
    }
  };
  visitDfs(this.target, callback, lastNodeCallback);
};

TA.prototype.wrapUpAndReturn = function (passed) {
  // last work to be done before returning result
  var singleVal = this.documentValueSpecified;
  var multiVal = this.targeted; // probably just want their values, not the nodes

  if (!(this.operations instanceof Array)) {
    this.operations = [this.operations];
  }
  return {
    isCorrect: passed,
    actuals: this.operations
  };
};

TA.prototype.runAgainstTopTargetOnly = function (callback) {};
TA.prototype.runAgainstBottomTargets = function (callback) {
  var self = this;

  var allTargets = this.targetIds;

  this.traverseTargets(function (target) {
    if (!target.hasChildren && allTargets.indexOf(target.id) > -1) {
      target.value = callback(target);
      self.gradebook.recordQuestion({
        id: target.id,
        value: target.value
      });
    }
  })  
};

// should only be used to direct TA to bullseye location to collect values
TA.prototype.runAgainstBottomTargetElements = function (callback) {
  var self = this;

  var allTargets = this.targetIds;

  this.traverseTargets(function (target) {
    if (!target.hasChildren && allTargets.indexOf(target.id) > -1) {
      target.value = callback(target.element);
      self.gradebook.recordQuestion({
        id: target.id,
        value: target.value
      });
    }
  })
};

// should only be used to direct TA to bullseye location to collect values
TA.prototype.runAgainstNextToBottomTargets = function (callback) {
  var self = this;

  this.traverseTargets(function (target) {
    // TODO: YEP! Definitely broken
    if (target.hasChildren && !target.hasGrandkids) { // TODO: test that hasGrandkids works
      target.value = callback(target);
      self.gradebook.recordQuestion({
        id: target.id,
        value: target.value
      });
    }
  })
};


/**
 * Generates the top-level target. Matched elements end up as children targets. It will not have a element.
 * @param  {string} CSS selector - the selector of the elements you want to query
 * @return {object} this - the TA object
 */
TA.prototype.theseNodes = function (selector) {
  this.registerOperation('gatherElements');

  this.target = new Target();

  var self = this;

  getDomNodeArray(selector).forEach(function (elem, index, arr) {
    var target = new Target();
    target.element = elem;
    self.target.children.push(target);
  });

  return this;
}
TA.prototype.theseElements = TA.prototype.theseNodes;

/**
 * Will run a query against the lowest level targets in the Target tree
 * @param  {string} CSS selector - the selector of the children you want to query
 * @return {object} this - the TA object
 */
TA.prototype.deepChildren = function (selector) {
  this.registerOperation('gatherDeepChildElements');

  this.runAgainstBottomTargets(function (node) {
    getDomNodeArray(selector, node.element).forEach(function (newElem) {
      var childTarget = new Target();
      childTarget.element = newElem;
      node.children.push(childTarget);
    });
  });


  // this.traverseTargets(function (node) {
  //   if (!node.hasChildren && newChildrenIds.indexOf(node.id) === -1) {      
  //     getDomNodeArray(selector, node.element).forEach(function (newElem) {

  //       var childTarget = new Target();
  //       childTarget.operation = operation;
  //       childTarget.element = newElem;
  //       node.children.push(childTarget);

  //       // to register that this child was just created and doesn't need to be traversed
  //       newChildrenIds.push(childTarget.id);
  //     })
  //   };
  // });
  return this;
};
TA.prototype.children = TA.prototype.deepChildren;

TA.prototype.shallowChildren = function (selector) {
  var operation = 'gatherChildElements';
  this.operations = operation;

  var self = this;
  getDomNodeArray(selector, parent).forEach(function (elem, index, arr) {
    self.target.elements.push(elem);
  });
  return this;
};

TA.prototype.cssProperty = function (property) {
  this.registerOperation('cssProperty');

  this.runAgainstBottomTargetElements(function (elem) {
    var styles = getComputedStyle(elem);
    return styles[property];
  });
  return this;
}

TA.prototype.attribute = function (attr) {
  this.registerOperation('attr')

  this.runAgainstBottomTargetElements(function (elem) {
    var attrValue = elem.getAttribute(attr);
    if (attrValue === '') {
      attrValue = true;
    }
    return attrValue;
  });
  return this;
}

TA.prototype.absolutePosition = function (side) {
  this.registerOperation('absolutePosition');
  // http://stackoverflow.com/questions/2880957/detect-inline-block-type-of-a-dom-element
  function getDisplayType (element) {
    var cStyle = element.currentStyle || window.getComputedStyle(element, ""); 
    return cStyle.display;
  };

  var selectorFunc = function () {};
  switch (side) {
    case 'top':
      var selectorFunc = function (elem) {
        var displayType = getDisplayType(elem);
        var value = NaN;
        if (displayType === 'block') {
          value = elem.offsetTop;
        } else if (displayType === 'inline') {
          value = elem.getBoundingClientRect()[side];
        };
        return value;
      };
      break;
    case 'left':
      var selectorFunc = function (elem) {
        var displayType = getDisplayType(elem);
        var value = NaN;
        if (displayType === 'block') {
          value = elem.offsetLeft;
        } else if (displayType === 'inline') {
          value = elem.getBoundingClientRect()[side];
        };
        return value;
      };
      break;
    case 'bottom':
      var selectorFunc = function (elem) {
        var displayType = getDisplayType(elem);
        var value = NaN;
        if (displayType === 'block') {
          value = elem.offsetTop + elem.offsetHeight;
        } else if (displayType === 'inline') {
          value = elem.getBoundingClientRect()[side];
        };
        if (value === Math.max(document.documentElement.clientHeight, window.innerHeight || 0)) {
          value = 'max';
        };
        return value;
      };
      break;
    case 'right':
      var selectorFunc = function (elem) {
        var displayType = getDisplayType(elem);
        var value = NaN;
        if (displayType === 'block') {
          value = elem.offsetLeft + elem.offsetWidth;
        } else if (displayType === 'inline') {
          value = elem.getBoundingClientRect()[side];
        };
        if (value === Math.max(document.documentElement.clientWidth, window.innerWidth || 0)) {
          value = 'max';
        };
        return value;
      };
      break;
    default:
      selectorFunc = function () {
        console.log("You didn't pick a side for absolutePosition! Options are 'top', 'left', 'bottom' and 'right'.");
      };
      break;
  };

  this.runAgainstBottomTargetElements(function (elem) {
    return selectorFunc(elem);
  });
  return this;
};


/*
  @param: y* (any value)
  @param: noStrict/ (default: false)
*/
TA.prototype.toEqual = function(y, noStrict) {
  noStrict = noStrict || false;
  
  var isEqual = false;
  var equalityFunc = function() {};
  switch (noStrict) {
    case true:
      equalityFunc = function(x, y) {
        return x == y;
      };
      break;
    case false:
      equalityFunc = function(x, y) {
        return x === y;
      };
      break;
    default:
      equalityFunc = function(x, y) {
        return x === y;
      };
      break;
  }

  isEqual = this.grade(equalityFunc, y);
  return this.wrapUpAndReturn(isEqual);
}

TA.prototype.toBeGreaterThan = function(y, orEqualTo) {
  orEqualTo = orEqualTo || false;
  var isGreaterThan = false;

  var greaterThanFunc = function() {};
  switch (orEqualTo) {
    case true:
      greaterThanFunc = function (x, y) {
        var isGreaterThan = false;
        if (x >= y) {
          isGreaterThan = true;
        }
        return isGreaterThan;
      }
    case false:
      greaterThanFunc = function (x, y) {
        var isGreaterThan = false;
        if (x > y) {
          isGreaterThan = true;
        }
        return isGreaterThan;
      }
    default:
      greaterThanFunc = function (x, y) {
        var isGreaterThan = false;
        if (x > y) {
          isGreaterThan = true;
        }
        return isGreaterThan;
      }
  }

  isGreaterThan = this.grade(greaterThanFunc, y);
  return this.wrapUpAndReturn(isGreaterThan);
}

TA.prototype.toBeLessThan = function(y, orEqualTo) {
  orEqualTo = orEqualTo || false;
  var isLessThan = false; // TODO: delete?

  var lessThanFunc = function() {};
  switch (orEqualTo) {
    case true:
      lessThanFunc = function (x, y) {
        var isLessThan = false;
        if (x <= y) {
          isLessThan = true;
        }
        return isLessThan;
      }
    case false:
      lessThanFunc = function (x, y) {
        var isLessThan = false;
        if (x < y) {
          isLessThan = true;
        }
        return isLessThan;
      }
    default:
      lessThanFunc = function (x, y) {
        var isLessThan = false;
        if (x < y) {
          isLessThan = true;
        }
        return isLessThan;
      }
  }

  isLessThan = this.grade(lessThanFunc, y);
  return this.wrapUpAndReturn(isLessThan);
};

TA.prototype.toBeInRange = function(lower, upper, lowerInclusive, upperInclusive) {
  lowerInclusive = lowerInclusive || true;
  upperInclusive = upperInclusive || true;
  var isInRange = false;

  var xIsLessThan = function () {};
  switch (lowerInclusive) {
    case true:
      xIsLessThan = function (x, y) {
        var isInRange = false;
        if (x <= y) {
          isInRange = true;
        }
        return isInRange;
      }
    case false:
      xIsLessThan = function (x, y) {
        var isInRange = false;
        if (x < y) {
          isInRange = true;
        }
        return isInRange;
      }
    default:
      xIsLessThan = function (x, y) {
        var isInRange = false;
        if (x < y) {
          isInRange = true;
        }
        return isInRange;
      }
  }

  var xIsGreaterThan = function () {};
  switch (upperInclusive) {
    case true:
      xIsGreaterThan = function (x, y) {
        var isInRange = false;
        if (x >= y) {
          isInRange = true;
        }
        return isInRange;
      }
    case false:
      xIsGreaterThan = function (x, y) {
        var isInRange = false;
        if (x > y) {
          isInRange = true;
        }
        return isInRange;
      }
    default:
      xIsGreaterThan = function (x, y) {
        var isInRange = false;
        if (x > y) {
          isInRange = true;
        }
        return isInRange;
      }
  }

  var inRangeFunc = function (x, y) {
    var isInRange = false;
    x = x.replace('px', '');
    x = x.replace('%', '');
    if (xIsLessThan(x, range.upper) && xIsGreaterThan(x, range.lower)) {
      isInRange = true;
    }
    return isInRange;
  }

  var range = {upper: upper, lower: lower}; // this is a hack because genIsCorrect expects only one comparison value
  isInRange = this.grade(inRangeFunc, range);
  return this.wrapUpAndReturn(isInRange);
};

TA.prototype.toHaveSubstring = function (values, config) {
  // works on value if it's already there, otherwise it acts on innerHTML

  var self = this;
  config = config || {};
  this.needToIterate = true;
  // make sure values are an array
  if (!(values instanceof Array)) {
    values = [values];
  };
  var hasRightNumberOfSubstrings = false;

  var nInstances            = config.nInstances || false,   // TODO: not being used (Is there a good use case?)
      minInstances          = config.minInstances || 1,     // TODO: not being used
      maxInstances          = config.maxInstances || false, // TODO: not being used
      nValues               = config.nValues || false,
      minValues             = config.minValues || 1,
      maxValues             = config.maxValues || 'all';

  if (maxValues === 'all') {
    maxValues = values.length;
  };

  // TODO: refactor functionally?
  var substringFunc = function (targetedObj, values) {
    var string = '';
    if (targetedObj instanceof Node) {
      string = targetedObj.innerHTML;
    } else if (targetedObj.elem) {
      string = targetedObj.elem.innerHTML;
    } else {
      string = targetedObj;
    };
    var hasNumberOfValsExpected = false;
    var hits = 0;
    values.forEach(function(val, index, arr) {
      if (string.search(val) > -1) {
        hits+=1;
      };
    });

    if (nValues) {
      (hits === nValues) ? hasNumberOfValsExpected = true : hasNumberOfValsExpected = false;
    } else if (hits >= minValues && hits <= maxValues) {
      hasNumberOfValsExpected = true;
    };
    self.operations = [hasNumberOfValsExpected];
    return hasNumberOfValsExpected;
  };
  hasRightNumberOfSubstrings = this.grade(substringFunc, values);
  return this.wrapUpAndReturn(hasRightNumberOfSubstrings);
}




