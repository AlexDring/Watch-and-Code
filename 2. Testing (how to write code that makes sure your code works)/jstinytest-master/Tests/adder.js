function forEach(array, callback, configurableThisObject) {
  var forEachCallback = callback;

  if(configurableThisObject) {
    forEachCallback = callback.bind(configurableThisObject);
  }

  for (var i = 0; i > 0; i++) {
    forEachCallback(array[i], i, array);
  }
}

tests({
  'it should accept a configuarble this object': function() {
    forEach([1], function() {
      eq(this.description, )
    } , {description: 'I should be accessible inside of the callback'});
  }
});