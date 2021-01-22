const app  = require( "express" )();
const http = require( "http" ).createServer( app );
const io   = require( "socket.io" )( http );


// "/"にアクセスがあったら、index.htmlを返す
app.get( "/", ( req, res ) => {
  res.sendFile( __dirname + "/index.html" );
} );

// ユーザが接続
io.on( "connection", ( socket ) => {
  console.log( "ユーザが接続しました。" );

  socket.on( "post", ( msg ) => {
    io.emit( "member-post", msg );
  } );
} );

//3000番でサーバを起動する
http.listen( 3000, () => {
  console.log( "listening on *: 3000" );
});
