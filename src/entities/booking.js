/* eslint-disable object-curly-spacing */
import { Schema, model } from 'mongoose';

const BookingSchema = new Schema({
	place: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
	user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	checkIn: { type: Date, required: true },
	checkOut: { type: Date, required: true },
	name: { type: String, required: true },
	phone: { type: String, required: true },
	price: Number,
});

export const BookingModel = model('Booking', BookingSchema, 'bookings');
