
var duck = {  //鸭子对象
    duckSinging: function() {
        console.log( '嘎嘎嘎' );
    }
};

var chicken = {  //鸡对象
    duckSinging: function() {
        console.log( '嘎嘎嘎' );
    }
};

var choir = []; // 合唱团！
var joinChoir = function( animal ) {
    if ( animal && typeof animal.duckSinging === 'function' ) { 
        //稍作检测，只要有唱歌的方法就可以用。
        choir.push( animal );
        console.log( '恭喜加入合唱团' );
        console.log( '合唱团已有成员数量:' + choir.length );
    }
};

joinChoir( duck ); // 恭喜加入合唱团
joinChoir( chicken ); // 恭喜加入合唱团
