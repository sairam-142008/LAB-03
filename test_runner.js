/**
 * test_runner.js
 * Automated test runner for BDF Lab 3 — Books REST API
 *
 * Usage:
 *   1. Start the server:  npm start
 *   2. In another terminal: npm test   (or node test_runner.js)
 *
 * The server must be running on http://localhost:3000 before running tests.
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";

// ─── HTTP HELPER ────────────────────────────────────────────────────────────

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {},
    };

    if (body) {
      const jsonBody = JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(jsonBody);
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed, raw: data });
      });
    });

    req.on("error", (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── TEST FRAMEWORK ─────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    const msg = `  ❌ FAIL: ${testName}${detail ? " — " + detail : ""}`;
    console.log(msg);
    failures.push(msg);
  }
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("=".repeat(60));
  console.log("  BDF Lab 3 — Automated Test Runner");
  console.log("=".repeat(60));
  console.log();

  let createdBookId = null; // Will be set by POST test

  // ── 1. GET /books — Retrieve all books ──────────────────────────────────
  console.log("📚 1. GET /books — All books");
  try {
    const res = await request("GET", "/books");
    assert(res.status === 200, "Status is 200");
    assert(Array.isArray(res.body), "Response is an array");
    assert(res.body.length >= 10, "At least 10 books returned", `Got ${res.body.length}`);
  } catch (e) {
    assert(false, "GET /books request failed", e.message);
  }
  console.log();

  // ── 2. GET /books/:bookId — Get book by ID ─────────────────────────────
  console.log("📖 2. GET /books/1 — Book by ID");
  try {
    const res = await request("GET", "/books/1");
    assert(res.status === 200, "Status is 200");
    assert(res.body.id === 1, "Book ID is 1");
    assert(typeof res.body.title === "string", "Title is a string");
    assert(typeof res.body.author === "string", "Author is a string");
    assert(typeof res.body.price === "number", "Price is a number");
    assert(typeof res.body.pages === "number", "Pages is a number");
  } catch (e) {
    assert(false, "GET /books/1 request failed", e.message);
  }
  console.log();

  // ── 3. Search — search_q=Harry ──────────────────────────────────────────
  console.log("🔍 3. GET /books?search_q=Harry — Search");
  try {
    const res = await request("GET", "/books?search_q=Harry");
    assert(res.status === 200, "Status is 200");
    assert(Array.isArray(res.body), "Response is an array");
    assert(res.body.length >= 1, "At least 1 Harry Potter book found", `Got ${res.body.length}`);
    const allMatch = res.body.every((b) =>
      b.title.toLowerCase().includes("harry")
    );
    assert(allMatch, "All results contain 'Harry' in title");
  } catch (e) {
    assert(false, "Search request failed", e.message);
  }
  console.log();

  // ── 4. Sorting ASC ─────────────────────────────────────────────────────
  console.log("⬆️  4. GET /books?order_by=price&order=ASC — Sort ASC");
  try {
    const res = await request("GET", "/books?order_by=price&order=ASC");
    assert(res.status === 200, "Status is 200");
    assert(Array.isArray(res.body), "Response is an array");
    let sorted = true;
    for (let i = 1; i < res.body.length; i++) {
      if (res.body[i].price < res.body[i - 1].price) {
        sorted = false;
        break;
      }
    }
    assert(sorted, "Books are sorted by price in ASC order");
  } catch (e) {
    assert(false, "Sort ASC request failed", e.message);
  }
  console.log();

  // ── 5. Sorting DESC ────────────────────────────────────────────────────
  console.log("⬇️  5. GET /books?order_by=price&order=DESC — Sort DESC");
  try {
    const res = await request("GET", "/books?order_by=price&order=DESC");
    assert(res.status === 200, "Status is 200");
    assert(Array.isArray(res.body), "Response is an array");
    let sorted = true;
    for (let i = 1; i < res.body.length; i++) {
      if (res.body[i].price > res.body[i - 1].price) {
        sorted = false;
        break;
      }
    }
    assert(sorted, "Books are sorted by price in DESC order");
  } catch (e) {
    assert(false, "Sort DESC request failed", e.message);
  }
  console.log();

  // ── 6. Pagination ─────────────────────────────────────────────────────
  console.log("📄 6. GET /books?limit=5&offset=5 — Pagination");
  try {
    const res = await request("GET", "/books?limit=5&offset=5");
    assert(res.status === 200, "Status is 200");
    assert(Array.isArray(res.body), "Response is an array");
    assert(res.body.length <= 5, "At most 5 books returned", `Got ${res.body.length}`);

    // First page
    const page1 = await request("GET", "/books?limit=5&offset=0");
    const noOverlap = res.body.every(
      (b) => !page1.body.some((p) => p.id === b.id)
    );
    assert(noOverlap, "Page 2 has no overlap with Page 1");
  } catch (e) {
    assert(false, "Pagination request failed", e.message);
  }
  console.log();

  // ── 7. Price filter ────────────────────────────────────────────────────
  console.log("💰 7. GET /books?min_price=200&max_price=400 — Price filter");
  try {
    const res = await request("GET", "/books?min_price=200&max_price=400");
    assert(res.status === 200, "Status is 200");
    assert(Array.isArray(res.body), "Response is an array");
    const allInRange = res.body.every(
      (b) => b.price >= 200 && b.price <= 400
    );
    assert(allInRange, "All books are within price range 200–400");
  } catch (e) {
    assert(false, "Price filter request failed", e.message);
  }
  console.log();

  // ── 8. Combined query parameters ──────────────────────────────────────
  console.log(
    "🔗 8. GET /books?search_q=Harry&order_by=price&order=ASC&limit=5&offset=0&min_price=300&max_price=500 — Combined"
  );
  try {
    const res = await request(
      "GET",
      "/books?search_q=Harry&order_by=price&order=ASC&limit=5&offset=0&min_price=300&max_price=500"
    );
    assert(res.status === 200, "Status is 200");
    assert(Array.isArray(res.body), "Response is an array");
    const allMatch = res.body.every(
      (b) =>
        b.title.toLowerCase().includes("harry") &&
        b.price >= 300 &&
        b.price <= 500
    );
    assert(allMatch, "All results match search + price filter");
    let sorted = true;
    for (let i = 1; i < res.body.length; i++) {
      if (res.body[i].price < res.body[i - 1].price) {
        sorted = false;
        break;
      }
    }
    assert(sorted, "Results are sorted by price ASC");
  } catch (e) {
    assert(false, "Combined query request failed", e.message);
  }
  console.log();

  // ── 9. POST /books — Create a book ────────────────────────────────────
  console.log("➕ 9. POST /books — Create a book");
  try {
    const res = await request("POST", "/books", {
      title: "Atomic Habits",
      author: "James Clear",
      price: 599,
      pages: 320,
    });
    assert(res.status === 201, "Status is 201 Created");
    assert(res.body.title === "Atomic Habits", "Title matches");
    assert(res.body.author === "James Clear", "Author matches");
    assert(res.body.price === 599, "Price matches");
    assert(res.body.pages === 320, "Pages matches");
    assert(typeof res.body.id === "number", "ID is assigned");
    createdBookId = res.body.id;
    console.log(`  ℹ️  Created book ID: ${createdBookId}`);
  } catch (e) {
    assert(false, "POST /books request failed", e.message);
  }
  console.log();

  // ── 10. PUT /books/:bookId — Update a book ───────────────────────────
  console.log(`✏️  10. PUT /books/${createdBookId} — Update a book`);
  try {
    const res = await request("PUT", `/books/${createdBookId}`, {
      title: "Atomic Habits - Updated",
      author: "James Clear",
      price: 650,
      pages: 350,
    });
    assert(res.status === 200, "Status is 200");
    assert(res.body.title === "Atomic Habits - Updated", "Title updated");
    assert(res.body.price === 650, "Price updated");
    assert(res.body.pages === 350, "Pages updated");
  } catch (e) {
    assert(false, "PUT request failed", e.message);
  }
  console.log();

  // ── 11. DELETE /books/:bookId — Delete a book ─────────────────────────
  console.log(`🗑️  11. DELETE /books/${createdBookId} — Delete a book`);
  try {
    const res = await request("DELETE", `/books/${createdBookId}`);
    assert(res.status === 200, "Status is 200");
    assert(
      res.body.message && res.body.message.includes("deleted"),
      "Delete confirmation message received"
    );

    // Verify it's deleted
    const check = await request("GET", `/books/${createdBookId}`);
    assert(check.status === 404, "Deleted book returns 404");
  } catch (e) {
    assert(false, "DELETE request failed", e.message);
  }
  console.log();

  // ── 12. Validation — Missing title ────────────────────────────────────
  console.log("🚫 12. POST /books — Missing title (validation)");
  try {
    const res = await request("POST", "/books", {
      author: "Test Author",
      price: 250,
      pages: 100,
    });
    assert(res.status === 400, "Status is 400 Bad Request");
    assert(
      res.body.message && res.body.message.toLowerCase().includes("title"),
      "Error mentions title",
      `Got: ${res.body.message}`
    );
  } catch (e) {
    assert(false, "Missing title validation failed", e.message);
  }
  console.log();

  // ── 13. Validation — Missing author ───────────────────────────────────
  console.log("🚫 13. POST /books — Missing author (validation)");
  try {
    const res = await request("POST", "/books", {
      title: "Test Book",
      price: 250,
      pages: 100,
    });
    assert(res.status === 400, "Status is 400 Bad Request");
    assert(
      res.body.message && res.body.message.toLowerCase().includes("author"),
      "Error mentions author",
      `Got: ${res.body.message}`
    );
  } catch (e) {
    assert(false, "Missing author validation failed", e.message);
  }
  console.log();

  // ── 14. Validation — Non-numeric price ────────────────────────────────
  console.log('🚫 14. POST /books — Non-numeric price (validation)');
  try {
    const res = await request("POST", "/books", {
      title: "Validation Test Book",
      author: "Test Author",
      price: "abc",
      pages: 100,
    });
    assert(res.status === 400, "Status is 400 Bad Request");
    assert(
      res.body.message && res.body.message.toLowerCase().includes("price"),
      "Error mentions price",
      `Got: ${res.body.message}`
    );
  } catch (e) {
    assert(false, "Non-numeric price validation failed", e.message);
  }
  console.log();

  // ── 15. Validation — Invalid book ID ──────────────────────────────────
  console.log("🚫 15. GET /books/abc — Invalid book ID");
  try {
    const res = await request("GET", "/books/abc");
    assert(res.status === 400, "Status is 400 Bad Request");
    assert(
      res.body.message && res.body.message.toLowerCase().includes("id"),
      "Error mentions ID",
      `Got: ${JSON.stringify(res.body.message)}`
    );
  } catch (e) {
    assert(false, "Invalid book ID test failed", e.message);
  }
  console.log();

  // ── 16. 404 — Book not found ──────────────────────────────────────────
  console.log("🚫 16. GET /books/999 — Book not found");
  try {
    const res = await request("GET", "/books/999");
    assert(res.status === 404, "Status is 404 Not Found");
    assert(
      res.body.message && res.body.message.toLowerCase().includes("not found"),
      "Error says not found"
    );
  } catch (e) {
    assert(false, "Book not found test failed", e.message);
  }
  console.log();

  // ── 17. Validation — Invalid order_by ─────────────────────────────────
  console.log("🚫 17. GET /books?order_by=invalid — Invalid order_by");
  try {
    const res = await request("GET", "/books?order_by=invalid");
    assert(res.status === 400, "Status is 400 Bad Request");
    assert(
      res.body.message && res.body.message.toLowerCase().includes("order_by"),
      "Error mentions order_by",
      `Got: ${res.body.message}`
    );
  } catch (e) {
    assert(false, "Invalid order_by test failed", e.message);
  }
  console.log();

  // ── 18. Validation — Invalid order ────────────────────────────────────
  console.log("🚫 18. GET /books?order=INVALID — Invalid order");
  try {
    const res = await request("GET", "/books?order=INVALID");
    assert(res.status === 400, "Status is 400 Bad Request");
    assert(
      res.body.message && res.body.message.toLowerCase().includes("order"),
      "Error mentions order"
    );
  } catch (e) {
    assert(false, "Invalid order test failed", e.message);
  }
  console.log();

  // ── 19. Validation — Invalid limit and offset ─────────────────────────
  console.log("🚫 19. Invalid limit and offset");
  try {
    let res = await request("GET", "/books?limit=-1");
    assert(res.status === 400, "Negative limit returns 400");

    res = await request("GET", "/books?limit=abc");
    assert(res.status === 400, "Non-numeric limit returns 400");

    res = await request("GET", "/books?offset=-1");
    assert(res.status === 400, "Negative offset returns 400");

    res = await request("GET", "/books?offset=abc");
    assert(res.status === 400, "Non-numeric offset returns 400");
  } catch (e) {
    assert(false, "Invalid limit/offset test failed", e.message);
  }
  console.log();

  // ── 20. Validation — Invalid price range ──────────────────────────────
  console.log("🚫 20. GET /books?min_price=500&max_price=100 — Invalid price range");
  try {
    const res = await request(
      "GET",
      "/books?min_price=500&max_price=100"
    );
    assert(res.status === 400, "Status is 400 Bad Request");
    assert(
      res.body.message &&
        res.body.message.toLowerCase().includes("min_price"),
      "Error mentions min_price",
      `Got: ${res.body.message}`
    );
  } catch (e) {
    assert(false, "Invalid price range test failed", e.message);
  }
  console.log();

  // ─── SUMMARY ──────────────────────────────────────────────────────────
  console.log("=".repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("=".repeat(60));

  if (failures.length > 0) {
    console.log("\n  Failed tests:");
    failures.forEach((f) => console.log(f));
  }

  console.log();
  process.exit(failed > 0 ? 1 : 0);
}

// ─── RUN ────────────────────────────────────────────────────────────────────

runTests().catch((err) => {
  console.error("Test runner crashed:", err.message);
  console.error(
    "Make sure the server is running: npm start"
  );
  process.exit(1);
});

