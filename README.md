Ansible Dyninv API UI
=====================

## Alpha state
This project is still in Alpha status, use at your own risk. Pull requests are more then welcome.

## Usage
Simply do a checkout to a webserver that can host static files, rename `config.js.dist` to `config.js` and modify to your needs.
This UI expects the backend from [Ansible Dyninv API](https://github.com/productsupcom/ansible-dyninv-api)


### Minify
Production output
```
$ uglifyjs -c --mangle --mangle-props -o test.js --stats  -- js/app.js js/app/*
```
