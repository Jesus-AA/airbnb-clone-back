/* eslint-disable operator-linebreak */
/* eslint-disable arrow-parens */
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
import { BookingModel } from './entities/booking.js';
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

function getUserDataFromRequest(req) {
	return new Promise((resolve, reject) => {
		jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
			if (err) {
				throw err;
			}

			resolve(userData);
		});
	});
}

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
		price,
	} = req.body;

	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
		if (err) {
			throw err;
		}

		const placeDoc = await PlaceModel.create({
			owner: userData.id,
			title,
			address,
			photos: addedPhotos,
			description,
			perks,
			extraInfo,
			checkIn,
			checkOut,
			maxGuests,
			price,
		});
		res.json(placeDoc);
	});
});

app.get('/user-places', (req, res) => {
	const { token } = req.cookies;
	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
		const { id } = userData;
		res.json(await PlaceModel.find({ owner: id }));
	});
});

app.get('/places/:id', async (req, res) => {
	const { id } = req.params;
	res.json(await PlaceModel.findById(id));
});

app.put('/places', async (req, res) => {
	const { token } = req.cookies;

	const {
		id,
		title,
		address,
		addedPhotos,
		description,
		perks,
		extraInfo,
		checkIn,
		checkOut,
		maxGuests,
		price,
	} = req.body;

	jwt.verify(token, jwtSecret, {}, async (err, userData) => {
		if (err) {
			throw err;
		}

		const placeDoc = await PlaceModel.findById(id);
		if (userData.id === placeDoc.owner.toString()) {
			placeDoc.set({
				title,
				address,
				photos: addedPhotos,
				description,
				perks,
				extraInfo,
				checkIn,
				checkOut,
				maxGuests,
				price,
			});
			await placeDoc.save();
			res.json('Ok!');
		}
	});
});

app.get('/places', async (req, res) => {
	res.json(await PlaceModel.find());
});

app.post('/bookings', async (req, res) => {
	const userData = await getUserDataFromRequest(req);
	const { place, checkIn, checkOut, numberOgGuests, name, phone, price } =
		req.body;
	BookingModel.create({
		user: userData.id,
		place,
		checkIn,
		checkOut,
		numberOgGuests,
		name,
		phone,
		price,
	})
		.then((doc) => {
			res.json(doc);
		})
		.catch((err) => {
			throw err;
		});
});

app.get('/bookings', async (req, res) => {
	const userData = await getUserDataFromRequest(req);
	res.json(await BookingModel.find({ user: userData.id }).populate('place'));
});

app.listen(4000);
