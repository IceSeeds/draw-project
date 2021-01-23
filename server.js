const crypto = require( "crypto" );
const app    = require( "express" )();
const http   = require( "http" ).createServer( app );
const io     = require( "socket.io" )( http );

//HTML, js などのフォルダ
const DOCUMENT_ROOT = __dirname + "/public";

//トークンを作成する際の秘密鍵
const SECRET_TOKEN ="abfesjk384532kljf39w";

/*                 グローバル変数
-----------------------------------------------------*/
//参加者一覧
const MEMBER = {};
/*
{
  "socket.id": {
      token: "abcd",
      name; "test1",
      count: 1
  },
  "socket.id": {
      token: "efgh",
      name: "bar",
      count:2
  }
}
*/
//チャット延べ参加者数
let MEMBER_COUNT = 1;


/*                  HTPPサーバ ( express )
-----------------------------------------------------*/
// "/"にアクセスがあったら、index.htmlを返す
app.get( "/", ( req, res ) => {
  res.sendFile( DOCUMENT_ROOT + "/index.html" );
} );
app.get( "/:file", ( req, res ) => {
  res.sendFile( DOCUMENT_ROOT + "/" + req.params.file );
} );

// ユーザが接続
io.on( "connection", ( socket ) => {
  console.log( "ユーザが接続しました。" );

  // login
  ( () => {
    const token = makeToken( socket.id );

    //ユーザーリストに追加
    MEMBER[socket.id] = {
      token: token,
      name: null,
      count: MEMBER_COUNT
    };
    MEMBER_COUNT++;

    //本人にトークンを送信
    io.to( socket.id ).emit( "token", {token: token} );
  } )();

  //join
  socket.on( "join", ( data ) => {
    //トークンが正しければ
    if( authToken( socket.id, data.token ) )
    {
      //入室ok + 現在の入室者一覧
      const memberlist = getMemberList();
      io.to( socket.id ).emit( "join-result", {status: true, list: memberlist} );

      //メンバー一覧に追加
      MEMBER[socket.id].name = data.name;

      //入室通知
      io.to( socket.id ).emit( "member-join", data );
      socket.broadcast.emit( "member-join", {
        name: data.name,
        token:MEMBER[socket.id].count
      } );
    }else {
      //本人にNGを通知
      io.to( socket.id ).emit( "join-result", {status: false} );
    }
  } );

  //全員にメッセを発信
  socket.on( "post", ( data ) => {
    //トークンが正しければ
    if( authToken( socket.id, data.token ) )
    {
      //本人に通知
      io.to( socket.id ).emit( "member-post", data );

      //本人以外に通知
      socket.broadcast.emit( "member-post", {
        text: data.text,
        token: MEMBER[socket.id].count
      });
    }
  } );

  //退出
  socket.on( "quit", ( data ) => {
    //トークンが正しければ
    if( authToken( socket.id, data.token ) )
    {
      //本人通知
      io.to( socket.id ).emit( "quit-result", { status: true });

      //本人以外に通知
      socket.broadcast.emit( "member-quit", { token: MEMBER[socket.id].count });

      //削除
      delete MEMBER[socket.id];
    }else {
      //トークンが誤っていた場合
      //本人以外に通知
      io.to( socket.id ).emit( "quit-result", {status: false});
    }
  } );

} );

//3000番でサーバを起動する
http.listen( 3000, () => {
  console.log( "listening on *: 3000" );
});

/**
*トークンを作成する
*
* @param  {string} id - socket.id
* @return {string}
*/
function makeToken( id )
{
  const str = SECRET_TOKEN + id;
  return crypto.createHash( "sha1" ).update( str ).digest( "hex" );
}

/**
 * 本人からの通信か確認する
 *
 * @param { string } socketid
 * @param { string } token
 * @return { bool }
*/
function authToken( socketid, token )
{
  return ( ( socketid in MEMBER ) && ( token === MEMBER[socketid].token ) );
}

/**
* メンバー一覧を作成する
*
*@return { array }
*
*/
function getMemberList()
{
  const list = [];
  for( let key in MEMBER )
  {
    const cur = MEMBER[key];
    if( cur.name !== null )
    {
      list.push( {
        token: cur.count,
        name: cur.name
      } );
    }
  }

  return list;
}
