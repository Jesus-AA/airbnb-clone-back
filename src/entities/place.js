/* eslint-disable object-curly-spacing */
import { Schema, model } from 'mongoose';

const PlaceSchema = new Schema({
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
