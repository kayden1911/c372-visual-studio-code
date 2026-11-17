const services = [
  { id: 1, name: 'Vaccination', price: 35 },
  { id: 2, name: 'Pet Grooming', price: 50 },
  { id: 3, name: 'Boarding', price: 80 }
];

function findServiceById(serviceId) {
  return services.find((service) => String(service.id) === serviceId);
}

module.exports = { findServiceById };
