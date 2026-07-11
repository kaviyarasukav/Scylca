const axios = require('axios');

async function test() {
  try {
    const params = new URLSearchParams();
    params.append('client_id', '178c6fc778ccc68e1d6a');
    params.append('scope', 'repo');

    const res = await axios.post('https://github.com/login/device/code', params, {
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('SUCCESS:', res.status, res.data);
  } catch (err) {
    console.log('ERROR STATUS:', err.response ? err.response.status : 'no response');
    console.log('ERROR DATA:', err.response ? err.response.data : err.message);
  }
}

test();
