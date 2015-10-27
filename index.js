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
var users = [{username:"Edwin", password:"wachtwoord123"}];

var deviceIdStart = Math.floor(new Date().getTime() / 1000);
function getDeviceId() {
  deviceIdStart++;
  return deviceIdStart;
}

var devices = [
      new Device('Schemerlamp', DEVICE_TYPE_DIMMER),
      new Device('Nachtlampje', DEVICE_TYPE_LIGHT),
      new Device('Keuken spotjes', DEVICE_TYPE_LIGHT),
      new Device('Plafoniere', DEVICE_TYPE_LIGHT),
      new Device('Bureaulampje', DEVICE_TYPE_LIGHT),
  ];



io.on('connection', function(socket){
  console.log('regular client connected');
  socket.on('message', function(msg) {
    socket.send(msg);
  });
});


controlstations.on('connect', function(socket){
  console.log('controlstation connected');

  socket.on('auth', function(token){
    if(token == 'AbCdEfG123') {
      console.log('controlstation authenticated: '+token);
      socket.join('authenticated');
      numberOfControlstations++;

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
  console.log('client connected');

  socket.on('auth', function(user){
    for (i = 0; i < users.length; i++) { 
      if (user.username == users[i].username && user.password == users[i].password) {
        socket.emit('login-success');
        console.log('client authenticated: '+user.username+' '+user.password);
        socket.join('authenticated');
        numberOfClients++;

        addDevice( new Device('personal lamp for client #'+numberOfClients, DEVICE_TYPE_LIGHT) );
        socket.emit('controlstationCount', numberOfControlstations);
        socket.emit('devices', devices);

        socket.on('device', function(device){
          if (!updateDevice(device)) {
            addDevice(device);
            console.log('Device added:');
            console.log(device);
          } else {
            console.log('Device updated to:');
            console.log(device);
          }
        });

        socket.on('disconnect', function(){
          numberOfClients--;
          console.log('client disconnected');
        });
        return;
      }
    }
    socket.emit('login-fail');
  });

});


function addDevice(device) {
  device.id = getDeviceId();
  devices.push(device);
  broadcastDevices();
}

function updateDevice(device) {
  for (i = 0; i < devices.length; i++) {
    if (device.id == devices[i].id) {
      devices[i] = device;
      broadcastDevices();
      return true;
    }
  }
  return false;
}

function broadcastDevices() {
  clients.to('authenticated').emit('devices', devices);
  controlstations.to('authenticated').emit('devices', devices);
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});


const DEVICE_TYPE_LIGHT = 'light-on-off';
const DEVICE_TYPE_DIMMER = 'light-dimmer';
function Device(name, type) {
  this.id = getDeviceId();
  this.name = name;
  this.type = type;
  switch (type) {
    case DEVICE_TYPE_DIMMER: 
      this.values = [0,0];
    default: 
      this.values = [0];
      break;
  }
}
