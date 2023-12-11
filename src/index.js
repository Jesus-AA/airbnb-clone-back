/* eslint-disable comma-dangle */
/* eslint-disable object-curly-spacing */
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { UserModel } from './entities/user.js';

const app = express();
app.use(cookieParser());
app.use(cors({ credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL);
const jwtSecret = 'kdnfadjkfnkdfndskfnds90fsdjfdsf';

app.get('/test', (req, res) => {
	res.json('test ok');
});

app.post('/register', async (req, res) => {
	const { name, email } = req.body;
	const hashedPassword = await bcrypt.hash(req.body.password, 10);
	try {
		const newUser = await UserModel.create({
			name,
			email,
			password: hashedPassword,
		});
		res.json(newUser);
	} catch (error) {
		res.status(422).json(error);
	}
});

app.post('/login', async (req, res) => {
	const { email, password } = req.body;
	const loginUser = await UserModel.findOne({ email });
	if (loginUser) {
		const passOk = await bcrypt.compare(password, loginUser.password);

		if (passOk) {
			jwt.sign(
				{ email: loginUser.email, id: loginUser._id },
				jwtSecret,
				{},
				(err, token) => {
					if (err) {
						throw err;
					} else {
						res.cookie('token', token).json(loginUser);
					}
				}
			);
		} else {
			res.status(422).json('Error');
		}
	} else {
		res.json('notFound');
	}
});

app.get('/profile', (req, res) => {
	const { token } = req.cookies;
	if (token) {
		jwt.verify(token, jwtSecret, {}, async (err, userData) => {
			if (err) {
				throw err;
			}

			const { name, email, _id } = await UserModel.findById(userData.id);
			res.json({ name, email, _id });
		});
	} else {
		res.json(null);
	}
});

app.post('/logout', (req, res) => {
	res.cookie('token', '').json(true);
});

app.listen(4000);