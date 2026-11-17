const express = require('express');
const upload = require('../config/upload');
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const petController = require('../controllers/petController');
const journalController = require('../controllers/journalController');

const router = express.Router();

router.get('/signup', authController.showSignup);
router.post('/signup', upload.single('pet_image'), authController.signup);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.get('/', authController.showIndex);

router.get('/admin/dashboard', isAdmin, adminController.showDashboard);
router.get('/admin/users', isAdmin, adminController.listUsers);
router.get('/admin/users', isAdmin, adminController.listUsersWithPets);
router.get('/admin/users/:id', isAdmin, adminController.showUserDetails);
router.get('/admin/users/delete/:id', isAdmin, adminController.deleteUser);

router.get('/pets/new', isLoggedIn, petController.showNewPet);
router.get('/pets/:id', isLoggedIn, petController.showProfile);
router.post('/pets', upload.single('pet_image'), isLoggedIn, petController.createPet);

router.get('/journals', isLoggedIn, journalController.listJournals);
router.get('/journals', isLoggedIn, journalController.listAllJournals);
router.get('/journals/new', isLoggedIn, journalController.showNewJournal);
router.get('/journals/new', isLoggedIn, journalController.showNewJournalWithoutSelection);
router.post('/journals/new', isLoggedIn, journalController.createJournal);
router.get('/journals/edit/:id', isLoggedIn, journalController.showEditJournal);
router.post('/journals/edit/:id', isLoggedIn, journalController.updateJournal);
router.get('/journals/delete/:id', isLoggedIn, journalController.deleteJournal);
router.get('/journals/delete/:id', journalController.deleteJournalWithoutAuth);
router.get('/journals/search', isLoggedIn, journalController.searchJournals);

module.exports = router;
