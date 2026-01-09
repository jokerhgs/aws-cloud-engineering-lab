import { handler } from './deploy/dist/src/lambda.js';

const mockEvent = {
    httpMethod: 'GET',
    path: '/users',
    headers: {},
    body: null,
    isBase64Encoded: false,
    requestContext: {}
};

console.log('Sending mock request to packaged artifact...');
handler(mockEvent, {})
    .then(res => {
        console.log('Response received:');
        console.log(JSON.stringify(res, null, 2));
    })
    .catch(err => {
        console.error('Error:', err);
    });
