//
var app = {};

// settings
app.settings = {
    boardWidth: 10,
    boardHeight: 7
};

// user clicked points
// app.points[x+':'+y] = {uid:?, x:?, y:?}
app.points = {};

//
app.users = {};
app.userTurn = null;

app.initDummy = function() {
    app.users = {
        1: {id:1, name:'user1', hero:'wolf'},
        2: {id:2, name:'user2', hero:'sheep'}
    };
    app.userTurn = 1;
};

app.helpers = {
    rand: function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    //
    drawTable: function() {
        var $container = $('#container');

        $container.append($('<table/>'));

        // append <tr></tr>
        for (var x=1; x<=app.settings.boardHeight; x++) {
            $('table', $container).append('<tr></tr>');

            // append <td></td>
            for (var y=1; y<=app.settings.boardWidth; y++) {
                $('table tr:last', $container).append(
                    $('<td/>')
                      .data('x', x)
                      .data('y', y)
                      .html('<span></span>')
                );
            }
        }
    },

    //
    getUserData: function(uid) {
      return app.users[uid];
    },

    //
    getPointData: function(x,y) {
        var data = app.points[x+':'+y];
        if (typeof(data) === 'undefined') {
            return null;
        }

        data.$td = $('td', $('tr').eq(x-1)).eq(y-1);

        return data;
    },

    //
    addPoint: function (x,y,uid) {
        app.points[x+':'+y] = {
            'uid': uid,
            'x': parseInt(x, 10),
            'y': parseInt(y, 10),
            'captured': false
        };
    },

    // get count points around required point
    // @param x,y
    getClosestPoints:function(x,y,uid) {
        // 8 rounded
        var pointOffsets = [
            [-1,-1],[0,-1],[+1,-1],
            [-1,0],/*[0,0],*/[+1,0],
            [-1,+1],[0,+1],[+1,+1]
        ];

        var result = [];

        for (var i = 0, pointOffset; pointOffset = pointOffsets[i]; i++) {
            var xPos = x + pointOffset[0];
            var yPos = y + pointOffset[1];

            var pointData = app.helpers.getPointData(xPos, yPos);

            if (pointData && pointData.uid===uid && pointData.captured!==true) {
                result.push(pointData);
            }
        }

        return result;
    },

    // get points count in polygon
    // @param {points} [[x,y],[x,y],[x,y],..]
    getEnemiesInBox: function(points, uid) {

        // check if point are inside in polygon
        var isPointInPoly = function(poly, pt){
            for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
                ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
                && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
                && (c = !c);
            return c;
        };

        //
        var enemyPoints = [];

        // calc total points inside
        // for (var i = 0, point; point = app.points[i]; i++) {
        for (var i in app.points) {
            var point = app.points[i];

            // we need only enemies points
            if (point.uid == uid) {
                continue;
            }

            var isPointInPolygonBorder = false;
            for (var i = 0, pointBorder; pointBorder = points[i]; i++) {
                if (point.x==pointBorder[0] && point.y==pointBorder[1]) {
                    isPointInPolygonBorder = true;
                    break;
                }
            }

            if (!isPointInPolygonBorder) {
                if (isPointInPoly(points, {x:point.x, y:point.y})) {
                    enemyPoints.push(point);
                }
            }
        };

        return enemyPoints;
    },

    //
    calculatePolygon: function(x,y,uid, params) {
        params = params || {
          depth: 0,
          excludes: [],
          startPoint: {'x':x, 'y':y},
          pointsPath: []
        };
        var __pre = x+':'+y+(new Array(params.deeph).join(' ')) + ' > ';

        var points = app.helpers.getClosestPoints(x,y,uid);

        if (points.length > 0) {
            params.excludes.push(x+':'+y);

            for (var i = 0, point; point = points[i]; i++)
            {
                if (point.x == params.startPoint.x && point.y == params.startPoint.y) {
                    if (params.depth >= 3) {

                        params.pointsPath.push(point);

                        var enemiesInsidePoints = app.helpers.getEnemiesInBox(params.pointsPath, uid);
                        console.log('ENEMIES IN BOX', enemiesInsidePoints.length);

                        if (enemiesInsidePoints.length >= 1)
                        {
                            console.log(__pre+'WO-HO-HO !!!!!!!!!!!!!!!!!!!!', x,y,point,params);

                            // params.pointsPath.push(params.startPoint);

                            console.log('ENEMIES IN BOX', enemiesInsidePoints.length);

                            for (var i=0; i<=params.pointsPath.length-1; i++) {
                                var _point = params.pointsPath[i];

                                var _pointData = app.helpers.getPointData(_point.x, _point.y);

                                _pointData.$td.addClass('filled_now filled_now_'+i);
                                $('span',_pointData.$td).addClass('filled');
                            }

                            els = $('.filled_now');
                            for (var i=0; i<=els.length-1; i++) {
                                var _el = $('.filled_now_'+i);
                                var _nextEl = $('.filled_now_'+(i+1)).length>0 ? $('.filled_now_'+(i+1)) : $('.filled_now_0');

                                var ax = _el.position().left+38;
                                var ay = _el.position().top+38;
                                var bx = _nextEl.position().left+38;
                                var by = _nextEl.position().top+38;

                                linedraw(ax,ay, bx,by);
                            };

                            $('.connect_line:not(.processed)').hide();
                            $('.connect_line:not(.processed)').each(function(){
                              $(this).addClass('processed').slideToggle('slow');
                            });

                            // $('.connect_line').slideToggle('slow')

                            $('.filled_now').each(function(){
                              $(this).attr('class',  $(this).attr('class').replace(/filled_now_\d+/,'')   );
                            });

                            // mark captured enemies
                            for (var i = 0, enemiesInsidePoint; enemiesInsidePoint = enemiesInsidePoints[i]; i++) {
                                var pointData = app.helpers.getPointData(enemiesInsidePoint.x, enemiesInsidePoint.y);
                                app.points[pointData.x+':'+pointData.y].captured = true;

                                var $span = $('span', pointData.$td);

                                (function(el) {
                                  $span.animate({opacity:0.4},400,function(){
                                    $span.addClass('captured');
                                  });
                                })($span);
                            }

                            return true;
                        }
                    }
                }
                else {
                    if ($.inArray(point.x+':'+point.y, params.excludes) === -1)
                    {
                        var path = params.pointsPath;
                            path.push(point);

                        arguments.callee(point.x, point.y, uid, {
                            depth: params.depth+1,
                            excludes: params.excludes,
                            startPoint: params.startPoint,
                            pointsPath: path
                        });
                    }
                }
            }
        }

        return false;
    }
};

app.binders = {
    //
    onPointClick: function(){
        var $td = $(this);

        var x = $td.data('x');
        var y = $td.data('y');

        var pointData = app.helpers.getPointData(x,y);
        if (pointData !== null) {
            alert(pointData.user);
            return;
        }

        var userData = app.helpers.getUserData(app.userTurn);

        $('span',$td).addClass(userData.hero);
        app.helpers.addPoint(x, y, userData.id);

        app.helpers.calculatePolygon(x, y, userData.id);

        if (app.userTurn == 1) {
          app.userTurn = 2;
        }
        else {
          app.userTurn = 1;
        }
    }
};

app.bindEvents = function() {
    $container = $('#container');
    $('table td', $container).on('click', app.binders.onPointClick);
};

//
app.init = function() {
    $('.login').hide();
    $('.game').show().css({opacity:1,left:0});
    app.helpers.drawTable();
    // timer.start('player2Info', function(){
    //   alert('Finished counting down');
    // });
    app.bindEvents();

    // rand hero's animation
    setInterval(function(){
       $els = app.helpers.rand(1,2) == 1 ? $('.wolf:not(.hover)') : $('.sheep:not(.hover)');
       $el = $els.eq(app.helpers.rand(0,$els.length-1));
       (function(){
          $el.addClass('hover');
          setTimeout(function(){$el.removeClass('hover')},100);
       })($el);
    }, 300);
};

//
app.initDummy();
app.init();

function linedraw(ax,ay,bx,by)
{
    var _id = "line_"+ax+"_"+ay+"_"+bx+"_"+by;
    if(ay>by)
    {
        bx=ax+bx;
        ax=bx-ax;
        bx=bx-ax;
        by=ay+by;
        ay=by-ay;
        by=by-ay;
    }
    var calc=Math.atan((ay-by)/(bx-ax));
    calc=calc*180/Math.PI;
    var length=Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by));

    if (ax == bx) {
      calc = 0;
      ay += 50;
    }
    if (ay == by) {
        if (ax<bx) {
          calc = 270;
        }
        else {
          calc = 90;
        }
    }

    var userData = app.helpers.getUserData(app.userTurn);

    document.body.innerHTML += "<div class='connect_line type_"+userData.hero+"' id='"+_id+"' style='height:" + length + "px;width:8px;position:absolute;top:" + (ay) + "px;left:" + (ax) + "px;-webkit-transform:rotate("+calc+"deg);-webkit-transform-origin:0% 0%;'></div>";
}