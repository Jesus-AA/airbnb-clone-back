/* eslint-disable object-curly-spacing */
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL);

app.get('/test', (req, res) => {
	res.json('test ok');
});

app.post('/register', (req, res) => {
	const { name, email, password } = req.body;
	res.json({ name, email, password });
});

app.listen(4000);
