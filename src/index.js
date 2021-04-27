import server from './server';

server.start();

if (process.env.NODE_ENV === 'production') {
  console.log = () => null;
}
