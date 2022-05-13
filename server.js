const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const headers = require('./headers');
const handleSuccess = require('./handleSuccess');
const handleError = require('./handleError');
const Post = require('./model/post');

// use dotenv
dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace('<password>', process.env.DATABASE_PASSWORD);

// mongoDB 連線
mongoose
  .connect(db)
  .then(() => {
    console.log('連線成功');
  })
  .catch((err) => {
    console.log(err);
  });

// 判斷發出的 request 內容資訊
const requestListener = async (req, res) => {
  // 接收 request 封包
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    'Content-Type': 'application/json',
  };

  // GET ALL
  if (req.url === '/posts' && req.method === 'GET') {
    const posts = await Post.find();
    handleSuccess(res, posts);
    // DELETE ALL
  } else if (req.url === '/posts' && req.method === 'DELETE') {
    const posts = await Post.deleteMany();
    handleSuccess(res, posts);
    // DELETE ONE
  } else if (req.url.startsWith('/posts/') && req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    const posts = await Post.findByIdAndDelete(id);
    handleSuccess(res, posts);
    // POST
  } else if (req.url === '/posts' && req.method === 'POST') {
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const newPost = await Post.create({
          name: data.name,
          tags: data.tags,
          type: data.type,
          content: data.content,
        });
        handleSuccess(res, newPost);
      } catch (err) {
        handleError(res, err);
      }
    });
  } else if (req.url.startsWith('/posts/') && req.method === 'PATCH') {
    req.on('end', async () => {
      try {
        const id = req.url.split('/').pop();
        const data = JSON.parse(body);
        const patchPost = await Post.findByIdAndUpdate(id, {
          name: data.name,
          tags: data.tags,
          type: data.type,
          content: data.content,
        });
        handleSuccess(res, patchPost);
      } catch (err) {
        handleError(res, err);
      }
    });
  } else if (req.method === 'OPTIONS') {
    // 跨網址
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(
      JSON.stringify({
        status: 'false',
        message: '無此網頁',
      })
    );
    res.end();
  }
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT);
