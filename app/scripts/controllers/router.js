define (['backbone'], function() {
  var Router = Backbone.Router.extend({
    routes: {
        "": "start",
        "!/": "start",
        "!/success": "success",
        "!/error": "error"
    },

    start: function () {
        $('.loader').show();
    },

    success: function () {
        $('.loader').hide();
        $('.game-wrapper').show();
    },

    error: function () {
        $('.loader').hide();
        $('.error').show();
    }
  });
  return Router;
});