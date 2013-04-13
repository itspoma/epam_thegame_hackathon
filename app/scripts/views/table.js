var PageListItemView = Backbone.View.extend({
    template: _.template($('#tpl-table-row').html()),
    events: { "click span.dot": "publish" },
    render: function (eventName) {
       var html = this.template(this.model.toJSON());
       this.setElement($(html));
       return this;
    },
    publish: function () {
        console.log(this.model.get("Metadata").Name);
    }
});

var PageListView = Backbone.View.extend({
    tagName: 'table',
    initialize: function () {
        this.collection.bind("reset", this.render, this);
    },
    render: function (eventName) {
        this.$el.empty();

        this.collection.each(function(page) {
            var pageview=new PageListItemView({ model: page });
            var $tr=pageview.render().$el;           
            this.$el.append($tr);
        },this);

        return this;
    }
});