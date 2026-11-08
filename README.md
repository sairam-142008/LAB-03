# Lab 3: REST API, Query Parameters, Validation, and Debugging

**Student Name:** P.ABHAYA SATYA SAI RAM
**Registration Number:** 252U1R9114
**Class/Section:** CSE(GEN)-AI-2B
**College:** Aurora Higher Education and Research Academy

**Live Link:** _To be updated after deployment on Render_

---

## Project Overview

A RESTful API built with **Node.js**, **Express.js**, and **SQLite** for managing a books collection. Implements full CRUD operations, query parameters (search, sort, filter, pagination), input validation, proper HTTP status codes, consistent JSON error responses, and debugging exercises.

## Objectives

- Build a clean REST API using nouns for endpoints and HTTP methods for actions.
- Implement search, sorting, filtering, and pagination with query parameters.
- Validate user input and return appropriate HTTP status codes.
- Use parameterized SQL queries to prevent SQL injection.
- Handle asynchronous database operations correctly.
- Practise debugging common Node.js and SQLite errors.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| SQLite | Database |
| sqlite3 (npm) | SQLite driver for Node.js |
| Postman | API testing |
| Git & GitHub | Version control |
| Render | Deployment |

## Project Structure

```
BDF_Lab_03/
│
├── index.js              # Main Express server with all routes
├── package.json          # Project metadata and dependencies
├── package-lock.json     # Dependency lock file
├── books.db              # SQLite database (auto-created)
├── README.md             # This file
├── test_runner.js        # Automated test runner
├── .gitignore            # Files excluded from Git
└── screenshots/          # Postman test evidence
    ├── 01_get_all_books.png
    ├── 02_get_book_by_id.png
    ├── 03_search_harry.png
    ├── 04_sort_price_asc.png
    ├── 05_sort_price_desc.png
    ├── 06_pagination.png
    ├── 07_price_filter.png
    ├── 08_combined_query.png
    ├── 09_post_create.png
    ├── 10_put_update.png
    ├── 11_delete.png
    ├── 12_missing_title.png
    ├── 13_non_numeric_price.png
    ├── 14_not_found_404.png
    └── 15_invalid_order_by.png
```

## Database Schema

**Table name:** `book`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `title` | TEXT | NOT NULL |
| `author` | TEXT | NOT NULL |
| `price` | REAL | — |
| `pages` | INTEGER | — |

### Sample Records (10 books)

| ID | Title | Author | Price | Pages |
|----|-------|--------|-------|-------|
| 1 | Harry Potter and the Sorcerer's Stone | J.K. Rowling | 350 | 309 |
| 2 | Harry Potter and the Chamber of Secrets | J.K. Rowling | 380 | 341 |
| 3 | The Great Gatsby | F. Scott Fitzgerald | 199 | 180 |
| 4 | To Kill a Mockingbird | Harper Lee | 299 | 281 |
| 5 | 1984 | George Orwell | 250 | 328 |
| 6 | Pride and Prejudice | Jane Austen | 220 | 432 |
| 7 | The Alchemist | Paulo Coelho | 310 | 197 |
| 8 | Sapiens | Yuval Noah Harari | 450 | 443 |
| 9 | Clean Code | Robert C. Martin | 550 | 464 |
| 10 | The Pragmatic Programmer | Andrew Hunt | 500 | 352 |

The database is initialized automatically when the server starts. Seed records are only inserted when the table is empty, preventing duplicates.

---

## API Endpoints

| Method | Path | Description | Success Status |
|--------|------|-------------|----------------|
| GET | `/books` | Retrieve all books (with query parameters) | 200 |
| GET | `/books/:bookId` | Retrieve a book by its ID | 200 |
| POST | `/books` | Create a new book | 201 |
| PUT | `/books/:bookId` | Update an existing book | 200 |
| DELETE | `/books/:bookId` | Delete a book | 200 |

---

## Query Parameters (for GET /books)

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `search_q` | Partial title match (uses SQL LIKE) | none (no filter) | `?search_q=Harry` |
| `order_by` | Column to sort by (`id`, `title`, `author`, `price`, `pages`) | `id` | `?order_by=price` |
| `order` | Sort direction (`ASC` or `DESC`) | `ASC` | `?order=DESC` |
| `limit` | Maximum number of records to return | `10` | `?limit=5` |
| `offset` | Number of records to skip | `0` | `?offset=5` |
| `min_price` | Minimum price filter | none | `?min_price=200` |
| `max_price` | Maximum price filter | none | `?max_price=400` |

All parameters can be combined:

```
GET /books?search_q=Harry&order_by=price&order=ASC&limit=5&offset=0&min_price=300&max_price=500
```

---

## Request and Response Examples

### GET /books — Retrieve all books

**Request:**
```
GET http://localhost:3000/books
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Harry Potter and the Sorcerer's Stone",
    "author": "J.K. Rowling",
    "price": 350,
    "pages": 309
  },
  ...
]
```

### GET /books/:bookId — Retrieve a book by ID

**Request:**
```
GET http://localhost:3000/books/1
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Harry Potter and the Sorcerer's Stone",
  "author": "J.K. Rowling",
  "price": 350,
  "pages": 309
}
```

### POST /books — Create a new book

**Request:**
```
POST http://localhost:3000/books
Content-Type: application/json

{
  "title": "Atomic Habits",
  "author": "James Clear",
  "price": 599,
  "pages": 320
}
```

**Response (201 Created):**
```json
{
  "id": 11,
  "title": "Atomic Habits",
  "author": "James Clear",
  "price": 599,
  "pages": 320
}
```

### PUT /books/:bookId — Update a book

**Request:**
```
PUT http://localhost:3000/books/11
Content-Type: application/json

{
  "title": "Atomic Habits - Updated",
  "author": "James Clear",
  "price": 650,
  "pages": 350
}
```

**Response (200 OK):**
```json
{
  "id": 11,
  "title": "Atomic Habits - Updated",
  "author": "James Clear",
  "price": 650,
  "pages": 350
}
```

### DELETE /books/:bookId — Delete a book

**Request:**
```
DELETE http://localhost:3000/books/11
```

**Response (200 OK):**
```json
{
  "message": "Book with ID 11 deleted successfully."
}
```

### Error: Book not found (404)

```json
{
  "message": "Book with ID 999 not found."
}
```

### Error: Missing title (400)

```json
{
  "message": "Title is required."
}
```

### Error: Non-numeric price (400)

```json
{
  "message": "Price must be a valid number."
}
```

---

## Validation Rules

| Field | Rule | HTTP Status | Error Message |
|-------|------|-------------|---------------|
| `title` | Required, non-empty | 400 | `"Title is required."` |
| `author` | Required, non-empty | 400 | `"Author is required."` |
| `price` | Must be a valid number | 400 | `"Price must be a valid number."` |
| `pages` | Must be a positive integer | 400 | `"Pages must be a valid positive integer."` |
| `bookId` (path) | Must be a positive integer | 400 | `"Book ID must be a valid positive integer."` |
| `order_by` | Must be an allowed column | 400 | `"Invalid order_by value."` |
| `order` | Must be ASC or DESC | 400 | `"Invalid order value. Use ASC or DESC."` |
| `limit` | Must be a positive integer | 400 | `"Limit must be a positive integer."` |
| `offset` | Must be a non-negative integer | 400 | `"Offset must be a non-negative integer."` |
| `min_price` > `max_price` | min must not exceed max | 400 | `"min_price must not exceed max_price."` |

---

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (new book created) |
| 400 | Bad Request | Invalid input or query parameters |
| 404 | Not Found | Book with the given ID does not exist |
| 500 | Internal Server Error | Unexpected server errors |

---

## How to Install and Run

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Postman](https://www.postman.com/) (for API testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/BDF_Lab_03.git

# Navigate to the project folder
cd BDF_Lab_03

# Install dependencies
npm install
```

### Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`.

Environment variable:
- `PORT` — Port number (default: `3000`)

### Run Automated Tests

In a separate terminal (while the server is running):

```bash
npm test
```

This runs `test_runner.js` which tests all 20 test scenarios (63 assertions) covering CRUD, query parameters, validation, and error handling.

---

## Postman Testing

### Test Cases

| # | Method | URL | Expected Status | Description |
|---|--------|-----|-----------------|-------------|
| 1 | GET | `/books` | 200 | Get all books |
| 2 | GET | `/books/1` | 200 | Get book by ID |
| 3 | GET | `/books?search_q=Harry` | 200 | Search books by title |
| 4 | GET | `/books?order_by=price&order=ASC` | 200 | Sort by price ascending |
| 5 | GET | `/books?order_by=price&order=DESC` | 200 | Sort by price descending |
| 6 | GET | `/books?limit=5&offset=5` | 200 | Pagination |
| 7 | GET | `/books?min_price=200&max_price=400` | 200 | Price range filter |
| 8 | GET | `/books?search_q=Harry&order_by=price&order=ASC&limit=5&offset=0&min_price=300&max_price=500` | 200 | Combined query |
| 9 | POST | `/books` | 201 | Create a new book |
| 10 | PUT | `/books/{id}` | 200 | Update a book |
| 11 | DELETE | `/books/{id}` | 200 | Delete a book |
| 12 | POST | `/books` (missing title) | 400 | Validation error |
| 13 | POST | `/books` (non-numeric price) | 400 | Validation error |
| 14 | GET | `/books/999` | 404 | Book not found |
| 15 | GET | `/books?order_by=invalid` | 400 | Invalid query parameter |

> **Note:** For tests 10 and 11, use the actual book ID returned by test 9 (POST).

---

## Debugging Exercises

### Exercise 1: EADDRINUSE — Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Why it occurs:**
Another process is already using port 3000. This happens when you start the server twice without stopping the first instance, or another application is using the same port.

**How to identify:**
- The error message clearly states `EADDRINUSE` and shows the port number.
- On Windows: `netstat -ano | findstr :3000`
- On Linux/macOS: `lsof -i :3000`

**Solution:**
1. Stop the other process using the port.
2. On Windows: `taskkill /PID <PID> /F`
3. Or change the port by setting the `PORT` environment variable:
   ```bash
   PORT=4000 npm start
   ```

---

### Exercise 2: Wrong Import Path — Module Not Found

**Error:**
```
Error: Cannot find module './databse'
```

**Why it occurs:**
A typo in the `require()` path or the file does not exist at the specified location. Node.js cannot locate the module.

**How to identify:**
- The error shows `MODULE_NOT_FOUND` with the exact path that failed.
- Check the spelling of the file name and path.

**Solution:**
- Correct the file path in the `require()` statement.
- Verify the file exists:
  ```javascript
  // Wrong
  const db = require("./databse");

  // Correct
  const db = require("./database");
  ```

---

### Exercise 3: Table-Name Typo — No Such Table

**Error:**
```
SQLITE_ERROR: no such table: books
```

**Why it occurs:**
The SQL query references a table name that does not exist in the database. This is commonly caused by a typo — for example, using `books` instead of `book`.

**How to identify:**
- The error message says `no such table:` followed by the incorrect name.
- Compare the table name in the SQL query with the one in the CREATE TABLE statement.

**Solution:**
- Use the correct table name in all SQL queries:
  ```sql
  -- Wrong
  SELECT * FROM books;

  -- Correct
  SELECT * FROM book;
  ```

---

### Exercise 4: Missing Await — Incomplete Results

**Error:**
The API returns `undefined`, an empty response, or a `Promise { <pending> }` object instead of actual data.

**Why it occurs:**
When using an asynchronous function (like a database query), failing to use `await` causes the code to continue executing before the operation completes. The variable holds a pending Promise instead of the resolved data.

**How to identify:**
- The response contains `undefined`, `{}`, or `[object Promise]`.
- No database error occurs, but the data is missing.
- Check if every `async` function call uses `await`.

**Solution:**
```javascript
// Wrong — missing await
app.get("/books", async (req, res) => {
  const books = dbAll("SELECT * FROM book");
  res.json(books); // Returns Promise object, not data
});

// Correct — with await
app.get("/books", async (req, res) => {
  const books = await dbAll("SELECT * FROM book");
  res.json(books); // Returns actual book data
});
```

---

## Deployment

### Render Deployment

The project is prepared for deployment on [Render](https://render.com/).

**Configuration:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- The server binds to `0.0.0.0` and reads `PORT` from the environment variable.

**Important Note on SQLite + Free Hosting:**
Render's free tier uses **ephemeral storage**. This means:
- The SQLite database file (`books.db`) is created fresh on each deploy or restart.
- Data written during the session is **not permanently persisted**.
- The seed data (10 books) is automatically re-inserted on each start.
- For permanent data persistence, a persistent disk (paid) or an external database (e.g., PostgreSQL) would be needed.

**Deployed URL:** _To be updated after deployment_

---

## Postman Testing Evidence (Screenshots)

### 1. GET All Books
![GET All Books](screenshots/01_get_all_books.png)

### 2. GET Book by ID
![GET Book by ID](screenshots/02_get_book_by_id.png)

### 3. Search Books (Harry)
![Search Harry](screenshots/03_search_harry.png)

### 4. Sort by Price (ASC)
![Sort Price ASC](screenshots/04_sort_price_asc.png)

### 5. Sort by Price (DESC)
![Sort Price DESC](screenshots/05_sort_price_desc.png)

### 6. Pagination
![Pagination](screenshots/06_pagination.png)

### 7. Price Range Filter
![Price Filter](screenshots/07_price_filter.png)

### 8. Combined Query Parameters
![Combined Query](screenshots/08_combined_query.png)

### 9. Create Book (POST)
![POST Create](screenshots/09_post_create.png)

### 10. Update Book (PUT)
![PUT Update](screenshots/10_put_update.png)

### 11. Delete Book (DELETE)
![DELETE](screenshots/11_delete.png)

### 12. Missing Title (Validation Error)
![Missing Title](screenshots/12_missing_title.png)

### 13. Non-Numeric Price (Validation Error)
![Non-Numeric Price](screenshots/13_non_numeric_price.png)

### 14. Book Not Found (404)
![Not Found 404](screenshots/14_not_found_404.png)

### 15. Invalid order_by (Validation Error)
![Invalid order_by](screenshots/15_invalid_order_by.png)

---

## Notes: Problems Faced and How I Solved Them

- **Express v5 async error handling:** Express 5 handles async errors in route handlers natively, but wrapping database calls in try-catch ensures clear error responses.
- **SQLite on Render:** Free-tier ephemeral storage means data resets on deploy. Documented this limitation and ensured auto-seeding handles it gracefully.
- **Query parameter validation:** Ensured `order_by` is validated against an allowlist to prevent SQL injection, since column names cannot be parameterized in SQL.

---

## Viva Preparation

**Q: Query parameter vs path parameter?**
A: Path parameters identify a specific resource (e.g., `/books/1` where `1` is the book ID). Query parameters filter, sort, or modify the response (e.g., `/books?search_q=Harry`).

**Q: What does stateless mean?**
A: A stateless server treats each request independently. It does not remember previous requests from the same client. All information needed to process a request must be included in the request itself.

**Q: Which status code for bad input vs a missing record?**
A: 400 Bad Request for invalid input (e.g., missing required fields, wrong data types). 404 Not Found when the requested resource does not exist (e.g., a book ID that is not in the database).

