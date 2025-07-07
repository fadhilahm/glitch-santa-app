const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.use(express.static('public'));

app.get('/', (request: any, response: any) => {
  response.sendFile(path.join(__dirname, '/views/index.html'));
});

const listener = app.listen(process.env.PORT || 3000, function () {
  const address = listener.address();
  if (address && typeof address === 'object') {
    console.log('Your app is listening on port ' + address.port);
  }
});

module.exports = app; 