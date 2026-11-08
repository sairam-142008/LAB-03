const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// ─── DATABASE SETUP ─────────────────────────────────────────────────────────

const dbPath = path.join(__dirname, "books.db");
const db = new sqlite3.Database(dbPath);

// Promise wrappers for sqlite3 callback-based API
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // `this` contains lastID, changes
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// ─── INITIALIZE DATABASE ────────────────────────────────────────────────────

async function initializeDatabase() {
  // Create the book table if it does not exist
  await dbRun(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL,
      pages INTEGER
    )
  `);

  // Check if the table is empty before seeding
  const countRow = await dbGet("SELECT COUNT(*) AS count FROM book");

  if (countRow.count === 0) {
    const seedBooks = [
      ["Harry Potter and the Sorcerer's Stone", "J.K. Rowling", 350, 309],
      ["Harry Potter and the Chamber of Secrets", "J.K. Rowling", 380, 341],
      ["The Great Gatsby", "F. Scott Fitzgerald", 199, 180],
      ["To Kill a Mockingbird", "Harper Lee", 299, 281],
      ["1984", "George Orwell", 250, 328],
      ["Pride and Prejudice", "Jane Austen", 220, 432],
      ["The Alchemist", "Paulo Coelho", 310, 197],
      ["Sapiens", "Yuval Noah Harari", 450, 443],
      ["Clean Code", "Robert C. Martin", 550, 464],
      ["The Pragmatic Programmer", "Andrew Hunt", 500, 352],
    ];

    const insertSQL =
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)";

    for (const book of seedBooks) {
      await dbRun(insertSQL, book);
    }

    console.log("Database seeded with 10 sample books.");
  } else {
    console.log(`Database already has ${countRow.count} book(s). Skipping seed.`);
  }
}

// ─── VALIDATION HELPERS ─────────────────────────────────────────────────────

const ALLOWED_ORDER_BY = ["id", "title", "author", "price", "pages"];
const ALLOWED_ORDER = ["ASC", "DESC"];

function validateBookBody(body, isUpdate = false) {
  const errors = [];

  // For PUT, only validate fields that are provided (partial updates allowed)
  // For POST, title and author are required
  if (!isUpdate || body.title !== undefined) {
    if (
      body.title === undefined ||
      body.title === null ||
      String(body.title).trim() === ""
    ) {
      errors.push("Title is required.");
    }
  }

  if (!isUpdate || body.author !== undefined) {
    if (
      body.author === undefined ||
      body.author === null ||
      String(body.author).trim() === ""
    ) {
      errors.push("Author is required.");
    }
  }

  if (body.price !== undefined && body.price !== null) {
    if (isNaN(Number(body.price)) || body.price === "") {
      errors.push("Price must be a valid number.");
    }
  } else if (!isUpdate) {
    // price is required for POST
    errors.push("Price must be a valid number.");
  }

  if (body.pages !== undefined && body.pages !== null) {
    const pagesNum = Number(body.pages);
    if (!Number.isInteger(pagesNum) || pagesNum <= 0 || body.pages === "") {
      errors.push("Pages must be a valid positive integer.");
    }
  } else if (!isUpdate) {
    // pages is required for POST
    errors.push("Pages must be a valid positive integer.");
  }

  return errors;
}

// ─── ROUTES ─────────────────────────────────────────────────────────────────

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to BDF Lab 3 — Books REST API",
    endpoints: {
      "GET /books": "Retrieve all books (supports query parameters)",
      "GET /books/:bookId": "Retrieve a book by ID",
      "POST /books": "Create a new book",
      "PUT /books/:bookId": "Update an existing book",
      "DELETE /books/:bookId": "Delete a book",
    },
  });
});

// ─── A. GET /books — Retrieve all books with query parameters ───────────────

app.get("/books", async (req, res) => {
  try {
    const { search_q, order_by, order, limit, offset, min_price, max_price } =
      req.query;

    // Validate order_by
    const orderByCol = order_by || "id";
    if (!ALLOWED_ORDER_BY.includes(orderByCol)) {
      return res.status(400).json({
        message: `Invalid order_by value. Allowed values: ${ALLOWED_ORDER_BY.join(", ")}.`,
      });
    }

    // Validate order
    const orderDir = order ? order.toUpperCase() : "ASC";
    if (!ALLOWED_ORDER.includes(orderDir)) {
      return res.status(400).json({
        message: "Invalid order value. Use ASC or DESC.",
      });
    }

    // Validate limit
    let limitVal = 10; // default
    if (limit !== undefined) {
      limitVal = Number(limit);
      if (!Number.isInteger(limitVal) || limitVal <= 0) {
        return res.status(400).json({
          message: "Limit must be a positive integer.",
        });
      }
    }

    // Validate offset
    let offsetVal = 0; // default
    if (offset !== undefined) {
      offsetVal = Number(offset);
      if (!Number.isInteger(offsetVal) || offsetVal < 0) {
        return res.status(400).json({
          message: "Offset must be a non-negative integer.",
        });
      }
    }

    // Validate min_price and max_price
    let minPriceVal = null;
    let maxPriceVal = null;

    if (min_price !== undefined) {
      minPriceVal = Number(min_price);
      if (isNaN(minPriceVal)) {
        return res.status(400).json({
          message: "min_price must be a valid number.",
        });
      }
    }

    if (max_price !== undefined) {
      maxPriceVal = Number(max_price);
      if (isNaN(maxPriceVal)) {
        return res.status(400).json({
          message: "max_price must be a valid number.",
        });
      }
    }

    if (minPriceVal !== null && maxPriceVal !== null && minPriceVal > maxPriceVal) {
      return res.status(400).json({
        message: "min_price must not exceed max_price.",
      });
    }

    // Build SQL dynamically but safely
    let sql = "SELECT * FROM book WHERE 1=1";
    const params = [];

    // Search filter
    if (search_q) {
      sql += " AND title LIKE ?";
      params.push(`%${search_q}%`);
    }

    // Price range filter
    if (minPriceVal !== null && maxPriceVal !== null) {
      sql += " AND price BETWEEN ? AND ?";
      params.push(minPriceVal, maxPriceVal);
    } else if (minPriceVal !== null) {
      sql += " AND price >= ?";
      params.push(minPriceVal);
    } else if (maxPriceVal !== null) {
      sql += " AND price <= ?";
      params.push(maxPriceVal);
    }

    // ORDER BY — safe because orderByCol is validated against allowlist
    sql += ` ORDER BY ${orderByCol} ${orderDir}`;

    // LIMIT and OFFSET
    sql += " LIMIT ? OFFSET ?";
    params.push(limitVal, offsetVal);

    const books = await dbAll(sql, params);
    res.status(200).json(books);
  } catch (error) {
    console.error("Error in GET /books:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// ─── B. GET /books/:bookId — Retrieve a book by ID ─────────────────────────

app.get("/books/:bookId", async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Book ID must be a valid positive integer.",
      });
    }

    const book = await dbGet("SELECT * FROM book WHERE id = ?", [bookId]);

    if (!book) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found.`,
      });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error("Error in GET /books/:bookId:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// ─── C. POST /books — Create a new book ─────────────────────────────────────

app.post("/books", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate input
    const errors = validateBookBody(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    const result = await dbRun(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
      [title.trim(), author.trim(), Number(price), Number(pages)]
    );

    const newBook = await dbGet("SELECT * FROM book WHERE id = ?", [
      result.lastID,
    ]);

    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error in POST /books:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// ─── D. PUT /books/:bookId — Update an existing book ────────────────────────

app.put("/books/:bookId", async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Book ID must be a valid positive integer.",
      });
    }

    // Check if the book exists
    const existingBook = await dbGet("SELECT * FROM book WHERE id = ?", [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found.`,
      });
    }

    const { title, author, price, pages } = req.body;

    // Validate input (for update, all fields are expected)
    const errors = validateBookBody(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }

    await dbRun(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
      [title.trim(), author.trim(), Number(price), Number(pages), bookId]
    );

    const updatedBook = await dbGet("SELECT * FROM book WHERE id = ?", [bookId]);
    res.status(200).json(updatedBook);
  } catch (error) {
    console.error("Error in PUT /books/:bookId:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// ─── E. DELETE /books/:bookId — Delete a book ───────────────────────────────

app.delete("/books/:bookId", async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Book ID must be a valid positive integer.",
      });
    }

    // Check if the book exists
    const existingBook = await dbGet("SELECT * FROM book WHERE id = ?", [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found.`,
      });
    }

    await dbRun("DELETE FROM book WHERE id = ?", [bookId]);

    res.status(200).json({
      message: `Book with ID ${bookId} deleted successfully.`,
    });
  } catch (error) {
    console.error("Error in DELETE /books/:bookId:", error.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

// ─── START SERVER ───────────────────────────────────────────────────────────

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app; // Export for testing

