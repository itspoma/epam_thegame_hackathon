var app = {};

$(function(){


app.points = {};

app.canvas = {
    width: 320,
    height: 480,
    boxSize: 20,

    init: function() {
        var cw = this.width + 1;
        var ch = this.height + 1;

        app.$canvas = $('<canvas/>').attr({width: cw, height: ch}).appendTo('body');
        app.$context = app.$canvas.get(0).getContext("2d");

        this.drawGrid();
    },

    drawGrid: function() {
        for (var x = 0; x <= this.width; x += this.boxSize) {
            app.$context.moveTo(0.5 + x, 0);
            app.$context.lineTo(0.5 + x, this.height);
        }

        for (var x = 0; x <= this.height; x += this.boxSize) {
            app.$context.moveTo(0, 0.5 + x);
            app.$context.lineTo(this.width, 0.5 + x);
        }

        app.$context.strokeStyle = "silver";
        app.$context.stroke();
    },

    drawPoint: function(x, y, params) {
        x = Math.round( x / this.boxSize ) * this.boxSize;
        y = Math.round( y / this.boxSize ) * this.boxSize;

        params = params || {};

        app.$context.beginPath();
        app.$context.arc(x, y, 5, 0, Math.PI*2, true);
        app.$context.fillStyle = params.color || 'red';
        app.$context.closePath();
        app.$context.fill();

        var gridPos = app.canvas.getGridPos(x,y);
        app.points[gridPos[0]+':'+gridPos[1]] = 'red';
    },

    drawLine: function(startX,startY,endX,endY,params) {
        params = params || {};

        app.$context.beginPath();
        app.$context.moveTo(startX, startY);
        app.$context.lineTo(endX, endY);
        app.$context.lineWidth = 5;
        app.$context.strokeStyle = params.color || 'green';
        app.$context.stroke();
    },

    getGridPos: function(x,y) {
        return [
            Math.round(x/app.canvas.boxSize),
            Math.round(y/app.canvas.boxSize)
        ];
    },

    drawText: function(x,y) {
        app.$context.fillStyle = "blue";
        app.$context.font = "bold 16px Arial";
        app.$context.fillText("Zibri", x, y);
    },

    getClosestDots:function(x,y) {
        var pointOffsets = [
            [-1,-1],[0,-1],[+1,-1],
            [-1,0],/*[0,0],*/[+1,0],
            [-1,+1],[0,+1],[+1,+1]
        ];

        var result = [];

        for (var i = 0, pointOffset; pointOffset = pointOffsets[i]; i++) {
            //var xPos = x + (pointOffset[0] * app.canvas.boxSize);
            //var yPos = y + (pointOffset[1] * app.canvas.boxSize);

            var xPos = x + pointOffset[0];
            var yPos = y + pointOffset[1];

            if (typeof(app.points[xPos+':'+yPos]) != 'undefined') {
                result.push([xPos,yPos]);
            }

            //app.canvas.drawPoint(xPos, yPos, {color:'green'});

            //var imgd = app.$context.getImageData(xPos,yPos, 1,1).data;
            //var dotColor = ([imgd[0],imgd[1],imgd[2]]);

            //console.log(app.points);

            //console.log(dotColor);
            //if (dotColor[0]==255 && dotColor[1]==0 && dotColor[2]==0) {
            //    weight++;
            //}
        }

        return result;
    },

    calcBox: function(x,y,params) {
        params = params || {};
        params.deep = params.deep || 0;
        params.excludes = params.excludes || {};
        params.startPoint = params.startPoint || [x,y];
        params.pointsPath = params.pointsPath || [];

        var weight = 0;
        var points = app.canvas.getClosestDots(x,y);

        var __pre = x+':'+y+(new Array(params.deep).join(' ')) + ' > ';

        if (points.length > 0) {
            params.excludes[x+':'+y] = 1;

            for (var i = 0, point; point = points[i]; i++) {
                if (point[0]==params.startPoint[0] && point[1]==params.startPoint[1]) {
                    if (params.deep >= 3) {
                        params.pointsPath.push([x,y]);
                        params.pointsPath.push(params.startPoint);

                        console.log(__pre+'WO-HO-HO !!!!!!!!!!!!!!!!!!!!', x,y,point,params);
                        for (var i=0; i<=params.pointsPath.length-1; i++) {
                            var startPoint = params.pointsPath[i];
                            var endPoint = params.pointsPath[i+1];
                            console.log('startPoint',startPoint);
                            console.log('endPoint',endPoint);
                            app.canvas.drawLine(
                                startPoint[0]*app.canvas.boxSize,startPoint[1]*app.canvas.boxSize,
                                endPoint[0]*app.canvas.boxSize,endPoint[1]*app.canvas.boxSize
                            );
                        }

                        return;
                    }
                }
                else {
                    console.log(__pre+'FIND ',point);
                    if (typeof(params.excludes[point[0]+':'+point[1]]) != 'undefined') {
                        console.log(__pre+point, 'SKIP');
                        // break;
                    }
                    else {
                        console.log(__pre+'point', point);

                        var _aa = params.pointsPath;
                            _aa.push([x,y]);

                        weight += 1 + arguments.callee(point[0], point[1], {
                            deep: params.deep+1,
                            excludes: params.excludes,
                            startPoint: params.startPoint,
                            pointsPath: _aa
                        });
                    }
                }
            }
        }

        return weight;
    }
};

app.mouse = {};

app.binders = {
    init: function() {
        app.$canvas.click(function(e){
            offset = app.$canvas.offset();
            x = parseInt(e.pageX - offset.left);
            y = parseInt(e.pageY - offset.top);

            app.canvas.drawPoint(x, y);

            var gridPos = app.canvas.getGridPos(x,y);
            console.log('CLICK', gridPos[0], gridPos[1]);
            var weight = app.canvas.calcBox(gridPos[0], gridPos[1]);
            console.log(weight);
        });
    }
};

app.canvas.init();
app.binders.init();


});