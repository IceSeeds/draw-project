//ユーザーとSocket.ioサーバの間を取り持ってくれます。

//自分自身の情報
const IAM = {
  token: null,
  name : null,
  is_join: false //入室してるか。
};

//メンバー一覧を入れる箱
const MEMBER = {
  0: "マスター"
};

//Socket.io のクライアント用のオブジェクトをセット
const socket = io();

/*              STEP1. Socket.io サーバへ接続
----------------------------------------------------------*/

// トークンが発行されたら
socket.on( "token", ( data ) => {
  IAM.token = data.token;

  //表示を切り変える
  if( !IAM.is_join )
  {
    $( "#nowconnecting" ).style.display = "none"; // [接続中]を非表示に
    $( "#inputmyname" ).style.display = "block"; //表示
    $( "#txt-myname" ).focus();
  }
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

  //ボタンを無効にする
  $( "#frm-myname button" ).setAttribute( "disabled", "disabled" );
} );

//入室結果が返ってきた
socket.on( "join-result", ( data ) => {
  //正常に入室
  if( data.status ){
    IAM.is_join = true;

    //既にログイン中のメンバー一覧を反映
    for( let i = 0; i < data.list.length; i++ )
    {
      const cur = data.list[i];
      if( !( cur.token in MEMBER ) )
      {
        addMemberList( cur.token, cur.name );
      }
    }

    //表示切り替え
    $( "#inputmyname" ).style.display = "none";
    $( "#chat" ).style.display = "block";
    $( "#msg" ).focus();
  }else {
    alert( "入室できませんでした。" );
  }

  //ボタンを有効に戻す
  $( "#frm-myname button" ).removeAttribute( "disabled" );
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


/*    自分
-------------*/
//退出ボタンが押された
$( "#frm-quit" ).addEventListener( "submit", ( e ) => {
  e.preventDefault();

  if( confirm( "本当に退出しますか？？" ) )
  {
    //Socket.ioサーバへ送信
    socket.emit( "quit", {token: IAM.token} );

    //ボタンを無効にする
    $( "#frm-quit button" ).setAttribute( "disabled", "disabled" );
  }
} );

//退出処理の結果が帰ってきた
socket.on( "quit-result", ( data ) => {
  if( data.status )
  {
    gotoSTEP1();
  }else{
    alert( "退出できませんでした。" );
  }
  //ボタンを有効に戻す
  $( "#frm-quit button" ).removeAttribute( "disabled" );
} );


/*   誰か
-------------*/
//誰かが入室
socket.on( "member-join", ( data ) => {
  if( IAM.is_join )
  {
    addMessageFromMaster( `${data.name}さんが入室しました` );
    addMemberList( data.token, data.name );
  }
} );
//誰かが退出
socket.on( "member-quit", ( data ) => {
  if( IAM.is_join )
  {
    const name = MEMBER[data.token];
    addMessageFromMaster( `${name}さんが退出しました` );
    removeMemberList( data.token );
  }
} );
//誰かが発言した
socket.on( "member-post", ( msg ) => {
  if( IAM.is_join )
  {
    const is_me = ( msg.token === IAM.token );
    addMessage( msg, is_me );
  }
});

/**
* 最初の状態に戻す
*
* @return { void }
*/
function gotoSTEP1()
{
  // NowLoadingから開始
  $( "#nowconnecting" ).style.display = "block";  // NowLoadingを表示
  $( "#inputmyname" ).style.display   = "none";   // 名前入力を非表示
  $( "#chat" ).style.display          = "none";   // チャットを非表示

  // 自分の情報を初期化
  IAM.token   = null;
  IAM.name    = null;
  IAM.is_join = false;

  //メンバー一覧を初期化
  for( let ket in MEMBER )
  {
    if( key !== "0" )
    {
      delete MEMBER[key];
    }
  }

  // チャット内容を全て消す
  $( "#txt-myname" ).value = "";     // 名前入力欄 STEP2
  $( "#myname" ).innerHTML = "";     // 名前表示欄 STEP3
  $( "#msg" ).value = "";            // 発言入力欄 STEP3
  $( "#msglist" ).innerHTML = "";    // 発言リスト STEP3
  $( "#memberlist" ).innerHTML = ""; // メンバーリスト STEP3

  //Socket.ioサーバへ再接続
  socket.close().open();
}

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

   //マスターの発言
   if( msg.token === 0 ){
     li.innerHTML = `<span class="msg-master"><span class="name">${name}</span>> ${msg.text}</span>`;
   }else if( is_me ){
     //自分の発言
     li.innerHTML = `<span class="msg-me"><span class="name">${msg.name}</span>> ${msg.text}</span>`;
   }else{
     //それ以外の発言
     li.innerHTML = `<span class="msg-member"><span class="name">${msg.name}</span>> ${msg.text}</span>`;
   }

   //リストの最初に追加
   list.insertBefore( li, list.firstChile );
 }


/**
* チャットマスターの発言
*
* @param {string} msg
* @return {void}
*/
function addMessageFromMaster( msg )
{
  addMessage( {token: 0, text: msg} );
}

/**
* メンバーリストに追加
*
* @param {string} token
* @param {string} name
* @return {void}
*/
function addMemberList( token, name )
{
  const list = $( "#memberlist" );
  const li = document.createElement( "li" );

  li.setAttribute( "id", `member-${token}` );
  if( token === IAM.token )
  {
    li.innerHTML = `<span class="member-me">${name}</span>`;
  }else {
    li.innerHTML = name;
  }

  //リストの最後に追加
  list.appendChild( li );

  // 内部変数に保存
  MEMBER[token] = name;
}

/**
* メンバーリストから削除
*
* @param {string} token
* @return {void}
*/
function removeMemberList( token )
{
  const id = `#member-${token}`;
  if( $( id ) !== null )
  {
    $( id ).parentNode.removeChild( $( id ) );
  }

  //内部変数から削除
  delete MEMBER[token];
}
