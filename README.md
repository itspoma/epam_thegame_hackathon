### Supar dirty prototype game

```
npm install
bower install
node app/server.js
```

To run requirejs optimizer:
```
cd app
build/build.sh
```
and then change
`express.static(__dirname + '/app')` to `express.static(__dirname + '/dist')`

default port - `3000` 
