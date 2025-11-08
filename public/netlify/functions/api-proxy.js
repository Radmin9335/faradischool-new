const axios = require('axios');

exports.handler = async (event) => {
  // گرفتن مسیر اصلی
  const path = event.path.replace('/.netlify/functions/api-proxy', '');
  const backendURL = `http://185.190.39.226:8000/api${path}`;
  
  console.log('🔁 Proxying:', event.path, '→', backendURL);
  
  try {
    const response = await axios({
      method: event.httpMethod,
      url: backendURL,
      data: event.body,
      headers: {
        'Content-Type': event.headers['content-type'] || 'application/json',
        'Authorization': event.headers['authorization']
      }
    });
    
    return {
      statusCode: response.status,
      body: JSON.stringify(response.data),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ 
        error: error.response?.data || error.message 
      })
    };
  }
};