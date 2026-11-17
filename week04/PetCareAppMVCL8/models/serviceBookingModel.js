const connection = require('../config/db');

function createPendingBooking(ownerId, petId, serviceId, bookingDate, callback) {
  connection.beginTransaction((transactionError) => {
    if (transactionError) {
      return callback(transactionError);
    }

    connection.query(
      'SELECT id, owner_id FROM pets WHERE id = ? AND owner_id = ? LIMIT 1',
      [petId, ownerId],
      (petError, petRows) => {
        if (petError) {
          return connection.rollback(() => callback(petError));
        }

        if (!petRows || petRows.length === 0) {
          return connection.rollback(() => callback(null, null));
        }

        connection.query(
          'SELECT id, price FROM services WHERE id = ? AND is_active = 1 LIMIT 1',
          [serviceId],
          (serviceError, serviceRows) => {
            if (serviceError) {
              return connection.rollback(() => callback(serviceError));
            }

            if (!serviceRows || serviceRows.length === 0) {
              return connection.rollback(() => callback(null, null));
            }

            const selectedService = serviceRows[0];

            connection.query(
              'INSERT INTO service_bookings (pet_id, service_id, booking_status, booked_price, booking_date) VALUES (?, ?, ?, ?, ?)',
              [petId, serviceId, 'pending', selectedService.price, bookingDate],
              (bookingError, bookingResult) => {
                if (bookingError) {
                  return connection.rollback(() => callback(bookingError));
                }

                if (!bookingResult || !bookingResult.insertId) {
                  return connection.rollback(() => callback(new Error('Failed to create booking.')));
                }

                connection.query(
                  'INSERT INTO payments (booking_id, amount, payment_status, payment_reference) VALUES (?, ?, ?, NULL)',
                  [bookingResult.insertId, selectedService.price, 'pending'],
                  (paymentError, paymentResult) => {
                    if (paymentError) {
                      return connection.rollback(() => callback(paymentError));
                    }

                    if (!paymentResult || !paymentResult.insertId) {
                      return connection.rollback(() => callback(new Error('Failed to create payment.')));
                    }

                    connection.commit((commitError) => {
                      if (commitError) {
                        return connection.rollback(() => callback(commitError));
                      }

                      return callback(null, {
                        bookingId: bookingResult.insertId,
                        paymentId: paymentResult.insertId
                      });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

function getBookingsByOwner(ownerId, callback) {
  const sql = `
    SELECT
      sb.id AS booking_id,
      DATE_FORMAT(sb.booking_date, '%Y-%m-%d') AS booking_date,
      p.name AS pet_name,
      s.name AS service_name,
      sb.booked_price,
      sb.booking_status,
      COALESCE(pay.payment_status, 'No payment record') AS payment_status
    FROM service_bookings AS sb
    JOIN pets AS p ON p.id = sb.pet_id
    JOIN services AS s ON s.id = sb.service_id
    LEFT JOIN payments AS pay ON pay.booking_id = sb.id
    WHERE p.owner_id = ?
    ORDER BY sb.created_at DESC, sb.id DESC
  `;

  connection.query(sql, [ownerId], callback);
}

module.exports = {
  createPendingBooking,
  getBookingsByOwner
};
