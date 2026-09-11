/^Date: /d
/^Connection: /d
/^Keep-Alive: /d
/^Transfer-Encoding: /d
/^Content-Length: /d
s|^HTTP/1.1 ([0-9]+).*|HTTP/1.1 \1|
s|^Content-Type: application/json[;,] ?charset=[uU][tT][fF]-8|Content-Type: application/json;charset=UTF-8|
