define(['backbone', 'controllers/router'], function(Backbone, Router) {
  var AppView = Backbone.View.extend({
    initialize: function() {
      var _router = new Router();
      console.log(a);
      console.log( 'Wahoo!' );
    },
    renderGrid: function(rows, columns) {}
  });
  return AppView;

});