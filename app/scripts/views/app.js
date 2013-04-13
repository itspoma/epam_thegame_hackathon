define(['backbone', 'controllers/router', 'views/table'], function(Backbone, Router, TableView) {
  var AppView = Backbone.View.extend({
    initialize: function() {
      var _router = new Router();
      this.renderGrid();
    },
    renderGrid: function(rows, columns) {
      var data = [
        {'name': 'Oli', 'age': 25},
        {'name': 'Sarah', 'age': 20}];

      /** Collection of models to draw */
      var peopleCollection = new Backbone.Collection(data);
      var tableView = new TableView({collection: peopleCollection});

      $('body').append(tableView.render().$el);
    }
  });
  return AppView;

});