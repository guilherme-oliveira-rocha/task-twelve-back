const {Router} = require("express")

const { 
    getInformations,
    searchInformations,
    saveInformations,
    getNewEmailsReceived,
    updateInformations, 
    deleteInformations 
} = require("../controller/informationController")

const router = Router();

router.get("/get", getInformations);
router.post("/search", searchInformations);
router.post("/create", saveInformations);
router.post("/", getNewEmailsReceived);
router.put("/update/:id", updateInformations);
router.delete("/delete/:id", deleteInformations);

module.exports = router;