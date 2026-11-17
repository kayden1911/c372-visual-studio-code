const petModel = require('../models/petModel');
const journalModel = require('../models/journalModel');

function listJournals(req, res) {
  const userId = req.session.user.id;
  let selectedPetId = req.query.petId;

  petModel.findPetsByOwner(userId, (err, pets) => {
    if (err) return res.send('Error loading pets');

    if (!selectedPetId && pets.length > 0) {
      selectedPetId = pets[0].id;
    }

    if (!selectedPetId) {
      return res.render('journals', {
        journals: [],
        pets,
        selectedPetId: '',
        pet: null,
        session: req.session
      });
    }

    journalModel.findJournalsByOwnerAndPet(userId, selectedPetId, (err2, journals) => {
      if (err2) return res.send('Error loading journals');

      const petInfo = pets.find(p => p.id == selectedPetId);
      return res.render('journals', {
        journals,
        pets,
        selectedPetId,
        pet: petInfo,
        session: req.session
      });
    });
  });
}

function listAllJournals(req, res) {
  const userId = req.session.user.id;
  journalModel.listJournalsForOwner(userId, (err, journals) => {
    res.render('journals', { journals, session: req.session });
  });
}

function showNewJournal(req, res) {
  const userId = req.session.user.id;
  const selectedPetId = req.query.petId;

  petModel.findPetsByOwner(userId, (err, pets) => {
    if (err) return res.send('Error loading pets');

    res.render('newJournal', { pets, session: req.session, selectedPetId });
  });
}

function showNewJournalWithoutSelection(req, res) {
  const userId = req.session.user.id;
  petModel.findPetsByOwner(userId, (err, pets) => {
    res.render('newJournal', { pets, session: req.session });
  });
}

function createJournal(req, res) {
  const { pet_id, activity, notes, entry_date } = req.body;
  journalModel.createJournal(pet_id, activity, notes, entry_date, (err) => {
    if (err) return res.send('Error saving journal');
    res.redirect(`/journals?petId=${pet_id}`);
  });
}

function showEditJournal(req, res) {
  const journalId = req.params.id;
  const userId = req.session.user.id;

  journalModel.findJournalById(journalId, (err, journalResults) => {
    if (err || journalResults.length === 0) return res.send('Journal not found');

    petModel.findPetsByOwner(userId, (err2, pets) => {
      if (err2) return res.send('Error fetching pets');

      res.render('editJournal', {
        journal: journalResults[0],
        pets,
        session: req.session
      });
    });
  });
}

function updateJournal(req, res) {
  const { entry_date, activity, notes, pet_id } = req.body;
  const journalId = req.params.id;

  journalModel.updateJournal(entry_date, activity, notes, pet_id, journalId, (err) => {
    if (err) return res.send('Error updating journal');
    res.redirect(`/journals?petId=${pet_id}`);
  });
}

function deleteJournal(req, res) {
  const journalId = req.params.id;

  journalModel.findPetIdForJournal(journalId, (err, result) => {
    if (err || result.length === 0) return res.send('Journal not found.');

    const petId = result[0].pet_id;
    journalModel.deleteJournal(journalId, (err2) => {
      if (err2) return res.send('Error deleting journal.');
      res.redirect(`/journals?petId=${petId}`);
    });
  });
}

function deleteJournalWithoutAuth(req, res) {
  journalModel.deleteJournal(req.params.id, () => {
    res.redirect('/journals');
  });
}

function searchJournals(req, res) {
  const userId = req.session.user.id;
  const searchQuery = `%${req.query.q}%`;
  const selectedPetId = req.query.petId;

  petModel.findPetsByOwner(userId, (err, pets) => {
    if (err) return res.send('Error loading pets');

    journalModel.searchJournals(userId, searchQuery, selectedPetId, (err2, journals) => {
      if (err2) return res.send('Error searching journals');

      let pet = null;
      if (selectedPetId) {
        const found = pets.find(p => p.id.toString() === selectedPetId);
        if (found) pet = found;
      }

      res.render('journals', {
        journals,
        pets,
        selectedPetId,
        pet,
        session: req.session
      });
    });
  });
}

module.exports = {
  listJournals,
  listAllJournals,
  showNewJournal,
  showNewJournalWithoutSelection,
  createJournal,
  showEditJournal,
  updateJournal,
  deleteJournal,
  deleteJournalWithoutAuth,
  searchJournals
};
