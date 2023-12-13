/* eslint-disable comma-dangle */
/* eslint-disable object-curly-spacing */
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import 'image-downloader';
import { image } from 'image-downloader';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { PlaceModel } from './entities/place.js';
import { UserModel } from './entities/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors({ credentials: true, origin: 'https://aibnbclone.netlify.app' }));
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
						console.log(token);
						res
							.cookie('token', token, { httpOnly: false, secure: true, sameSite: 'none' })
							.send(loginUser);
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

app.post('/upload-by-link', async (req, res) => {
	const { link } = req.body;
	const newName = 'photo' + Date.now() + '.jpg';
	await image({
		url: link,
		dest: __dirname + '/uploads/' + newName,
	});
	res.json(newName);
});

const photosMiddleware = multer({ dest: 'src/uploads/' });

app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
	const uploadedFiles = [];
	for (let i = 0; i < req.files.length; i++) {
		const { path, originalname } = req.files[i];
		const parts = originalname.split('.');
		const ext = parts[parts.length - 1];
		const newPath = path + '.' + ext;

		fs.renameSync(path, newPath);

		uploadedFiles.push(newPath.replace('src\\uploads\\', ''));
	}

	res.json(uploadedFiles);
});

app.post('/places', (req, res) => {
	const { token } = req.cookies;
	console.log(req);
	console.log('TOKEN', token);
	const {
		title,
		address,
		addedPhotos,
		description,
		perks,
		extraInfo,
		checkIn,
		checkOut,
		maxGuests,
	} = req.body;

	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
		if (err) {
			throw err;
		}

		const placeDoc = await PlaceModel.create({
			owner: userData.id,
			title,
			address,
			addedPhotos,
			description,
			perks,
			extraInfo,
			checkIn,
			checkOut,
			maxGuests,
		});
		res.json(placeDoc);
	});
});

app.listen(4000);
