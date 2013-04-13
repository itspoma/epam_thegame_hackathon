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

                            params.pointsPath.push(params.startPoint);

                            console.log('ENEMIES IN BOX', enemiesInsidePoints.length);
                            // mark captured enemies
                            for (var i = 0, enemiesInsidePoint; enemiesInsidePoint = enemiesInsidePoints[i]; i++) {
                                app.points[enemiesInsidePoint.x+':'+enemiesInsidePoint.y].captured = true;
                            }

                            for (var i=0; i<=params.pointsPath.length-1; i++) {
                                var _point = params.pointsPath[i];

                                var $td = $('td', $('tr').eq(_point.x-1)).eq(_point.y-1);
                                $('span',$td).addClass('filled');

                                if ($('i.connected',$td).length==0) {
                                  $td.prepend($('<i/>').attr('class','connected'));
                                }
                                $i = $('i.connected',$td);

                                var _nextPoint = params.pointsPath[i+1];
                                if (typeof(_nextPoint)=='undefined') {
                                  _nextPoint = params.pointsPath[0];
                                }

                                if (_nextPoint.x==_point.x && _nextPoint.y<_point.y) {
                                  $i.addClass('connect_left');
                                }

                                else if (_nextPoint.x==_point.x && _nextPoint.y>_point.y) {
                                  $i.addClass('connect_right');
                                }

                                else if (_nextPoint.x>_point.x && _nextPoint.y<_point.y) {
                                  $i.addClass('connect_bottomleft');
                                }

                                else if (_nextPoint.x>_point.x && _nextPoint.y>_point.y) {
                                  $i.addClass('connect_bottomright');
                                }

                                else if (_nextPoint.x<_point.x && _nextPoint.y>_point.y) {
                                  $i.addClass('connect_topright');
                                }

                                else if (_nextPoint.x<_point.x && _nextPoint.y<_point.y) {
                                  $i.addClass('connect_topleft');
                                }

                                else if (_nextPoint.x<_point.x && _nextPoint.y==_point.y) {
                                  $i.addClass('connect_bottom');
                                }

                                else if (_nextPoint.x>_point.x && _nextPoint.y==_point.y) {
                                  $i.addClass('connect_bottom');
                                }

                                // else if (_nextPoint.x==_point.x && _nextPoint.y==_point.y) {
                                //   $i.addClass('connect_temp');//!!
                                // }

                                else {
                                  console.log($td);
                                  console.log('_point',_point.x,_point.y);
                                  console.log('_nextPoint',_nextPoint.x,_nextPoint.y);
                                }

                                console.log($td, $i.attr('class'));
                                console.log('');
                            }

                            return;
                        }
                    }
                }
                else {
                    // console.log(__pre+'FIND ',point.x+':'+point.y);

                    if ($.inArray(point.x+':'+point.y, params.excludes) === -1)
                    {
                        var path = params.pointsPath;
                            path.push(point);

                        //weight += 1 +
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
    app.helpers.drawTable();
    app.bindEvents();
};

//
app.initDummy();
app.init();

//
// Object.prototype.keys = function() {
//     var keys = [];
//     for(var i in this) if (this.hasOwnProperty(i)) {
//         keys.push(i);
//     }
//     return keys;
// };