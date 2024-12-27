const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
})


app.get('/registrations', (req, res) => {
    const registrationsPath = path.join(__dirname, '/storage/registrations.json');
    const templatePath = path.join(__dirname, 'public', 'registrations.html');

    fs.readFile(registrationsPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading registrations:", err);
            return res.status(500).send("Server Error");
        }

        const registrations = JSON.parse(data);

        fs.readFile(templatePath, 'utf8', (err, htmlTemplate) => {
            if (err) {
                console.error("Error reading HTML template:", err);
                return res.status(500).send("Server Error");
            }

            const tableRows = registrations.map(reg => `
                <tr>
                    <td>${reg.first_name}</td>
                    <td>${reg.last_name}</td>
                    <td>${reg.email}</td>
                    <td>${reg.gender}</td>
                    <td>${reg.country}</td>
                    <td>${reg.state}</td>
                    <td>${reg.city}</td>
                    <td>${reg.dob}</td>
                </tr>
            `).join('');

            const finalHTML = htmlTemplate.replace("{{registrationsData}}", tableRows);

            res.send(finalHTML);
        });
    });
});


app.get('/countries', (req, res) => {
    const dataPath = path.join(__dirname, '/storage/countriesData.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            res.status(500).json({ error: "Failed to fetch countries data" });
        } else {
            res.json(JSON.parse(data));
        }
    });
})


app.post("/registration", (req, res) => {
    const registrationData = req.body;

    const errors = [];

    const dataPath = path.join(__dirname, "/storage/countriesData.json");
    let countriesData;
    try {
        const data = fs.readFileSync(dataPath, "utf8");
        countriesData = JSON.parse(data);
    } catch (error) {
        console.error("Error reading countries data:", errors);
        return res.status(500).json({ status: false, error: ["Server Side Error Occured"] });
    }

    if (!registrationData.first_name || registrationData.first_name.trim() === "") {
        errors.push("First name is required.");
    }

    if (!registrationData.last_name || registrationData.last_name.trim() === "") {
        errors.push("Last name is required.");
    }

    if (!registrationData.email || registrationData.email.trim() === "") {
        errors.push("Email is required.");
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registrationData.email.trim())) {
            errors.push("Invalid email format.");
        }
    }

    if ((registrationData.gender != 'Male') && (registrationData.gender != 'Female')) {
        errors.push("Gender must be 'Male' or 'Female'.");
    }

    if (!registrationData.dob || registrationData.dob.trim() === "") {
        errors.push("Date of birth is required.");
    } else {
        const today = new Date();
        const dob = new Date(registrationData.dob);
        const age = today.getFullYear() - dob.getFullYear() -
            (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        if (age < 14 || age > 99) {
            errors.push("Age must be between 14 and 99.");
        }
    }

    const findCountry = countriesData.find((country) => country.name === registrationData.country);
    if (!findCountry) {
        errors.push("Invalid country selected.");
    }

    const findState = findCountry?.states.find((state) => state.name === registrationData.state);
    if (!findState) {
        errors.push("Invalid state selected.");
    }

    if (!findState?.cities.includes(registrationData.city)) {
        errors.push("Invalid city selected.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: false, errors: errors });
    }

    const filePath = path.join(__dirname, "/storage/registrations.json");
    fs.readFile(filePath, "utf8", (err, data) => {
        let registrations = [];
        if (!err && data) {
            registrations = JSON.parse(data);
        }
        registrations.push(registrationData);

        fs.writeFile(filePath, JSON.stringify(registrations, null, 2), (err) => {
            if (err) {
                console.error("Error saving registration:", err);
                return res.status(500).json({ status: false, error: ["Failed to save registration data"] });
            }
            res.status(200).json({ status: true, message: "Registration saved successfully", redirectUrl: '/registrations' });
        });
    });

});




app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})