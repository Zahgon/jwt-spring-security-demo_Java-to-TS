# Differential harness

The ported Jest suite is a translation of the original JUnit suite, so it inherits the
original's blind spots: it asserts status codes and a lenient subset of each JSON body. Running
it green says the port satisfies the same assertions — not that it behaves the same.

This harness closes that gap. It drives the same 29 requests at both implementations, normalises
the parts that cannot match by construction (timestamps, JWT signatures, `Date` headers,
transport framing) and diffs the results.

It found four defects that the ported test suite passed straight over:

1. `Vary` headers were emitted on every `/api/**` response; the original only emits them for
   requests that actually carry an `Origin`.
2. Validation errors for a body missing both fields were reported in the wrong order.
3. An authenticated request to an unknown path returned Express's HTML 404 page instead of the
   framework's JSON error body.
4. The CORS preflight returned 404. `web.ignoring()` excludes `OPTIONS` from the *security*
   chain, but `CorsFilter` is a servlet-chain bean and still runs — so the filter had to move
   out of the secured router.

## Running it

Start the Java baseline on port 8099 and the port on 8098, then:

```bash
./probe.sh out
sed -E -f normalise.sed out/java.txt > out/java.norm.txt
sed -E -f normalise.sed out/ts.txt   > out/ts.norm.txt
diff -u out/java.norm.txt out/ts.norm.txt
```

`baseline-java.txt` is the captured baseline output, so the port can be checked without a JVM:

```bash
diff -u baseline-java.txt out/ts.norm.txt
```

## Known-acceptable differences

- **`Authorization` response-header position.** Both emit it with the same value; Spring writes
  the security headers at commit time, so it lands earlier there. Header order is not
  semantically significant.
- **Ordering of multiple validation errors.** Bean Validation hands Spring an unordered
  `Set<ConstraintViolation>`, and the original was observed alternating between `password`-first
  and `username`-first across consecutive identical requests. The port is deterministic
  (`password` first), which is one of the orders the original produces.
