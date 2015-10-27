var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/res/:id',function(req,res)
{
  res.sendFile(__dirname + '/res/' + req.params.id);
});

var controlstations = io.of('/controlstation');
var clients = io.of('/clients');
var numberOfClients = 0;
var numberOfControlstations = 0;

controlstations.on('connect', function(socket){
  console.log('controlstation connected');
  controlstation.on('auth', function(token){
    if(token == 'AbCdEfG123') {
      numberOfControlstations++;
      socket.join('authenticated');
      clients.emit('controlstationCount', numberOfControlstations);

      socket.on('disconnect', function(){
        numberOfControlstations--;
        clients.emit('controlstationCount', numberOfControlstations);
        console.log('controlstation disconnected');
      });

    }
  });
});

clients.on('connect', function(socket){
  numberOfClients++;
  console.log('client connected');
  socket.join('authenticated');
  socket.emit('controlstationCount', numberOfControlstations);

  var currentDevices = [
      new Device('Schemerlamp', DEVICE_TYPE_LIGHT),
      new Device('Nachtlampje', DEVICE_TYPE_LIGHT),
      new Device('Tuinlamp', DEVICE_TYPE_LIGHT),
      new Device('Keuken spotjes', DEVICE_TYPE_LIGHT),
      new Device('Plafoniere', DEVICE_TYPE_LIGHT),
      new Device('Bureaulampje', DEVICE_TYPE_LIGHT),
  ];
  socket.emit('devices', currentDevices);

  socket.on('disconnect', function(){
    numberOfClients--;
    console.log('client disconnected');
  });

});


http.listen(3000, function(){
  console.log('listening on *:3000');
});


const DEVICE_TYPE_LIGHT = 'light-on-off';
const DEVICE_TYPE_DIMMER = 'light-dimmer';
function Device(name, type) {
  this.name = name;
  this.type = type;
}
