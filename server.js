const crypto = require( "crypto" );
const app    = require( "express" )();
const http   = require( "http" ).createServer( app );
const io     = require( "socket.io" )( http );

//HTML, js などのフォルダ
const DOCUMENT_ROOT = __dirname + "/public";

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

    //本人にトークンを送信
    io.to( socket.id ).emit( "token", {token: token} );
  } )();

  socket.on( "post", ( msg ) => {
    io.emit( "member-post", msg );
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
  const str = "fjesklfjsdfkfes" + id;
  return crypto.createHash( "sha1" ).update( str ).digest( "hex" );
}
