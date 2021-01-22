//ユーザーとSocket.ioサーバの間を取り持ってくれます。

//自分自身の情報
const IAM = {
  token: null,
  name : null
};


/*              STEP1. Socket.io サーバへ接続
----------------------------------------------------------*/
const socket = io();

//正常に接続したら
socket.on( "connect", () => {
  //表示を切り替える
  $( "#nowconnecting" ).style.display = "none"; // [接続中]を非表示に
  $( "#inputmyname" ).style.display = "block"; //表示
} );

// トークンが発行されたら
socket.on( "token", ( data ) => {
  IAM.token = data.token;
} );

/*              STEP2. 名前を入力
----------------------------------------------------------*/
$( "#frm-myname" ).addEventListener( "submit", ( e ) => {
  //規定の送信処理をキャンセル（画面遷移など
  e.preventDefault();

  //入力文字を取得
  const myname = $( "#txt-myname" );
  if( myname.value === "" ){
    return false;
  }

  //名前をセット
  $( "#myname" ).innerHTML = myname.value;
  IAM.name = myname.value;

  //表示を切り変える
  $( "#inputmyname" ).style.display = "none";
  $( "#chat" ).style.display = "block";
} );

/*              STEP3. チャット開始
----------------------------------------------------------*/
//formが送信された
$( "#frm-post" ).addEventListener( "submit", ( e ) => {
  //規定の送信処理をキャンセル（画面遷移など
  e.preventDefault();

  //内容を取得
  const msg = $( "#msg" );
  if( msg.value === "" ){
    return false;
  }

  //Socket.io サーバへ送信
  socket.emit( "post", {
    text: msg.value,
    token: IAM.token,
    name: IAM.name
  } );

  //フォームを空に
  msg.value = "";
});

//誰かが発言した
socket.on( "member-post", ( msg ) => {
  const is_me = ( msg.token === IAM.token );
  addMessage( msg, is_me );
});


/**
 * 発言を表示する
 *
 * @param {object}  msg
 * @param {boolean} [is_me=false]
 * @return {void}
 */
 function addMessage( msg, is_me = false )
 {
   const list = $( "#msglist" );
   const li   = document.createElement( "li" );

   //自分の発言
   if( is_me ){
     li.innerHTML = `<span class="msg-me"><span class="name">${msg.name}</span>> ${msg.text}</span>`;
   }else{
     li.innerHTML = `<span class="msg-member"><span class="name">${msg.name}</span>> ${msg.text}</span>`;
   }

   //リストの最初に追加
   list.insertBefore( li, list.firstChile );
 }
 
