# HeroStats API

[![Build Status](https://travis-ci.org/JankGaming/herostats-api.svg?branch=master)](https://travis-ci.org/JankGaming/herostats-api)

This repository holds the app that serves herostats data at http://api.herostats.io

We will be updating this repository in the coming months with v2 of the HeroStats API. Version 1 will remain fully functional, and v2 will be namespaced, no worries.

## config.json

To configure HeroStats API, add a `config.json` to the root directory with the following structure:

```javascript
{
  "host": "HOSTNAME [probably localhost]",
  "mysqlUser": "YOUR_MYSQL_USERNAME",
  "mysqlPassword": "YOUR_MYSQL_PASSWORD",
  "mysqlDatabase": "DATABASE_NAME",
  "mysqlTable": "DEFAULT_TABLE",
  "patchName": "DEFAULT_PATCHNAME",
  "port": PORT_TO_RUN_ON
}
```
