const petModel = require('../models/petModel');
const serviceModel = require('../models/serviceModel');
const serviceBookingModel = require('../models/serviceBookingModel');

function isValidPositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  const asNumber = Number(value);
  return Number.isInteger(asNumber) && asNumber > 0;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidBookingDate(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const dateObject = new Date(year, month - 1, day);
  const isRealDate = (
    dateObject.getFullYear() === year &&
    dateObject.getMonth() === month - 1 &&
    dateObject.getDate() === day
  );

  if (!isRealDate) {
    return false;
  }

  const today = new Date();
  const todayString = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  return value >= todayString;
}

function listServices(req, res) {
  const ownerId = req.session.user.id;

  petModel.getPetsByOwner(ownerId, (petErr, pets) => {
    if (petErr) {
      console.error('Unable to load pets.', petErr);
      return res.status(500).send('Unable to load pets.');
    }

    let selectedPetId = '';
    const requestedPetId = req.query.petId;
    if (requestedPetId !== undefined && requestedPetId !== null && requestedPetId !== '') {
      const matchedPet = pets.find((pet) => String(pet.id) === String(requestedPetId));
      if (matchedPet) {
        selectedPetId = String(matchedPet.id);
      }
    }

    serviceModel.getActiveServices((serviceErr, services) => {
      if (serviceErr) {
        console.error('Unable to load services.', serviceErr);
        return res.status(500).send('Unable to load services.');
      }

      return res.render('services', {
        pets: pets || [],
        services: services || [],
        selectedPetId,
        today: formatLocalDate(new Date()),
        messages: req.flash('success'),
        errors: req.flash('error'),
        session: req.session
      });
    });
  });
}

function createBooking(req, res) {
  const ownerId = req.session.user.id;
  const rawPetId = req.body.petId;
  const rawServiceId = req.body.serviceId;
  const bookingDate = req.body.bookingDate;

  if (!isValidPositiveInteger(rawPetId) || !isValidPositiveInteger(rawServiceId) || !isValidBookingDate(bookingDate)) {
    req.flash('error', 'Choose a pet, service, and valid booking date.');
    return res.redirect('/services');
  }

  const redirectToService = (submittedPetId) => {
    if (isValidPositiveInteger(submittedPetId)) {
      return `/services?petId=${encodeURIComponent(submittedPetId)}`;
    }
    return '/services';
  };

  serviceBookingModel.createPendingBooking(ownerId, Number(rawPetId), Number(rawServiceId), bookingDate, (err, createdBooking) => {
    if (err) {
      console.error('Unable to create the booking. Please try again.', err);
      req.flash('error', 'Unable to create the booking. Please try again.');
      return res.redirect(redirectToService(rawPetId));
    }

    if (!createdBooking) {
      req.flash('error', 'That pet or service is unavailable for booking.');
      return res.redirect('/services');
    }

    req.flash('success', 'Booking created. Payment is pending; no payment has been processed.');
    return res.redirect('/bookings');
  });
}

function listBookings(req, res) {
  const ownerId = req.session.user.id;

  serviceBookingModel.getBookingsByOwner(ownerId, (err, bookings) => {
    if (err) {
      console.error('Unable to load booking history.', err);
      return res.status(500).send('Unable to load booking history.');
    }

    return res.render('bookings', {
      bookings: bookings || [],
      messages: req.flash('success'),
      errors: req.flash('error'),
      session: req.session
    });
  });
}

module.exports = {
  listServices,
  createBooking,
  listBookings
};
