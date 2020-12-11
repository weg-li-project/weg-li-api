const express = require('express');
const {api} = require("./index");

const app = express();
const port = 3000;

app.use("/api/v1/", api);

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}...`);
});