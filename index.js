const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// Create User Schema
const userSchema = new mongoose.Schema({
	username: String,
	log: [
		{
			description: String,
			duration: Number,
			date: String,
		},
	],
});

const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

// Create new user
app.post("/api/users", async (req, res) => {
	const user = new User({ username: req.body.username });
	try {
		const savedUser = await user.save();
		res.json({ username: savedUser.username, _id: savedUser._id });
	} catch (err) {
		res.status(500).json({ error: "Error creating user" });
	}
});

// Get all users
app.get("/api/users", async (req, res) => {
	try {
		const users = await User.find({}, "username _id");
		res.json(users);
	} catch (err) {
		res.status(500).json({ error: "Error fetching users" });
	}
});

// Add exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
	const { description, duration, date } = req.body;
	try {
		const user = await User.findById(req.params._id);
		user.log.push({
			description,
			duration: Number(duration),
			date: date ? new Date(date).toDateString() : new Date().toDateString(),
		});
		const savedUser = await user.save();
		res.json({
			_id: savedUser._id,
			username: savedUser.username,
			description,
			duration: Number(duration),
			date: date ? new Date(date).toDateString() : new Date().toDateString(),
		});
	} catch (err) {
		res.status(500).json({ error: "Error adding exercise" });
	}
});

// Get user logs
app.get("/api/users/:_id/logs", async (req, res) => {
	try {
		const user = await User.findById(req.params._id);
		let log = user.log;

		if (req.query.from) {
			log = log.filter((e) => new Date(e.date) >= new Date(req.query.from));
		}
		if (req.query.to) {
			log = log.filter((e) => new Date(e.date) <= new Date(req.query.to));
		}
		if (req.query.limit) {
			log = log.slice(0, Number(req.query.limit));
		}

		res.json({
			_id: user._id,
			username: user.username,
			count: log.length,
			log,
		});
	} catch (err) {
		res.status(500).json({ error: "Error fetching logs" });
	}
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
