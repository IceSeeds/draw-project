/*
汎用的に利用する関数などを登録していく予定で、
今回はdocument.querySelector()のラッパー関数を置いています。
*/

/**
 * [Wrapper] document.querySelector
 *
 * @param  {string} selector "#foo", ".bar"
 * @return {object}
 */
function $( selector )
{
  return document.querySelector( selector );
}

/*
document.querySelector("#foo").addEventListener("click", ()=>{});

or

$("#foo").addEventListener("click", ()=>{});
*/
