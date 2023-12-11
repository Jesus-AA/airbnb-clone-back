/* eslint-disable object-curly-spacing */
import bcrypt from 'bcrypt';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { UserModel } from './entities/user.js';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL);

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
			res.cookie('token', '').json('Succes');
		} else {
			res.json('Error');
		}
	} else {
		res.json('notFound');
	}
});

app.listen(4000);
