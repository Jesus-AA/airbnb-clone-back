/* eslint-disable object-curly-spacing */
import { Schema, model } from 'mongoose';

const PlaceSchema = new Schema({
	owner: { type: Schema.Types.ObjectId, ref: 'User' },
	title: String,
	address: String,
	photos: [String],
	description: String,
	perks: [String],
	extraInfo: String,
	checkIn: Number,
	checkOut: Number,
	maxGuests: Number,
});

export const PlaceModel = model('Place', PlaceSchema, 'places');
