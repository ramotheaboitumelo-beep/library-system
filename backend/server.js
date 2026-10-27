
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("Community Library Backend is running!");
});

// Get all books
app.get("/api/books", (req, res) => {
    db.query("SELECT * FROM books", (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Failed to fetch books" });
        }

        const books = results.map(book => ({
            id: book.id,
            title: book.Title,
            author: book.Author,
            category: book.Genre,
            isbn: book.ISBN,
            quantity: book.Quantity,
            available: book.Available
        }));

        res.json(books);
    });
});

// Add a book
app.post("/api/books", (req, res) => {
    const { title, author, category, isbn, quantity } = req.body;

    if (!title || !author || !category || !isbn ||
        !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: "Invalid book details" });
    }

    const sql = `
        INSERT INTO books (Title, Author, Genre, ISBN, Quantity, Available)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [title, author, category, isbn, quantity, quantity],
        (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500)
                    .json({ error: "Could not add book. Check that the ISBN is unique." });
            }

            res.status(201).json({
                id: result.insertId,
                title,
                author,
                category,
                isbn,
                quantity,
                available: quantity
            });
        }
    );
});

// Edit a book
app.put("/api/books/:id", (req, res) => {
    const { title, author, category, isbn, quantity } = req.body;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1 ||
        !title || !author || !category || !isbn ||
        !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: "Invalid book details" });
    }

    const sql = `
        UPDATE books
        SET Title = ?, Author = ?, Genre = ?, ISBN = ?,
            Available = Available + (? - Quantity),
            Quantity = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [title, author, category, isbn, quantity, quantity, id],
        (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(err.code === "ER_DUP_ENTRY" ? 409 : 500)
                    .json({ error: "Could not update book" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Book not found" });
            }

            res.json({ message: "Book updated successfully" });
        }
    );
});

// Delete a book
app.delete("/api/books/:id", (req, res) => {
    db.query(
        "DELETE FROM books WHERE id = ?",
        [req.params.id],
        (err, result) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({
                    error: "Could not delete book. It may have borrowing records."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Book not found" });
            }

            res.json({ message: "Book deleted successfully" });
        }
    );
});

// Get all transactions
app.get("/api/transactions", (req, res) => {
    const sql = `
        SELECT
            t.id,
            t.Member_id,
            t.Book_id,
            t.Borrow_date,
            t.Return_date,
            t.Status,
            m.Full_Name AS memberName,
            b.Title AS bookTitle
        FROM transactions t
        JOIN members m ON t.Member_id = m.id
        JOIN books b ON t.Book_id = b.id
        ORDER BY t.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({
                error: "Failed to fetch transactions"
            });
        }

        const transactions = results.map(transaction => ({
            id: transaction.id,
            bookId: transaction.Book_id,
            bookTitle: transaction.bookTitle,
            memberId: transaction.Member_id,
            memberName: transaction.memberName,
            type: transaction.Status === "borrowed"
                ? "Borrow"
                : "Return",
            date: transaction.Borrow_date,
            returnDate: transaction.Return_date,
            returned: transaction.Status === "returned"
        }));

        res.json(transactions);
    });
});

// Borrow a book
app.post("/api/transactions/borrow", (req, res) => {
    const { bookId, memberId } = req.body;

    if (!bookId || !memberId) {
        return res.status(400).json({
            error: "Book and member are required"
        });
    }

    db.query(
        "SELECT * FROM books WHERE id = ?",
        [bookId],
        (err, books) => {

            if (err) {
                return res.status(500).json({
                    error: "Failed to find book"
                });
            }

            if (books.length === 0) {
                return res.status(404).json({
                    error: "Book not found"
                });
            }

            const book = books[0];

            if (book.Available <= 0) {
                return res.status(400).json({
                    error: "This book is currently unavailable"
                });
            }

            db.query(
                "SELECT * FROM members WHERE id = ?",
                [memberId],
                (memberErr, members) => {

                    if (memberErr) {
                        return res.status(500).json({
                            error: "Failed to find member"
                        });
                    }

                    if (members.length === 0) {
                        return res.status(404).json({
                            error: "Member not found"
                        });
                    }

                    db.query(
                        `INSERT INTO transactions
                        (Member_id, Book_id, Borrow_date, Status)
                        VALUES (?, ?, CURDATE(), 'borrowed')`,
                        [memberId, bookId],
                        (transactionErr, result) => {

                            if (transactionErr) {
                                console.error(transactionErr.message);

                                return res.status(500).json({
                                    error: "Failed to create transaction"
                                });
                            }

                            db.query(
                                `UPDATE books
                                SET Available = Available - 1
                                WHERE id = ?`,
                                [bookId],
                                (updateErr) => {

                                    if (updateErr) {
                                        console.error(updateErr.message);
                                        return res.status(500).json({
                                            error: "Book borrowed but availability update failed"
                                        });
                                    }

                                    res.status(201).json({
                                        message: "Book borrowed successfully",
                                        id: result.insertId
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// Return a book
app.put("/api/transactions/:id/return", (req, res) => {

    const transactionId = Number(req.params.id);

    db.query(
        "SELECT * FROM transactions WHERE id = ?",
        [transactionId],
        (err, transactions) => {

            if (err) {
                return res.status(500).json({
                    error: "Failed to find transaction"
                });
            }

            if (transactions.length === 0) {
                return res.status(404).json({
                    error: "Transaction not found"
                });
            }

            const transaction = transactions[0];

            if (transaction.Status === "returned") {
                return res.status(400).json({
                    error: "This book has already been returned"
                });
            }

            db.query(
                `UPDATE transactions
                SET Return_date = CURDATE(),
                    Status = 'returned'
                WHERE id = ?`,
                [transactionId],
                (updateErr) => {

                    if (updateErr) {
                        console.error(updateErr.message);

                        return res.status(500).json({
                            error: "Failed to return book"
                        });
                    }

                    db.query(
                        `UPDATE books
                        SET Available = Available + 1
                        WHERE id = ?`,
                        [transaction.Book_id],
                        (bookErr) => {

                            if (bookErr) {
                                console.error(bookErr.message);

                                return res.status(500).json({
                                    error: "Book returned but availability update failed"
                                });
                            }

                            res.json({
                                message: "Book returned successfully"
                            });
                        }
                    );
                }
            );
        }
    );
});

// Get all members

 // Get all members
app.get("/api/members", (req, res) => {
    const sql = `
        SELECT id, Full_Name, Email, Phone, Role
        FROM members
        ORDER BY id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({
                error: "Failed to fetch members"
            });
        }

        const members = results.map(member => ({
            id: member.id,
            name: member.Full_Name,
            email: member.Email,
            phone: member.Phone || "",
            role: member.Role
        }));

        res.json(members);
    });
});

// Register a member
app.post("/api/members", (req, res) => {
    const { name, email, phone } = req.body;

    if (
        !name?.trim() ||
        !email?.trim() ||
        !phone?.trim()
    ) {
        return res.status(400).json({
            error: "Please fill in all member fields."
        });
    }

    const sql = `
        INSERT INTO members
            (Full_Name, Email, Phone, Password, Role)
        VALUES (?, ?, ?, ?, 'member')
    `;

    // Temporary password because this form does not yet
    // implement member login or password creation.
    const temporaryPassword = "1234";

    db.query(
        sql,
        [
            name.trim(),
            email.trim(),
            phone.trim(),
            temporaryPassword
        ],
        (err, result) => {
            if (err) {
                console.error(err.message);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        error: "That email address is already registered."
                    });
                }

                return res.status(500).json({
                    error: "Failed to register member."
                });
            }

            res.status(201).json({
                id: result.insertId,
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                role: "member"
            });
        }
    );
});

// Delete a member
app.delete("/api/members/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            error: "Invalid member ID."
        });
    }

    db.query(
        "DELETE FROM members WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                console.error(err.message);

                if (err.code === "ER_ROW_IS_REFERENCED_2") {
                    return res.status(409).json({
                        error: "This member has transaction records and cannot be deleted."
                    });
                }

                return res.status(500).json({
                    error: "Failed to delete member."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    error: "Member not found."
                });
            }

            res.json({
                message: "Member deleted successfully."
            });
        }
    );
});


const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
