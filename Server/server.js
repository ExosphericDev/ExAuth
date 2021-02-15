var express = require('express')
var App = express()

var fs = require('fs')
var Directory = `${__dirname}/Routes`

fs.readdir(Directory, function(Err, Files){
    if(Err) throw(Err);

    Files.forEach(FileName=>{
        require(`${Directory}/${FileName}`)(App)
    })
})


App.get('/', function(Request, Response) {
    Response.send()
})

App.get('/active', function(Request, Response){ // If it isn't active then there will probably be a 404 error.
    Response.send("active")
})

var Port = 3000
App.listen(Port, ()=>{
    console.log(`Listening on PORT: ${Port}`)
})