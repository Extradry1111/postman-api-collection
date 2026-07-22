/**
 * Minimal mock of automationexercise.com's API, used ONLY to validate that
 * the Postman collection's mechanics (variable chaining across requests,
 * pre-request scripts, test assertions) actually work end-to-end, in an
 * environment with no outbound network access to the real target.
 *
 * This is NOT part of the portfolio deliverable itself — see README.md for
 * why it exists and how to run the real collection against the live API.
 */
const http = require('http');
const { URL } = require('url');

const users = new Map(); // email -> user record

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function parseFormBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      const params = new URLSearchParams(data);
      resolve(Object.fromEntries(params.entries()));
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '');

  if (path === '/productsList' && req.method === 'GET') {
    return sendJson(res, 200, {
      responseCode: 200,
      products: [
        { id: 1, name: 'Blue Top', price: 'Rs. 500', brand: 'Polo', category: { category: 'Tops' } },
        { id: 2, name: 'Men Tshirt', price: 'Rs. 400', brand: 'H&M', category: { category: 'Tshirts' } },
      ],
    });
  }
  if (path === '/productsList') {
    return sendJson(res, 200, { responseCode: 405, message: 'This request method is not supported.' });
  }

  if (path === '/brandsList' && req.method === 'GET') {
    return sendJson(res, 200, { responseCode: 200, brands: [{ id: 1, brand: 'Polo' }, { id: 2, brand: 'H&M' }] });
  }
  if (path === '/brandsList') {
    return sendJson(res, 200, { responseCode: 405, message: 'This request method is not supported.' });
  }

  if (path === '/searchProduct' && req.method === 'POST') {
    const body = await parseFormBody(req);
    if (!body.search_product) {
      return sendJson(res, 200, {
        responseCode: 400,
        message: 'Bad request, search_product parameter is missing in POST request.',
      });
    }
    return sendJson(res, 200, { responseCode: 200, products: [{ id: 1, name: 'Blue Dress', price: 'Rs. 600' }] });
  }

  if (path === '/verifyLogin' && req.method === 'POST') {
    const body = await parseFormBody(req);
    if (!body.email || !body.password) {
      return sendJson(res, 200, {
        responseCode: 400,
        message: 'Bad request, email or password parameter is missing in POST request.',
      });
    }
    const user = users.get(body.email);
    if (!user || user.password !== body.password) {
      return sendJson(res, 200, { responseCode: 404, message: 'User not found!' });
    }
    return sendJson(res, 200, { responseCode: 200, message: 'User exists!' });
  }
  if (path === '/verifyLogin') {
    return sendJson(res, 200, { responseCode: 405, message: 'This request method is not supported.' });
  }

  if (path === '/createAccount' && req.method === 'POST') {
    const body = await parseFormBody(req);
    users.set(body.email, body);
    return sendJson(res, 200, { responseCode: 201, message: 'User created!' });
  }

  if (path === '/getUserDetailByEmail' && req.method === 'GET') {
    const email = url.searchParams.get('email');
    const user = users.get(email);
    if (!user) return sendJson(res, 200, { responseCode: 404, message: 'Account not found with this email' });
    return sendJson(res, 200, { responseCode: 200, user });
  }

  if (path === '/updateAccount' && req.method === 'PUT') {
    const body = await parseFormBody(req);
    if (!users.has(body.email)) {
      return sendJson(res, 200, { responseCode: 404, message: 'Account not found!' });
    }
    users.set(body.email, { ...users.get(body.email), ...body });
    return sendJson(res, 200, { responseCode: 200, message: 'User updated!' });
  }

  if (path === '/deleteAccount' && req.method === 'DELETE') {
    const body = await parseFormBody(req);
    users.delete(body.email);
    return sendJson(res, 200, { responseCode: 200, message: 'Account deleted!' });
  }

  sendJson(res, 404, { responseCode: 404, message: 'Not found in mock server' });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Mock API server listening on :${PORT}`));
