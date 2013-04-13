timer = {
  start: function(id, callback){
    var timer;
    var timerFinish;
    var timerSeconds = 60;
    function drawTimer(percent){
      $('#' + id).find('.timer').html('<div class="percent"></div><div id="slice"'+(percent > 50?' class="gt50"':'')+'><div class="pie"></div>'+(percent > 50?'<div class="pie fill"></div>':'')+'</div>');
      var deg = 360/100*percent;
      $('#slice .pie').css({
        '-moz-transform':'rotate('+deg+'deg)',
        '-webkit-transform':'rotate('+deg+'deg)',
        '-o-transform':'rotate('+deg+'deg)',
        'transform':'rotate('+deg+'deg)'
      });
      $('.percent').html(Math.round(percent)+'%');
    }
    function stopWatch(){
      var seconds = (timerFinish-(new Date().getTime()))/1000;
      if(seconds <= 0){
        drawTimer(100);
        clearInterval(timer);
        callback();
      }else{
        var percent = 100-((seconds/timerSeconds)*100);
        drawTimer(percent);
      }
    }

    drawTimer(0);
    timerFinish = new Date().getTime()+(timerSeconds*1000);
    timer = setInterval(function(){
      stopWatch();
    },50);
  }
}