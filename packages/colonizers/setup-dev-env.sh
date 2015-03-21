git clone git@github.com:colonizers/colonizers-core.git core
cd core
npm install
npm link
cd ..

git clone git@github.com:colonizers/colonizers-client-tilesets.git tilesets
cd tilesets
npm install
npm link
cd ..

git clone git@github.com:colonizers/colonizers-client.git client
cd client
npm link colonizers-core
npm install
npm link
cd ..

rm -rf node_modules
npm link colonizers-client
npm link colonizers-client-tilesets
npm link colonizers-core
npm install
