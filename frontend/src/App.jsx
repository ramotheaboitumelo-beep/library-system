import React, { useEffect, useState } from "react";
import {
    Routes,
    Route,
    NavLink,
    Navigate,
    useNavigate
} from "react-router-dom";

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
    const [books, setBooks] = useState([]);
    const [members, setMembers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDashboardData();

        function refresh() {
            loadDashboardData();
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

    async function loadDashboardData() {
        try {
            setError("");

            const [
                booksResponse,
                membersResponse,
                transactionsResponse
            ] = await Promise.all([
                fetch("http://localhost:5000/api/books"),
                fetch("http://localhost:5000/api/members"),
                fetch("http://localhost:5000/api/transactions")
            ]);

            if (
                !booksResponse.ok ||
                !membersResponse.ok ||
                !transactionsResponse.ok
            ) {
                throw new Error(
                    "Failed to load dashboard data."
                );
            }

            const booksData = await booksResponse.json();
            const membersData = await membersResponse.json();
            const transactionsData =
                await transactionsResponse.json();

            setBooks(booksData);
            setMembers(membersData);
            setTransactions(transactionsData);
        } catch (error) {
            console.error(
                "Dashboard loading error:",
                error
            );

            setError(
                "Could not load dashboard data. Check that the backend is running."
            );
        } finally {
            setLoading(false);
        }
    }

    const totalBooks = books.reduce(
        (total, book) =>
            total + Number(book.quantity),
        0
    );

    const availableBooks = books.reduce(
        (total, book) =>
            total + Number(book.available),
        0
    );

    const borrowedBooks = transactions.filter(
        (transaction) => !transaction.returned
    ).length;

    const lowStockBooks = books.filter(
        (book) => Number(book.available) <= 2
    );

    if (loading) {
        return (
            <div className="empty-box">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-box">
                {error}
                <button
                    className="primary-btn"
                    onClick={loadDashboardData}
                >
                    Try Again
                </button>
            </div>
        );
    }

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
                                <th>Available Copies</th>
                            </tr>
                        </thead>

                        <tbody>
                            {lowStockBooks.map((book) => (
                                <tr
                                    key={book.id}
                                    className="low-stock-row"
                                >
                                    <td>{book.title}</td>
                                    <td>{book.author}</td>
                                    <td className="low-stock">
                                        {book.available}
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
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    const emptyForm = {
        title: "",
        author: "",
        category: "",
        isbn: "",
        quantity: 1
    };

    const [form, setForm] = useState(emptyForm);

    async function loadBooks() {
        try {
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/books"
            );

            if (!response.ok) {
                throw new Error("Failed to load books from MySQL.");
            }

            const data = await response.json();
            setBooks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBooks();
    }, []);

    function openAddForm() {
        setEditingBook(null);
        setForm({ ...emptyForm });
        setShowForm(true);
    }

    function openEditForm(book) {
        setEditingBook(book);

        setForm({
            title: book.title,
            author: book.author,
            category: book.category,
            isbn: book.isbn,
            quantity: Number(book.quantity)
        });

        setShowForm(true);
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm(previous => ({
            ...previous,
            [name]: name === "quantity" ? Number(value) : value
        }));
    }

    async function saveBook(e) {
        e.preventDefault();
        setError("");

        if (
            !form.title.trim() ||
            !form.author.trim() ||
            !form.category.trim() ||
            !form.isbn.trim()
        ) {
            setError("Please fill in all fields.");
            return;
        }

        if (!Number.isInteger(form.quantity) || form.quantity < 1) {
            setError("Quantity must be at least 1.");
            return;
        }

        try {
            const url = editingBook
                ? `http://localhost:5000/api/books/${editingBook.id}`
                : "http://localhost:5000/api/books";

            const response = await fetch(url, {
                method: editingBook ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...form,
                    title: form.title.trim(),
                    author: form.author.trim(),
                    category: form.category.trim(),
                    isbn: form.isbn.trim()
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to save book."
                );
            }

            setShowForm(false);
            setForm({ ...emptyForm });
            setEditingBook(null);

            await loadBooks();
        } catch (err) {
            setError(err.message);
        }
    }

    async function deleteBook(id) {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this book?"
        );

        if (!confirmDelete) {
            return;
        }

        setError("");

        try {
            const response = await fetch(
                `http://localhost:5000/api/books/${id}`,
                { method: "DELETE" }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to delete book."
                );
            }

            await loadBooks();
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) {
        return <div className="page"><p>Loading books...</p></div>;
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

            {error && (
                <p style={{ color: "red", marginBottom: "15px" }}>
                    {error}
                </p>
            )}

            {showForm && (
                <div className="form-card">
                    <h3>
                        {editingBook ? "Edit Book" : "Add New Book"}
                    </h3>

                    <form onSubmit={saveBook}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Title</label>
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Author</label>
                                <input
                                    name="author"
                                    value={form.author}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Category</label>
                                <input
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>ISBN</label>
                                <input
                                    name="isbn"
                                    value={form.isbn}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    min="1"
                                    step="1"
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
                                {editingBook ? "Update Book" : "Save Book"}
                            </button>

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingBook(null);
                                    setForm({ ...emptyForm });
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
                            <th>Available</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {books.map(book => (
                            <tr key={book.id}>
                                <td>{book.id}</td>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{book.category}</td>
                                <td>{book.isbn}</td>
                                <td>{book.quantity}</td>
                                <td>{book.available}</td>
                                <td>
                                    {Number(book.available) > 0
                                        ? "Available"
                                        : "Out of Stock"}
                                </td>
                                <td>
                                    <button
                                        className="edit-btn"
                                        onClick={() => openEditForm(book)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteBook(book.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {books.length === 0 && (
                    <p>No books found in the database.</p>
                )}
            </div>
        </>
    );
}

/*TRANSACTIONS*/

function Transactions() {

    const [transactions, setTransactions] =
        useState([]);

    const [books, setBooks] =
        useState([]);

    const [members, setMembers] =
        useState([]);

    const [selectedBook, setSelectedBook] =
        useState("");

    const [selectedMember, setSelectedMember] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        try {

            setLoading(true);
            setError("");

            const [
                transactionsResponse,
                booksResponse,
                membersResponse
            ] = await Promise.all([

                fetch(
                    "http://localhost:5000/api/transactions"
                ),

                fetch(
                    "http://localhost:5000/api/books"
                ),

                fetch(
                    "http://localhost:5000/api/members"
                )

            ]);

            if (
                !transactionsResponse.ok ||
                !booksResponse.ok ||
                !membersResponse.ok
            ) {
                throw new Error(
                    "Failed to load transaction data."
                );
            }

            const transactionsData =
                await transactionsResponse.json();

            const booksData =
                await booksResponse.json();

            const membersData =
                await membersResponse.json();

            setTransactions(transactionsData);
            setBooks(booksData);
            setMembers(membersData);

        } catch (error) {

            console.error(
                "Transaction loading error:",
                error
            );

            setError(
                "Could not load transaction data."
            );

        } finally {

            setLoading(false);

        }
    }

    async function borrowBook(e) {

        e.preventDefault();

        if (!selectedBook || !selectedMember) {

            alert(
                "Please select a book and member."
            );

            return;
        }

        try {

            const response = await fetch(
                "http://localhost:5000/api/transactions/borrow",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        bookId: Number(selectedBook),
                        memberId: Number(selectedMember)
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to borrow book."
                );

                return;
            }

            alert(
                "Book borrowed successfully!"
            );

            setSelectedBook("");
            setSelectedMember("");

            await loadData();

            window.dispatchEvent(
                new Event("libraryDataChanged")
            );

        } catch (error) {

            console.error(error);

            alert(
                "Could not connect to the server."
            );
        }
    }

    async function returnBook(transactionId) {

        try {

            const response = await fetch(
                `http://localhost:5000/api/transactions/${transactionId}/return`,
                {
                    method: "PUT"
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.error ||
                    "Failed to return book."
                );

                return;
            }

            alert(
                "Book returned successfully!"
            );

            await loadData();

            window.dispatchEvent(
                new Event("libraryDataChanged")
            );

        } catch (error) {

            console.error(error);

            alert(
                "Could not connect to the server."
            );
        }
    }

    if (loading) {

        return (
            <div className="empty-box">
                Loading transactions...
            </div>
        );
    }

    if (error) {

        return (
            <div className="empty-box">
                {error}
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h2>Transactions</h2>
            </div>

            <div className="form-card">

                <h3>Borrow a Book</h3>

                {books.length === 0 ||
                members.length === 0 ? (

                    <div className="empty-box">

                        {books.length === 0
                            ? "No books are available."
                            : "No members are available."}

                    </div>

                ) : (

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
                                                Number(
                                                    book.available
                                                ) > 0
                                        )
                                        .map((book) => (

                                            <option
                                                key={book.id}
                                                value={book.id}
                                            >

                                                {book.title}
                                                {" - Available: "}
                                                {book.available}

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

                )}

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
                                            {transaction.id}
                                        </td>

                                        <td>
                                            {transaction.bookTitle}
                                        </td>

                                        <td>
                                            {transaction.memberName}
                                        </td>

                                        <td>
                                            {transaction.type}
                                        </td>

                                        <td>
                                            {transaction.date}
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
    const [members, setMembers] = useState([]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadMembers();
    }, []);

    async function loadMembers() {
        try {
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/members"
            );

            if (!response.ok) {
                throw new Error("Failed to load members.");
            }

            const data = await response.json();
            setMembers(data);
        } catch (error) {
            console.error("Member loading error:", error);
            setError("Could not load members. Check that the backend is running.");
        } finally {
            setLoading(false);
        }
    }

    async function addMember(e) {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !phone.trim()) {
            alert("Please fill in all member fields.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/members",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        phone
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to register member.");
                return;
            }

            alert("Member registered successfully!");

            setName("");
            setEmail("");
            setPhone("");

            await loadMembers();

            window.dispatchEvent(
                new Event("libraryDataChanged")
            );
        } catch (error) {
            console.error(error);
            alert("Could not connect to the server.");
        }
    }

    async function deleteMember(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this member?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/members/${id}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Failed to delete member.");
                return;
            }

            alert("Member deleted successfully!");

            await loadMembers();

            window.dispatchEvent(
                new Event("libraryDataChanged")
            );
        } catch (error) {
            console.error(error);
            alert("Could not connect to the server.");
        }
    }

    if (loading) {
        return (
            <div className="empty-box">
                Loading members...
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-box">
                {error}
                <button
                    className="primary-btn"
                    onClick={loadMembers}
                >
                    Try Again
                </button>
            </div>
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
                            <label>Name</label>
                            <input
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                placeholder="Member name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                placeholder="Email address"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) =>
                                    setPhone(e.target.value)
                                }
                                placeholder="Phone number"
                                required
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
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td>{member.id}</td>
                                    <td>{member.name}</td>
                                    <td>{member.email}</td>
                                    <td>{member.phone}</td>
                                    <td>
                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                deleteMember(member.id)
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