import React, { useEffect, useState } from "react";
import {
    Routes,
    Route,
    NavLink,
    Navigate,
    useNavigate
} from "react-router-dom";

/*LOCAL STORAGE*/

function getBooks() {
    const saved = localStorage.getItem("libraryBooks");

    return saved ? JSON.parse(saved) : [];
}

function getMembers() {
    const saved = localStorage.getItem("libraryMembers");

    return saved ? JSON.parse(saved) : [];
}

function getTransactions() {
    const saved = localStorage.getItem(
        "libraryTransactions"
    );

    return saved ? JSON.parse(saved) : [];
}

/*LOGIN*/

function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        if (username === "admin" && password === "1234") {
            setError("");
            onLogin();
        } else {
            setError("Invalid username or password.");
        }
    }

    return (
        <div className="login-container">

            <h1>Community Library</h1>

            <p>Library Management System</p>

            <form
                className="login-form"
                onSubmit={handleSubmit}
            >

                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}

                <div className="input-group">
                    <label>Username</label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        placeholder="Enter username"
                    />
                </div>

                <div className="input-group">
                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Enter password"
                    />
                </div>

                <button
                    type="submit"
                    className="primary-btn login-button"
                >
                    Login
                </button>

                <p className="login-info">
                </p>

            </form>

        </div>
    );
}

/*LAYOUT*/

function Layout({ onLogout }) {
    const navigate = useNavigate();

    function logout() {
        localStorage.removeItem("libraryLoggedIn");
        onLogout();
        navigate("/");
    }

    return (
        <>

            <header>

                <h1> Community Library</h1>

                <button
                    className="logout-btn"
                    onClick={logout}
                >
                    Logout
                </button>

            </header>

            <nav>

                <NavLink to="/dashboard">
                    Dashboard
                </NavLink>

                <NavLink to="/books">
                    Books
                </NavLink>

                <NavLink to="/transactions">
                    Transactions
                </NavLink>

                <NavLink to="/members">
                    Users
                </NavLink>

            </nav>

            <div id="content">

                <Routes>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/books"
                        element={<Books />}
                    />

                    <Route
                        path="/transactions"
                        element={<Transactions />}
                    />

                    <Route
                        path="/members"
                        element={<Members />}
                    />

                    <Route
                        path="*"
                        element={
                            <Navigate to="/dashboard" />
                        }
                    />

                </Routes>

            </div>

        </>
    );
}

/*DASHBOARD*/

function Dashboard() {

    const [books, setBooks] = useState(getBooks());
    const [members, setMembers] = useState(getMembers());
    const [transactions, setTransactions] =
        useState(getTransactions());

    useEffect(() => {

        function refresh() {
            setBooks(getBooks());
            setMembers(getMembers());
            setTransactions(getTransactions());
        }

        window.addEventListener(
            "libraryDataChanged",
            refresh
        );

        return () => {
            window.removeEventListener(
                "libraryDataChanged",
                refresh
            );
        };

    }, []);

    const totalBooks = books.length;

    const availableBooks = books.reduce(
        (total, book) =>
            total + Number(book.quantity),
        0
    );

    const borrowedBooks = transactions.filter(
        (transaction) =>
            transaction.type === "Borrow" &&
            !transaction.returned
    ).length;

    const lowStockBooks = books.filter(
        (book) => Number(book.quantity) <= 2
    );

    return (
        <>

            <h2>Dashboard</h2>

            <div className="stats-container">

                <div className="stat-card">
                    <h3>Total Books</h3>
                    <p>{totalBooks}</p>
                </div>

                <div className="stat-card">
                    <h3>Available Books</h3>
                    <p>{availableBooks}</p>
                </div>

                <div className="stat-card">
                    <h3>Borrowed Books</h3>
                    <p>{borrowedBooks}</p>
                </div>

                <div className="stat-card">
                    <h3>Members</h3>
                    <p>{members.length}</p>
                </div>

            </div>

            <h3>Low Stock Books</h3>

            {lowStockBooks.length === 0 ? (

                <div className="empty-box">
                    No books are currently low in stock.
                </div>

            ) : (

                <div className="table-container">

                    <table>

                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>

                        <tbody>

                            {lowStockBooks.map((book) => (

                                <tr
                                    key={book.id}
                                    className="low-stock-row"
                                >

                                    <td>
                                        {book.title}
                                    </td>

                                    <td>
                                        {book.author}
                                    </td>

                                    <td className="low-stock">
                                        {book.quantity}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </>
    );
}

/*BOOKS*/

function Books() {

    const [books, setBooks] = useState(getBooks());

    const [showForm, setShowForm] =
        useState(false);

    const [editingBook, setEditingBook] =
        useState(null);

    const emptyForm = {
        title: "",
        author: "",
        category: "",
        isbn: "",
        quantity: 1
    };

    const [form, setForm] =
        useState(emptyForm);

    useEffect(() => {

        function refresh() {
            setBooks(getBooks());
        }

        window.addEventListener(
            "libraryDataChanged",
            refresh
        );

        return () => {
            window.removeEventListener(
                "libraryDataChanged",
                refresh
            );
        };

    }, []);

    function updateData(updatedBooks) {

        setBooks(updatedBooks);

        localStorage.setItem(
            "libraryBooks",
            JSON.stringify(updatedBooks)
        );

        window.dispatchEvent(
            new Event("libraryDataChanged")
        );
    }

    function openAddForm() {

        setEditingBook(null);
        setForm(emptyForm);
        setShowForm(true);
    }

    function openEditForm(book) {

        setEditingBook(book);

        setForm({
            title: book.title,
            author: book.author,
            category: book.category,
            isbn: book.isbn,
            quantity: book.quantity
        });

        setShowForm(true);
    }

    function handleChange(e) {

        const { name, value } = e.target;

        setForm({
            ...form,
            [name]:
                name === "quantity"
                    ? Number(value)
                    : value
        });
    }

    function saveBook(e) {

        e.preventDefault();

        if (
            !form.title ||
            !form.author ||
            !form.category ||
            !form.isbn
        ) {
            alert("Please fill in all fields.");
            return;
        }

        if (form.quantity < 0) {
            alert("Quantity cannot be negative.");
            return;
        }

        if (editingBook) {

            const updated = books.map((book) =>
                book.id === editingBook.id
                    ? {
                        ...book,
                        ...form
                    }
                    : book
            );

            updateData(updated);

        } else {

            const newBook = {
                id:
                    books.length > 0
                        ? Math.max(
                            ...books.map(
                                (book) => book.id
                            )
                        ) + 1
                        : 1,

                ...form
            };

            updateData([
                ...books,
                newBook
            ]);
        }

        setShowForm(false);
        setForm(emptyForm);
        setEditingBook(null);
    }

    function deleteBook(id) {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this book?"
            );

        if (!confirmDelete) {
            return;
        }

        updateData(
            books.filter(
                (book) => book.id !== id
            )
        );
    }

    return (
        <>

            <div className="page-header">

                <h2>Books</h2>

                <button
                    className="primary-btn"
                    onClick={openAddForm}
                >
                    + Add Book
                </button>

            </div>

            {showForm && (

                <div className="form-card">

                    <h3>
                        {editingBook
                            ? "Edit Book"
                            : "Add New Book"}
                    </h3>

                    <form onSubmit={saveBook}>

                        <div className="form-grid">

                            <div className="input-group">

                                <label>
                                    Title
                                </label>

                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="input-group">

                                <label>
                                    Author
                                </label>

                                <input
                                    name="author"
                                    value={form.author}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="input-group">

                                <label>
                                    Category
                                </label>

                                <input
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="input-group">

                                <label>
                                    ISBN
                                </label>

                                <input
                                    name="isbn"
                                    value={form.isbn}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            <div className="input-group">

                                <label>
                                    Quantity
                                </label>

                                <input
                                    type="number"
                                    name="quantity"
                                    min="0"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                        </div>

                        <div className="form-buttons">

                            <button
                                type="submit"
                                className="primary-btn"
                            >
                                {editingBook
                                    ? "Update Book"
                                    : "Save Book"}
                            </button>

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingBook(null);
                                }}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>

            )}

            <div className="table-container">

                <table>

                    <thead>

                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>ISBN</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>

                    </thead>

                    <tbody>

                        {books.map((book) => (

                            <tr key={book.id}>

                                <td>{book.id}</td>

                                <td>{book.title}</td>

                                <td>{book.author}</td>

                                <td>{book.category}</td>

                                <td>{book.isbn}</td>

                                <td>{book.quantity}</td>

                                <td>
                                    {book.quantity > 0
                                        ? "Available"
                                        : "Out of Stock"}
                                </td>

                                <td>

                                    <button
                                        className="edit-btn"
                                        onClick={() =>
                                            openEditForm(book)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            deleteBook(
                                                book.id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </>
    );
}

/*TRANSACTIONS*/

function Transactions() {

    const [transactions, setTransactions] =
        useState(getTransactions());

    const [books, setBooks] =
        useState(getBooks());

    const [members, setMembers] =
        useState(getMembers());

    const [selectedBook, setSelectedBook] =
        useState("");

    const [selectedMember, setSelectedMember] =
        useState("");

    useEffect(() => {

        function refresh() {

            setTransactions(
                getTransactions()
            );

            setBooks(getBooks());

            setMembers(getMembers());
        }

        window.addEventListener(
            "libraryDataChanged",
            refresh
        );

        return () => {
            window.removeEventListener(
                "libraryDataChanged",
                refresh
            );
        };

    }, []);

    function borrowBook(e) {

        e.preventDefault();

        if (!selectedBook || !selectedMember) {
            alert(
                "Please select a book and member."
            );

            return;
        }

        const bookId =
            Number(selectedBook);

        const memberId =
            Number(selectedMember);

        const book =
            books.find(
                (b) => b.id === bookId
            );

        const member =
            members.find(
                (m) => m.id === memberId
            );

        if (!book || !member) {
            return;
        }

        if (book.quantity <= 0) {

            alert(
                "This book is currently unavailable."
            );

            return;
        }

        const updatedBooks =
            books.map((b) =>
                b.id === bookId
                    ? {
                        ...b,
                        quantity:
                            Number(b.quantity) - 1
                    }
                    : b
            );

        const newTransaction = {
            id:
                transactions.length > 0
                    ? Math.max(
                        ...transactions.map(
                            (t) => t.id
                        )
                    ) + 1
                    : 1,

            bookId: book.id,

            bookTitle: book.title,

            memberId: member.id,

            memberName: member.name,

            type: "Borrow",

            date:
                new Date().toLocaleString(),

            returned: false
        };

        const updatedTransactions = [
            ...transactions,
            newTransaction
        ];

        localStorage.setItem(
            "libraryBooks",
            JSON.stringify(updatedBooks)
        );

        localStorage.setItem(
            "libraryTransactions",
            JSON.stringify(
                updatedTransactions
            )
        );

        setBooks(updatedBooks);
        setTransactions(
            updatedTransactions
        );

        setSelectedBook("");
        setSelectedMember("");

        window.dispatchEvent(
            new Event("libraryDataChanged")
        );
    }

    function returnBook(transactionId) {

        const transaction =
            transactions.find(
                (t) =>
                    t.id === transactionId
            );

        if (!transaction) {
            return;
        }

        const updatedBooks =
            books.map((book) =>
                book.id === transaction.bookId
                    ? {
                        ...book,
                        quantity:
                            Number(book.quantity) + 1
                    }
                    : book
            );

        const updatedTransactions =
            transactions.map((t) =>
                t.id === transactionId
                    ? {
                        ...t,
                        type: "Return",
                        returned: true,
                        returnDate:
                            new Date().toLocaleString()
                    }
                    : t
            );

        localStorage.setItem(
            "libraryBooks",
            JSON.stringify(updatedBooks)
        );

        localStorage.setItem(
            "libraryTransactions",
            JSON.stringify(
                updatedTransactions
            )
        );

        setBooks(updatedBooks);
        setTransactions(
            updatedTransactions
        );

        window.dispatchEvent(
            new Event("libraryDataChanged")
        );
    }

    return (
        <>

            <div className="page-header">

                <h2>Transactions</h2>

            </div>

            <div className="form-card">

                <h3>Borrow a Book</h3>

                <form onSubmit={borrowBook}>

                    <div className="form-grid">

                        <div className="input-group">

                            <label>
                                Select Book
                            </label>

                            <select
                                value={selectedBook}
                                onChange={(e) =>
                                    setSelectedBook(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Select a book
                                </option>

                                {books
                                    .filter(
                                        (book) =>
                                            book.quantity >
                                            0
                                    )
                                    .map((book) => (

                                        <option
                                            key={book.id}
                                            value={book.id}
                                        >
                                            {book.title} -
                                            Available:{" "}
                                            {book.quantity}
                                        </option>

                                    ))}

                            </select>

                        </div>

                        <div className="input-group">

                            <label>
                                Select Member
                            </label>

                            <select
                                value={selectedMember}
                                onChange={(e) =>
                                    setSelectedMember(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="">
                                    Select a member
                                </option>

                                {members.map(
                                    (member) => (

                                        <option
                                            key={member.id}
                                            value={member.id}
                                        >
                                            {member.name}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>

                    </div>

                    <button
                        className="primary-btn"
                        type="submit"
                    >
                        Borrow Book
                    </button>

                </form>

            </div>

            <h3>Transaction History</h3>

            {transactions.length === 0 ? (

                <div className="empty-box">
                    No transactions yet.
                </div>

            ) : (

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Book</th>
                                <th>Member</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            {transactions.map(
                                (transaction) => (

                                    <tr
                                        key={
                                            transaction.id
                                        }
                                    >

                                        <td>
                                            {
                                                transaction.id
                                            }
                                        </td>

                                        <td>
                                            {
                                                transaction.bookTitle
                                            }
                                        </td>

                                        <td>
                                            {
                                                transaction.memberName
                                            }
                                        </td>

                                        <td>
                                            {
                                                transaction.type
                                            }
                                        </td>

                                        <td>
                                            {
                                                transaction.date
                                            }
                                        </td>

                                        <td>

                                            {transaction.type ===
                                                "Borrow" &&
                                                !transaction.returned ? (

                                                <button
                                                    className="return-btn"
                                                    onClick={() =>
                                                        returnBook(
                                                            transaction.id
                                                        )
                                                    }
                                                >
                                                    Return
                                                </button>

                                            ) : (

                                                "Completed"

                                            )}

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </>
    );
}

/*MEMBERS / USERS*/

function Members() {

    const [members, setMembers] =
        useState(getMembers());

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [phone, setPhone] =
        useState("");

    useEffect(() => {

        function refresh() {
            setMembers(getMembers());
        }

        window.addEventListener(
            "libraryDataChanged",
            refresh
        );

        return () => {
            window.removeEventListener(
                "libraryDataChanged",
                refresh
            );
        };

    }, []);

    function addMember(e) {

        e.preventDefault();

        if (!name || !email || !phone) {

            alert(
                "Please fill in all member fields."
            );

            return;
        }

        const newMember = {

            id:
                members.length > 0
                    ? Math.max(
                        ...members.map(
                            (m) => m.id
                        )
                    ) + 1
                    : 1,

            name,
            email,
            phone
        };

        const updatedMembers = [
            ...members,
            newMember
        ];

        localStorage.setItem(
            "libraryMembers",
            JSON.stringify(updatedMembers)
        );

        setMembers(updatedMembers);

        setName("");
        setEmail("");
        setPhone("");

        window.dispatchEvent(
            new Event("libraryDataChanged")
        );
    }

    function deleteMember(id) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this member?"
            );

        if (!confirmed) {
            return;
        }

        const updatedMembers =
            members.filter(
                (member) =>
                    member.id !== id
            );

        localStorage.setItem(
            "libraryMembers",
            JSON.stringify(
                updatedMembers
            )
        );

        setMembers(updatedMembers);

        window.dispatchEvent(
            new Event("libraryDataChanged")
        );
    }

    return (
        <>

            <div className="page-header">

                <h2>Users / Members</h2>

            </div>

            <div className="form-card">

                <h3>Add Member</h3>

                <form onSubmit={addMember}>

                    <div className="form-grid">

                        <div className="input-group">

                            <label>
                                Name
                            </label>

                            <input
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                placeholder="Member name"
                            />

                        </div>

                        <div className="input-group">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                placeholder="Email address"
                            />

                        </div>

                        <div className="input-group">

                            <label>
                                Phone
                            </label>

                            <input
                                value={phone}
                                onChange={(e) =>
                                    setPhone(
                                        e.target.value
                                    )
                                }
                                placeholder="Phone number"
                            />

                        </div>

                    </div>

                    <div className="form-buttons">

                        <button
                            type="submit"
                            className="primary-btn"
                        >
                            Add Member
                        </button>

                    </div>

                </form>

            </div>

            <h3>Members</h3>

            {members.length === 0 ? (

                <div className="empty-box">
                    No members registered yet.
                </div>

            ) : (

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {members.map(
                                (member) => (

                                    <tr
                                        key={
                                            member.id
                                        }
                                    >

                                        <td>
                                            {
                                                member.id
                                            }
                                        </td>

                                        <td>
                                            {
                                                member.name
                                            }
                                        </td>

                                        <td>
                                            {
                                                member.email
                                            }
                                        </td>

                                        <td>
                                            {
                                                member.phone
                                            }
                                        </td>

                                        <td>

                                            <button
                                                className="delete-btn"
                                                onClick={() =>
                                                    deleteMember(
                                                        member.id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </>
    );
}

/*MAIN APP*/

function App() {

    const [loggedIn, setLoggedIn] =
        useState(
            localStorage.getItem(
                "libraryLoggedIn"
            ) === "true"
        );

    function handleLogin() {

        localStorage.setItem(
            "libraryLoggedIn",
            "true"
        );

        setLoggedIn(true);
    }

    function handleLogout() {

        localStorage.removeItem(
            "libraryLoggedIn"
        );

        setLoggedIn(false);
    }

    if (!loggedIn) {

        return (
            <Login
                onLogin={handleLogin}
            />
        );
    }

    return (
        <Layout
            onLogout={handleLogout}
        />
    );
}

export default App;