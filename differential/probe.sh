#!/bin/bash
# Differential harness: drives identical requests at the Java baseline and the TS port,
# normalises the volatile parts (timestamps, JWT signatures, Date headers) and diffs.
JAVA=http://localhost:8099
TS=http://localhost:8098
OUT_DIR="$1"; mkdir -p "$OUT_DIR"

token() { # base, user, pass
  curl -s -X POST "$1/api/authenticate" -H 'Content-Type: application/json' \
    -d "{\"password\": \"$3\", \"username\": \"$2\"}" | sed -n 's/.*id_token" : "\(.*\)".*/\1/p'
}

normalise() {
  sed -E \
    -e 's/^Date: .*/Date: <DATE>/' \
    -e 's/"timestamp" : "[^"]*"/"timestamp" : "<TS>"/' \
    -e 's/eyJhbGciOiJIUzUxMiJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/<JWT>/g' \
    -e 's/\r$//'
}

run() { # label, base, curl-args...
  local label="$1"; local base="$2"; shift 2
  echo "### $label"
  curl -s -D - -o - "$@" | normalise
  echo
}

for side in java ts; do
  if [ "$side" = java ]; then BASE=$JAVA; else BASE=$TS; fi
  UT=$(token "$BASE" user password)
  AT=$(token "$BASE" admin admin)
  {
    run "AUTH user"        "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "password", "username": "user"}'
    run "AUTH admin"       "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "admin", "username": "admin"}'
    run "AUTH rememberMe"  "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "password", "username": "user", "rememberMe": true}'
    run "AUTH disabled"    "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "password", "username": "disabled"}'
    run "AUTH disabled+wrongpw" "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "wrong", "username": "disabled"}'
    run "AUTH wrongpw"     "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "wrong", "username": "user"}'
    run "AUTH nouser"      "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "password", "username": "not_existing"}'
    run "AUTH uppercase"   "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "admin", "username": "ADMIN"}'
    run "AUTH by email"    "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "password", "username": "enabled@user.com"}'
    run "AUTH by email upper" "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "password", "username": "ENABLED@USER.COM"}'
    run "AUTH short pw"    "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "ab", "username": "user"}'
    run "AUTH missing username" "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{"password": "password"}'
    run "AUTH empty body"  "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d '{}'
    run "AUTH long username" "$BASE" -X POST "$BASE/api/authenticate" -H 'Content-Type: application/json' -d "{\"password\": \"password\", \"username\": \"$(printf 'a%.0s' $(seq 1 51))\"}"

    run "USER w/ user tok" "$BASE" "$BASE/api/user" -H "Authorization: Bearer $UT"
    run "USER w/ admin tok" "$BASE" "$BASE/api/user" -H "Authorization: Bearer $AT"
    run "USER anon"        "$BASE" "$BASE/api/user"
    run "USER bad tok"     "$BASE" "$BASE/api/user" -H "Authorization: Bearer garbage.token.here"
    run "USER no bearer"   "$BASE" "$BASE/api/user" -H "Authorization: $UT"

    run "PERSON user"      "$BASE" "$BASE/api/person" -H "Authorization: Bearer $UT"
    run "PERSON admin"     "$BASE" "$BASE/api/person" -H "Authorization: Bearer $AT"
    run "PERSON anon"      "$BASE" "$BASE/api/person"

    run "HIDDEN admin"     "$BASE" "$BASE/api/hiddenmessage" -H "Authorization: Bearer $AT"
    run "HIDDEN user"      "$BASE" "$BASE/api/hiddenmessage" -H "Authorization: Bearer $UT"
    run "HIDDEN anon"      "$BASE" "$BASE/api/hiddenmessage"

    run "UNKNOWN api path" "$BASE" "$BASE/api/nope"
    run "UNKNOWN api path w/ tok" "$BASE" "$BASE/api/nope" -H "Authorization: Bearer $UT"
    run "CORS preflight"   "$BASE" -X OPTIONS "$BASE/api/person" -H 'Origin: http://example.com' -H 'Access-Control-Request-Method: GET'
    run "CORS actual"      "$BASE" "$BASE/api/person" -H 'Origin: http://example.com' -H "Authorization: Bearer $UT"
  } > "$OUT_DIR/$side.txt"
done

diff -u "$OUT_DIR/java.txt" "$OUT_DIR/ts.txt" > "$OUT_DIR/diff.txt"
echo "diff lines: $(wc -l < "$OUT_DIR/diff.txt")"
