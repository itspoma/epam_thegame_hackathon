define(['backbone'], function() {
    var rowTemplate=_.template("<tr>"+
         "<td class='name'><%= name %></td>"+
         "<td class='age'><%= age %></td>"+
         "</tr>");

    /** View representing a table */
    var TableView = Backbone.View.extend({
        tagName: 'table',

        initialize : function() {
            _.bindAll(this,'render','renderOne');
        },
        render: function() {
            this.collection.each(this.renderOne);
            return this;
        },
        renderOne : function(model) {
            var row=new RowView({model:model});
            this.$el.append(row.render().$el);
            return this;
        }
    });

    /** View representing a row of that table */
    var RowView = Backbone.View.extend({  
        events: {
            "click .age": function() {console.log(this.model.get("name"));}
        },

        render: function() {
            var html=rowTemplate(this.model.toJSON());
            this.setElement( $(html) );
            return this;
        }
    });

    //var html = tableView.render().$el;
    return TableView;
    //$("body").append( tableView.render().$el );
});