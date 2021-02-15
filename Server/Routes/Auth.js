// var Utf8ToArray = require('./Requires/Utf8ToArray.js')

var AuthKeys = { // List of keys, instead of adding them manually in here
                 // you can just add a new route which accepts a secret key
                 // and adds a new key in this array.
    TestKey: true,
    Abc123: true
}


var GateTokens = [
    // Token: Key
]


// Purge GateTokens every 15s
setInterval(function(){
    GateTokens = []
}, 15 * 1000)


// Some crazy mapping

function Utf8ToArray(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        else {
            i++;
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}


module.exports = function(App) {
    App.get("/auth/key/:Key", function(Request, Response) {
        var AuthKey = Request.params.Key
        if(AuthKeys[AuthKey] === true) {
            var AuthToken = new Buffer.from(AuthKey).toString("base64") // I found it the easiest to get the buffer then do toString('base64')
                                                                        // It might be inefficient.

            Response.setHeader('ex-auth-token', AuthToken)

            Response.send();

            GateTokens[AuthToken]=AuthKey

        } else {
            Response.send("Invalid key.")
        }
    })

    App.get("/gate/:gateId/token/:AuthToken/key/:Key", function(Request, Response) {
        var gateId = Request.params.gateId
        var AuthToken = Request.params.AuthToken
        var AuthKey = Request.params.Key


        if (GateTokens[AuthToken]) {
            var AOB = Utf8ToArray(AuthToken)

            AOB.forEach((Byte, Idx)=>{
                AOB[Idx]=Byte+gateId
            })

            var jAOB = JSON.stringify(AOB)
            var Sum = "";
            AOB.forEach(X=>{
                Sum+=X // Sum of all utf8-bytes.
            })
            Response.setHeader("ex-auth-aob", jAOB)
            Response.setHeader("ex-auth-sum", Sum)
            Response.send();
        } else {
            Response.send("Failed to find GateToken.")
        }
    })
}